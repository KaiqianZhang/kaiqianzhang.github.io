/* ---------------------------------------------------------------------------
   notes.js -- behaviour for Scratch Notes.

   Two independent halves:

   1. The figure driver. Every `.nfig` starts paused; it begins its animation
      when it first scrolls into view and restarts when Replay is pressed.
      The CSS owns the choreography (see the `a-*` primitives in notes.css) --
      all this does is measure path lengths so `a-draw` knows how far to
      travel, and add or remove one class.

   2. The labs. Four draggable widgets. Each one keeps its numbers in a plain
      object, recomputes them on every input event, and redraws its SVG from
      scratch. Redrawing everything is fast enough at these sizes and removes
      any chance of the drawing and the readout disagreeing.

   Everything is namespaced under one IIFE and degrades to a static page if
   any single lab's markup is missing.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -- tiny helpers ---------------------------------------------------------

  function el(tag, attrs, text) {
    var node = document.createElementNS(SVG, tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k) &&
          attrs[k] !== null && attrs[k] !== undefined) {
        node.setAttribute(k, attrs[k]);
      }
    }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  function clear(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function commas(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* Compact counts: 8.0B, 525M, 14.3K. Used wherever a raw integer would be
     more precise than it is informative. */
  function compact(n) {
    var a = Math.abs(n);
    if (a >= 1e9) { return (n / 1e9).toFixed(2) + 'B'; }
    if (a >= 1e6) { return (n / 1e6).toFixed(0) + 'M'; }
    if (a >= 1e3) { return (n / 1e3).toFixed(1) + 'K'; }
    return String(Math.round(n));
  }

  function softmax(logits, temperature) {
    var t = temperature || 1;
    var max = -Infinity, i;
    for (i = 0; i < logits.length; i++) {
      if (logits[i] / t > max) { max = logits[i] / t; }
    }
    var exps = [], sum = 0;
    for (i = 0; i < logits.length; i++) {
      var e = Math.exp(logits[i] / t - max);
      exps.push(e);
      sum += e;
    }
    for (i = 0; i < exps.length; i++) { exps[i] /= sum; }
    return exps;
  }

  /* KL(P || Q) in nats, guarded so a zero in Q cannot return Infinity and
     blank the readout mid-drag. */
  function kl(p, q) {
    var total = 0;
    for (var i = 0; i < p.length; i++) {
      var pi = Math.max(p[i], 1e-12);
      var qi = Math.max(q[i], 1e-12);
      total += pi * Math.log(pi / qi);
    }
    return Math.max(total, 0);
  }

  /* A deterministic [0,1) stream. The labs need values that look organic but
     must be identical on every render and every reload, so nothing shifts
     under the reader when they drag a slider back and forth. */
  function seeded(seed) {
    var s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  /* Paint the filled part of a range track. WebKit has no ::-moz-range-progress
     equivalent, so the fill is a gradient stop driven by this variable. */
  function paintRange(input) {
    var min = parseFloat(input.min || 0);
    var max = parseFloat(input.max || 100);
    var pct = max === min ? 0 : (parseFloat(input.value) - min) / (max - min);
    input.style.setProperty('--pct', (pct * 100).toFixed(2) + '%');
  }

  function onInput(input, fn) {
    input.addEventListener('input', function () {
      paintRange(input);
      fn();
    });
    paintRange(input);
  }

  /* A segmented control: buttons with data-value, one pressed at a time. */
  function segment(root, sel, fn) {
    var group = $(root, sel);
    if (!group) { return function () { return null; }; }
    var buttons = $$(group, 'button');
    function set(value) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed',
                       b.dataset.value === value ? 'true' : 'false');
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        set(b.dataset.value);
        fn(b.dataset.value);
      });
    });
    return function () {
      var on = buttons.filter(function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      })[0] || buttons[0];
      return on ? on.dataset.value : null;
    };
  }

  // =========================================================================
  // 1. Figure animations
  // =========================================================================

  function initFigures() {
    var figures = $$(document, '.nfig');
    if (!figures.length) { return; }

    /* `a-draw` traces a stroke by animating dashoffset from the path's own
       length down to zero, so each path has to be measured before it can be
       animated. Doing it here rather than hard-coding --len in the markup
       keeps the figures editable. */
    figures.forEach(function (fig) {
      $$(fig, '.a-draw').forEach(function (path) {
        if (path.style.getPropertyValue('--len')) { return; }
        var len = 0;
        try { len = path.getTotalLength(); } catch (e) { len = 0; }
        if (len > 0) {
          path.style.setProperty('--len', Math.ceil(len + 2));
        }
      });
    });

    /* Every animated class, spelled out. A restart has to touch the exact
       elements, and `[class*="a-"]` would also catch anything else that
       happens to contain those two characters. */
    var ANIMATED = ['.a-draw', '.a-rise', '.a-fade', '.a-grow', '.a-wide',
                    '.a-pop', '.a-drop', '.a-slide', '.a-flow', '.a-beat',
                    '.a-glow', '.a-vanish'].join(',');

    function play(fig) {
      /* Toggling `is-playing` alone only flips animation-play-state, and
         every animation here is `forwards` -- once it has finished, resuming
         it just holds the last frame, so Replay appeared to do nothing. The
         animation has to be destroyed and rebuilt: drop it inline, force a
         reflow so the removal is committed, then hand it back. Clearing the
         inline value restores the stylesheet's own animation, delays and all,
         and leaves the --d custom properties on the element untouched. */
      var nodes = $$(fig, ANIMATED);
      fig.classList.remove('is-playing');
      nodes.forEach(function (node) { node.style.animation = 'none'; });
      void fig.offsetWidth;
      nodes.forEach(function (node) { node.style.animation = ''; });
      fig.classList.add('is-playing');
    }

    figures.forEach(function (fig) {
      var button = $(fig, '.replay');
      if (button) {
        button.addEventListener('click', function () { play(fig); });
      }
    });

    if (reduceMotion) {
      // The CSS already forces every figure to its finished state; marking
      // them played keeps the two halves consistent.
      figures.forEach(function (fig) { fig.classList.add('is-playing'); });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      figures.forEach(play);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        play(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

    figures.forEach(function (fig) { observer.observe(fig); });
  }

  // =========================================================================
  // 2a. Lab: tokenizer budget explorer
  // =========================================================================

  /* The arithmetic from the notebook, made draggable. A compression ratio is
     units of original text per token, so tokens = units / ratio and a window
     of W tokens holds W * ratio units. */

  var WINDOWS = [
    { name: '8K',   tokens: 8192 },
    { name: '32K',  tokens: 32768 },
    { name: '128K', tokens: 131072 }
  ];

  function initTokenLab() {
    var root = document.getElementById('tok-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var amount = $(root, '#tok-amount');
    var ratio = $(root, '#tok-ratio');
    var getLang = segment(root, '.seg-lang', function (value) {
      // Each language carries the notebook's own ratio, so switching gives
      // the reader the realistic number before they start exploring.
      ratio.value = value === 'zh' ? '1.5' : '0.75';
      paintRange(ratio);
      draw();
    });

    function unitName(lang, plural) {
      if (lang === 'zh') { return plural ? 'characters' : 'character'; }
      return plural ? 'words' : 'word';
    }

    function draw() {
      var lang = getLang() || 'en';
      var units = parseInt(amount.value, 10);
      var r = parseFloat(ratio.value);
      var tokens = units / r;

      $(root, '#tok-amount-v').textContent =
          commas(units) + ' ' + unitName(lang, true);
      $(root, '#tok-ratio-v').textContent =
          r.toFixed(2) + ' ' + unitName(lang, true) + ' / token';

      $(root, '#tok-stat-tokens').textContent = commas(tokens);
      $(root, '#tok-stat-ratio').innerHTML =
          r.toFixed(2) + ' <small>' + unitName(lang, true) + '/token</small>';

      // The smallest window that still holds the prompt.
      var smallest = null;
      WINDOWS.forEach(function (w) {
        if (!smallest && w.tokens >= tokens) { smallest = w; }
      });
      $(root, '#tok-stat-fit').textContent = smallest ? smallest.name : 'none';

      var verdict = $(root, '#tok-verdict');
      if (smallest) {
        verdict.className = 'verdict';
        verdict.textContent =
            commas(units) + ' ' + unitName(lang, true) + ' becomes ' +
            commas(tokens) + ' tokens, so the smallest window that receives ' +
            'and answers this prompt is ' + smallest.name + ' — ' +
            commas(smallest.tokens - tokens) + ' tokens spare for the answer.';
      } else {
        verdict.className = 'verdict bad';
        verdict.textContent =
            commas(units) + ' ' + unitName(lang, true) + ' becomes ' +
            commas(tokens) + ' tokens. Even a 128K window is ' +
            commas(tokens - 131072) + ' tokens short: the prompt is truncated ' +
            'before the model ever sees the end of it.';
      }

      // ---- the drawing -----------------------------------------------------
      clear(svg);
      var x0 = 74, wMax = 440, labelX = 690, rowY = [46, 106, 166];
      var caps = WINDOWS.map(function (w) { return w.tokens * r; });
      var domain = Math.max(caps[2], units) * 1.06;
      var toX = function (v) { return x0 + (v / domain) * wMax; };

      WINDOWS.forEach(function (w, i) {
        var y = rowY[i];
        var cap = caps[i];
        var fits = cap >= units;

        svg.appendChild(el('text', {
          x: x0 - 12, y: y + 15, 'class': 'lbl end'
        }, w.name));

        svg.appendChild(el('rect', {
          x: x0, y: y, width: wMax, height: 22, rx: 5,
          fill: 'var(--n-grid)'
        }));

        var bar = el('rect', {
          x: x0, y: y, width: Math.max(2, toX(cap) - x0), height: 22, rx: 5,
          'class': 'bar',
          fill: fits ? 'var(--n-kept)' : 'var(--n-pruned)',
          'fill-opacity': 0.9
        });
        svg.appendChild(bar);

        svg.appendChild(el('text', {
          x: labelX, y: y + 15, 'class': 'lbl sm end'
        }, 'holds ' + commas(cap) + ' ' + unitName(lang, true)));
      });

      // The prompt itself: one vertical rule crossing all three windows.
      var px = toX(units);
      svg.appendChild(el('line', {
        x1: px, y1: 26, x2: px, y2: 200,
        stroke: 'var(--n-data)', 'stroke-width': 2.4,
        'stroke-dasharray': '6 5', 'class': 'bar'
      }));
      svg.appendChild(el('text', {
        x: px, y: 18, 'class': 'lbl mid', fill: 'var(--n-data)'
      }, 'your prompt'));
      svg.appendChild(el('text', {
        x: px, y: 216, 'class': 'lbl sm mid', fill: 'var(--n-data)'
      }, commas(units) + ' ' + unitName(lang, true)));
    }

    onInput(amount, draw);
    onInput(ratio, draw);
    draw();
  }

  // =========================================================================
  // 2b. Lab: pruning sweep
  // =========================================================================

  /* Llama 3.1 8B, as released: 32 layers, hidden 4096, MLP intermediate
     14336, 32 query heads over 8 key/value heads (head dim 128), vocabulary
     128256 with an untied output head. Every parameter count below is
     computed from these, so the numbers the reader drags are the real ones --
     at 50% depth the panel lands on 4.5B, which is exactly the size NVIDIA
     published for Llama-3.1-Minitron-4B. */

  var BASE = {
    layers: 32, hidden: 4096, ffn: 14336,
    heads: 32, kvHeads: 8, headDim: 128, vocab: 128256
  };

  function paramCount(cfg) {
    var attn = cfg.hidden * cfg.heads * BASE.headDim          // W_q
             + 2 * cfg.hidden * cfg.kvHeads * BASE.headDim    // W_k, W_v
             + cfg.heads * BASE.headDim * cfg.hidden;         // W_o
    var mlp = 3 * cfg.hidden * cfg.ffn;                       // gate, up, down
    var norms = 2 * cfg.hidden;
    var embed = 2 * BASE.vocab * cfg.hidden;                  // input + lm_head
    return cfg.layers * (attn + mlp + norms) + embed + cfg.hidden;
  }

  var AXES = {
    depth: { units: 32, label: 'layers', seed: 7,
             note: 'whole decoder blocks removed' },
    heads: { units: 32, label: 'attention heads', seed: 23,
             note: 'query heads removed, KV groups shrink with them' },
    mlp:   { units: 56, label: 'MLP neurons (sampled)', seed: 41,
             note: 'columns of the intermediate dimension removed' },
    embed: { units: 64, label: 'embedding channels (sampled)', seed: 89,
             note: 'channels removed from the residual stream itself' }
  };

  /* Importance scores per unit, in model order. Deterministic, and shaped so
     the picture matches what the papers report: the first and last blocks
     matter most and the run of middle-to-late blocks is where the slack is. */
  function importanceFor(axis) {
    var spec = AXES[axis];
    var rand = seeded(spec.seed);
    var n = spec.units;
    var out = [];
    for (var i = 0; i < n; i++) {
      var pos = i / (n - 1);
      var shape;
      if (axis === 'depth') {
        shape = 0.42 + 0.58 * Math.pow(Math.abs(pos - 0.62) / 0.62, 1.35);
      } else {
        shape = 0.30 + 0.70 * Math.pow(1 - pos, 0.85);
      }
      out.push(Math.min(1, Math.max(0.04, shape * (0.72 + 0.56 * rand()))));
    }
    return out;
  }

  function initPruneLab() {
    var root = document.getElementById('prune-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var slider = $(root, '#prune-ratio');
    var axis = 'depth';
    var getAxis = segment(root, '.seg-axis', function (value) {
      axis = value;
      draw();
    });

    function configFor(p) {
      var cfg = {
        layers: BASE.layers, hidden: BASE.hidden, ffn: BASE.ffn,
        heads: BASE.heads, kvHeads: BASE.kvHeads
      };
      var keep = 1 - p;
      if (axis === 'depth') {
        cfg.layers = Math.max(1, Math.round(BASE.layers * keep));
      } else if (axis === 'heads') {
        cfg.heads = Math.max(1, Math.round(BASE.heads * keep));
        // Grouped-query attention keeps whole KV groups, so the KV count
        // follows the query count rather than being pruned on its own.
        cfg.kvHeads = Math.max(1, Math.round(BASE.kvHeads *
                                             (cfg.heads / BASE.heads)));
      } else if (axis === 'mlp') {
        cfg.ffn = Math.max(128, Math.round(BASE.ffn * keep / 128) * 128);
      } else {
        cfg.hidden = Math.max(128, Math.round(BASE.hidden * keep / 128) * 128);
      }
      return cfg;
    }

    function draw() {
      axis = getAxis() || axis;
      var spec = AXES[axis];
      var p = parseInt(slider.value, 10) / 100;
      var cfg = configFor(p);
      var params = paramCount(cfg);
      var base = paramCount({
        layers: BASE.layers, hidden: BASE.hidden, ffn: BASE.ffn,
        heads: BASE.heads, kvHeads: BASE.kvHeads
      });

      $(root, '#prune-ratio-v').textContent = Math.round(p * 100) + '%';
      $(root, '#prune-stat-params').innerHTML =
          compact(params) + ' <small>of ' + compact(base) + '</small>';
      $(root, '#prune-stat-shape').innerHTML =
          cfg.layers + 'L <small>&times;</small> ' + cfg.hidden +
          'd <small>&times;</small> ' + cfg.ffn + 'f';

      // A memory-bound decode proxy: everything except the embedding tables
      // has to be read once per token, so the ratio of non-embedding
      // parameters is the honest first-order estimate.
      var nonEmbed = params - 2 * BASE.vocab * cfg.hidden;
      var baseNonEmbed = base - 2 * BASE.vocab * BASE.hidden;
      var speedup = baseNonEmbed / Math.max(nonEmbed, 1);
      $(root, '#prune-stat-speed').innerHTML =
          speedup.toFixed(2) + '&times; <small>proxy</small>';

      var verdict = $(root, '#prune-verdict');
      if (p === 0) {
        verdict.className = 'verdict';
        verdict.textContent = 'Nothing pruned yet. Drag the slider and the ' +
            'lowest-ranked ' + spec.label + ' leave first — ' + spec.note +
            '.';
      } else if (p <= 0.55) {
        verdict.className = 'verdict';
        verdict.textContent = 'Removing the ' + Math.round(p * 100) +
            '% least important ' + spec.label + ' leaves ' + compact(params) +
            ' parameters. This is the regime the Minitron work stays inside: ' +
            'a 2–4× cut that distillation can retrain back.';
      } else {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Past roughly half, single-shot pruning starts ' +
            'taking units that were carrying real work. NVIDIA report that a ' +
            'depth cut this deep needs intermediate-state and embedding ' +
            'distillation, not logit distillation alone, to recover.';
      }

      // ---- the drawing -----------------------------------------------------
      clear(svg);
      var scores = importanceFor(axis);
      var n = scores.length;
      var cut = Math.round(n * p);

      // Ranked order, lowest importance first, so the trimmed set is the
      // first `cut` entries of this list.
      var order = scores.map(function (v, i) { return { v: v, i: i }; })
                        .sort(function (a, b) { return a.v - b.v; });
      var pruned = {};
      order.slice(0, cut).forEach(function (u) { pruned[u.i] = true; });

      var x0 = 40, wMax = 600;
      var slot = wMax / n;
      var bw = Math.max(3, slot - Math.min(4, slot * 0.28));

      function bars(y, baseline, list, showCut) {
        list.forEach(function (u, k) {
          var x = x0 + k * slot + (slot - bw) / 2;
          var h = 8 + u.v * (baseline - y - 10);
          var isPruned = pruned[u.i];
          svg.appendChild(el('rect', {
            x: x, y: baseline - h, width: bw, height: h, rx: 2,
            'class': 'cell',
            fill: isPruned ? 'var(--n-pruned)' : 'var(--n-kept)',
            'fill-opacity': isPruned ? 0.32 : 0.92
          }));
        });
        if (showCut && cut > 0 && cut < n) {
          var cx = x0 + cut * slot;
          svg.appendChild(el('line', {
            x1: cx, y1: y - 6, x2: cx, y2: baseline + 6,
            stroke: 'var(--n-rose)', 'stroke-width': 2,
            'stroke-dasharray': '5 4', 'class': 'bar'
          }));
          svg.appendChild(el('text', {
            x: cx + 6, y: y + 4, 'class': 'lbl sm', fill: 'var(--n-rose)'
          }, 'cut'));
        }
      }

      svg.appendChild(el('text', { x: x0, y: 16, 'class': 'lbl' },
                         '❨1❩ importance in model order'));
      svg.appendChild(el('text', {
        x: x0 + wMax, y: 16, 'class': 'lbl sm end'
      }, spec.label + ' →'));
      bars(26, 118, scores.map(function (v, i) { return { v: v, i: i }; }),
           false);
      svg.appendChild(el('line', {
        x1: x0, y1: 118, x2: x0 + wMax, y2: 118,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4
      }));

      svg.appendChild(el('text', { x: x0, y: 158, 'class': 'lbl' },
                         '❨2❩ ranked, then trimmed'));
      bars(168, 260, order, true);
      svg.appendChild(el('line', {
        x1: x0, y1: 260, x2: x0 + wMax, y2: 260,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4
      }));
      svg.appendChild(el('text', {
        x: x0, y: 278, 'class': 'lbl sm'
      }, 'least important'));
      svg.appendChild(el('text', {
        x: x0 + wMax, y: 278, 'class': 'lbl sm end'
      }, 'most important'));
    }

    onInput(slider, draw);
    draw();
  }

  // =========================================================================
  // 2c. Lab: distillation loss mixer
  // =========================================================================

  var VOCAB = ['mat', 'floor', 'sofa', 'chair', 'table', 'bed', 'roof', 'sky'];
  // The teacher has an opinion; the untrained student mostly does not.
  var TEACHER_LOGITS = [4.2, 2.8, 2.1, 1.4, 0.9, 0.3, -0.4, -1.2];
  var STUDENT_START   = [0.6, 1.1, 0.4, 2.6, 0.2, 1.8, 0.9, 1.3];

  function initDistillLab() {
    var root = document.getElementById('distill-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var temp = $(root, '#kd-temp');
    var prog = $(root, '#kd-prog');
    var alpha = $(root, '#kd-alpha');
    var beta = $(root, '#kd-beta');
    var getDir = segment(root, '.seg-dir', function () { draw(); });

    function draw() {
      var T = parseFloat(temp.value);
      var t = parseInt(prog.value, 10) / 100;
      var a = parseFloat(alpha.value);
      var b = parseFloat(beta.value);
      var dir = getDir() || 'sq';

      // Training moves the student's logits toward the teacher's.
      var studentLogits = STUDENT_START.map(function (s, i) {
        return s + (TEACHER_LOGITS[i] - s) * t;
      });
      var teacher = softmax(TEACHER_LOGITS, T);
      var student = softmax(studentLogits, T);

      var klST = kl(student, teacher);   // KL(student || teacher)
      var klTS = kl(teacher, student);   // KL(teacher || student)
      var kl1 = dir === 'sq' ? klST : klTS;

      /* A stand-in for the second term in L = a*KL1 + b*KL2. Hidden-state
         agreement is not a vocabulary distribution, so there is nothing
         honest to compute from these eight numbers -- this is a plausible
         decay curve, labelled as illustrative in the caption, present so the
         reader can feel what the two weights trade off against. */
      var kl2 = 1.35 * Math.pow(1 - t, 1.4) + 0.06;
      var total = a * kl1 + b * kl2;

      $(root, '#kd-temp-v').textContent = 'T = ' + T.toFixed(1);
      $(root, '#kd-prog-v').textContent = Math.round(t * 100) + '%';
      $(root, '#kd-alpha-v').textContent = 'α = ' + a.toFixed(2);
      $(root, '#kd-beta-v').textContent = 'β = ' + b.toFixed(2);

      $(root, '#kd-stat-kl1').innerHTML =
          kl1.toFixed(3) + ' <small>nats</small>';
      $(root, '#kd-stat-kl2').innerHTML =
          kl2.toFixed(3) + ' <small>illustrative</small>';
      $(root, '#kd-stat-total').innerHTML =
          total.toFixed(3) + ' <small>= α·KL₁ + β·KL₂</small>';

      var verdict = $(root, '#kd-verdict');
      var gap = Math.abs(klST - klTS);
      if (t > 0.985) {
        verdict.className = 'verdict';
        verdict.textContent = 'The student now matches the teacher token for ' +
            'token, so KL₁ has collapsed to zero and there is no gradient ' +
            'left to give. Both directions of the KL agree here — they ' +
            'only disagree while the two distributions differ.';
      } else if (gap > 0.25) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'The two directions disagree by ' +
            gap.toFixed(2) + ' nats. KL(student‖teacher) punishes the ' +
            'student for putting mass where the teacher put none; ' +
            'KL(teacher‖student) punishes it for missing mass the ' +
            'teacher had. Minitron minimises the forward KL, the second one.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'Raising T flattens both distributions, which ' +
            'shrinks the KL and hands the student more information about the ' +
            'teacher’s ranking of the wrong answers, not just its top one.';
      }

      // ---- the drawing -----------------------------------------------------
      clear(svg);
      var x0 = 46, wMax = 578, baseline = 176;
      var slot = wMax / VOCAB.length;
      var bw = slot * 0.30;
      var peak = Math.max.apply(null, teacher.concat(student));
      var scale = (baseline - 40) / Math.max(peak, 0.12);

      VOCAB.forEach(function (word, i) {
        var cx = x0 + i * slot + slot / 2;
        var th = Math.max(1.5, teacher[i] * scale);
        var sh = Math.max(1.5, student[i] * scale);

        svg.appendChild(el('rect', {
          x: cx - bw - 3, y: baseline - th, width: bw, height: th, rx: 3,
          'class': 'cell', fill: 'var(--n-teacher)', 'fill-opacity': 0.9
        }));
        svg.appendChild(el('rect', {
          x: cx + 3, y: baseline - sh, width: bw, height: sh, rx: 3,
          'class': 'cell', fill: 'var(--n-student)', 'fill-opacity': 0.9
        }));
        svg.appendChild(el('text', {
          x: cx, y: baseline + 17, 'class': 'lbl sm mid'
        }, word));
      });

      svg.appendChild(el('line', {
        x1: x0, y1: baseline, x2: x0 + wMax, y2: baseline,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4
      }));
      svg.appendChild(el('text', {
        x: x0 - 8, y: baseline + 4, 'class': 'lbl sm end'
      }, '0'));
      svg.appendChild(el('text', {
        x: x0, y: 18, 'class': 'lbl sm'
      }, '“the cat sat on the …”  —  p(next token) after softmax(logits / T)'));

      // Legend.
      var lg = [
        { c: 'var(--n-teacher)', t: 'teacher (frozen)' },
        { c: 'var(--n-student)', t: 'student (learning)' }
      ];
      lg.forEach(function (item, i) {
        var lx = x0 + 300 + i * 150;
        svg.appendChild(el('rect', {
          x: lx, y: 206, width: 11, height: 11, rx: 2, fill: item.c
        }));
        svg.appendChild(el('text', {
          x: lx + 17, y: 216, 'class': 'lbl sm'
        }, item.t));
      });

      // The loss bar: the two weighted terms, stacked.
      var lossW = 250;
      var maxLoss = Math.max(total, 1.2);
      var w1 = (a * kl1 / maxLoss) * lossW;
      var w2 = (b * kl2 / maxLoss) * lossW;
      svg.appendChild(el('text', { x: x0, y: 216, 'class': 'lbl sm' },
                         'L = α·KL₁ + β·KL₂'));
      svg.appendChild(el('rect', {
        x: x0, y: 224, width: lossW, height: 14, rx: 4, fill: 'var(--n-grid)'
      }));
      svg.appendChild(el('rect', {
        x: x0, y: 224, width: Math.max(0, w1), height: 14, rx: 4,
        'class': 'bar', fill: 'var(--n-loss)', 'fill-opacity': 0.92
      }));
      svg.appendChild(el('rect', {
        x: x0 + Math.max(0, w1), y: 224, width: Math.max(0, w2), height: 14,
        rx: 4, 'class': 'bar', fill: 'var(--n-lav)', 'fill-opacity': 0.85
      }));
    }

    onInput(temp, draw);
    onInput(prog, draw);
    onInput(alpha, draw);
    onInput(beta, draw);
    draw();
  }

  // =========================================================================
  // 2d. Lab: FFN / SwiGLU width explorer
  // =========================================================================

  function initFFNLab() {
    var root = document.getElementById('ffn-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var dm = $(root, '#ffn-dmodel');
    var mult = $(root, '#ffn-mult');
    var getKind = segment(root, '.seg-kind', function () { draw(); });

    function draw() {
      var dModel = parseInt(dm.value, 10);
      var m = parseFloat(mult.value);
      var dFF = Math.max(128, Math.round(dModel * m / 128) * 128);
      var kind = getKind() || 'swiglu';
      var gated = kind === 'swiglu';

      var matrices = gated ? 3 : 2;
      var params = matrices * dModel * dFF;
      // A plain FFN at 4x is the reference point every gated variant is sized
      // against: three matrices at 8/3 x cost exactly what two matrices at 4x
      // cost, which is why Llama's 14336 sits near 3.5x rather than at 4x.
      var reference = 2 * dModel * (dModel * 4);
      var equalMult = 8 / 3;

      $(root, '#ffn-dmodel-v').textContent = 'd_model = ' + commas(dModel);
      $(root, '#ffn-mult-v').textContent =
          m.toFixed(2) + '×  →  d_ff = ' + commas(dFF);
      $(root, '#ffn-stat-params').innerHTML =
          compact(params) + ' <small>per block</small>';
      $(root, '#ffn-stat-mats').innerHTML =
          matrices + ' <small>matrices</small>';
      $(root, '#ffn-stat-vs').innerHTML =
          (params / reference).toFixed(2) + '× <small>vs plain 4×</small>';

      var verdict = $(root, '#ffn-verdict');
      if (!gated) {
        verdict.className = 'verdict';
        verdict.textContent = 'Plain FFN: up-project, bend, down-project. ' +
            'Two matrices, so the parameter count is 2 · d_model · d_ff.';
      } else if (Math.abs(m - equalMult) < 0.12) {
        verdict.className = 'verdict';
        verdict.textContent = 'At about 8/3 × the gated block costs the ' +
            'same as a plain FFN at 4× — three matrices at two-thirds ' +
            'the width. This is why gated models quote odd expansion factors.';
      } else if (m > equalMult) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Three matrices at ' + m.toFixed(2) +
            '× cost ' + (params / reference).toFixed(2) +
            '× a plain 4× FFN. Llama 3 8B sits at 14336 over 4096, ' +
            'which is 3.5× — deliberately above the break-even point.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'Below 8/3 × the gated block is cheaper ' +
            'than a plain 4× FFN, at the cost of a narrower intermediate ' +
            'dimension for the same residual width.';
      }

      // ---- the drawing -----------------------------------------------------
      clear(svg);
      // Heights are proportional but clamped: at 8192 x 6 the raw d_ff
      // slab would be two and a half times the height of the frame.
      var cy = 140;
      var hModel = Math.max(14, Math.min(120, (dModel / 8192) * 108));
      var hFF = Math.max(14, Math.min(150, (dFF / 8192) * 108));

      function slab(x, w, h, colour, label, dim) {
        svg.appendChild(el('rect', {
          x: x, y: cy - h / 2, width: w, height: h, rx: 4,
          'class': 'cell', fill: colour, 'fill-opacity': 0.85
        }));
        svg.appendChild(el('text', {
          x: x + w / 2, y: cy - h / 2 - 9, 'class': 'lbl sm mid'
        }, label));
        svg.appendChild(el('text', {
          x: x + w / 2, y: cy + h / 2 + 17, 'class': 'lbl sm mid'
        }, dim));
      }

      function arrow(x1, x2, y, label, colour) {
        svg.appendChild(el('path', {
          d: 'M' + x1 + ' ' + y + ' L' + (x2 - 7) + ' ' + y,
          stroke: colour || 'var(--n-dim)', 'stroke-width': 1.8,
          fill: 'none', 'stroke-linecap': 'round'
        }));
        svg.appendChild(el('path', {
          d: 'M' + (x2 - 9) + ' ' + (y - 4.5) + ' L' + x2 + ' ' + y +
             ' L' + (x2 - 9) + ' ' + (y + 4.5),
          stroke: colour || 'var(--n-dim)', 'stroke-width': 1.8,
          fill: 'none', 'stroke-linejoin': 'round'
        }));
        if (label) {
          svg.appendChild(el('text', {
            x: (x1 + x2) / 2, y: y - 8, 'class': 'lbl sm mid',
            fill: colour || 'var(--n-dim)'
          }, label));
        }
      }

      slab(28, 34, hModel, 'var(--n-student)', 'x', commas(dModel));

      if (!gated) {
        arrow(66, 176, cy, 'W₁', 'var(--n-lav)');
        slab(180, 44, hFF, 'var(--n-teal)', 'σ(W₁x + b₁)',
             commas(dFF));
        arrow(228, 352, cy, 'GELU / ReLU / SiLU', 'var(--n-sage)');
        slab(356, 44, hFF, 'var(--n-teal)', 'activated', commas(dFF));
        arrow(404, 556, cy, 'W₂', 'var(--n-lav)');
        slab(560, 34, hModel, 'var(--n-student)', 'FFN(x)', commas(dModel));
      } else {
        var gy = cy - 62, uy = cy + 62;
        arrow(66, 176, gy, 'W_gate', 'var(--n-lav)');
        arrow(66, 176, uy, 'W_up', 'var(--n-clay)');
        svg.appendChild(el('path', {
          d: 'M62 ' + cy + ' C110 ' + cy + ', 110 ' + gy + ', 170 ' + gy,
          fill: 'none', stroke: 'var(--n-edge)', 'stroke-width': 1.2
        }));
        svg.appendChild(el('path', {
          d: 'M62 ' + cy + ' C110 ' + cy + ', 110 ' + uy + ', 170 ' + uy,
          fill: 'none', stroke: 'var(--n-edge)', 'stroke-width': 1.2
        }));

        var gh = Math.max(10, Math.min(110, hFF * 0.62));
        svg.appendChild(el('rect', {
          x: 180, y: gy - gh / 2, width: 44, height: gh, rx: 4,
          'class': 'cell', fill: 'var(--n-lav)', 'fill-opacity': 0.85
        }));
        svg.appendChild(el('text', {
          x: 202, y: gy - gh / 2 - 9, 'class': 'lbl sm mid'
        }, 'SiLU(W_gate x)'));
        svg.appendChild(el('rect', {
          x: 180, y: uy - gh / 2, width: 44, height: gh, rx: 4,
          'class': 'cell', fill: 'var(--n-clay)', 'fill-opacity': 0.85
        }));
        svg.appendChild(el('text', {
          x: 202, y: uy + gh / 2 + 17, 'class': 'lbl sm mid'
        }, 'W_up x'));
        svg.appendChild(el('text', {
          x: 202, y: uy - gh / 2 - 9, 'class': 'lbl sm mid'
        }, commas(dFF)));

        svg.appendChild(el('path', {
          d: 'M228 ' + gy + ' C286 ' + gy + ', 286 ' + cy + ', 330 ' + cy,
          fill: 'none', stroke: 'var(--n-lav)', 'stroke-width': 1.8
        }));
        svg.appendChild(el('path', {
          d: 'M228 ' + uy + ' C286 ' + uy + ', 286 ' + cy + ', 330 ' + cy,
          fill: 'none', stroke: 'var(--n-clay)', 'stroke-width': 1.8
        }));
        svg.appendChild(el('circle', {
          cx: 344, cy: cy, r: 14, fill: 'var(--n-panel)',
          stroke: 'var(--n-rose)', 'stroke-width': 2
        }));
        svg.appendChild(el('text', {
          x: 344, y: cy + 5, 'class': 'lbl mid', fill: 'var(--n-rose)'
        }, '⊙'));
        svg.appendChild(el('text', {
          x: 344, y: cy + 34, 'class': 'lbl sm mid'
        }, 'element-wise'));

        arrow(360, 556, cy, 'W_down', 'var(--n-lav)');
        slab(560, 34, hModel, 'var(--n-student)', 'FFN(x)', commas(dModel));
      }
    }

    onInput(dm, draw);
    onInput(mult, draw);
    draw();
  }

  // =========================================================================

  initFigures();
  initTokenLab();
  initPruneLab();
  initDistillLab();
  initFFNLab();
}());
