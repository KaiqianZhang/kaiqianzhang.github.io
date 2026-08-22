/* ---------------------------------------------------------------------------
   notes.js -- behaviour for Scratch Notes.

   The eight interactive labs across the two scratch notes. The figure
   driver, the maths and the control helpers all live in widgets.js, which is
   shared with the blog and loaded first.

   Each lab keeps its numbers in a plain object, recomputes them on every
   input event, and redraws its SVG from scratch. Redrawing everything is
   fast enough at these sizes and removes any chance of the drawing and the
   readout disagreeing.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  /* Every helper and the figure driver itself live in widgets.js, which is
     loaded first and shared with the blog. Aliased here so the labs below
     read the same as they did when they owned these functions. */
  var W = window.W;
  var el = W.el, clear = W.clear, $ = W.$, $$ = W.$$;
  var commas = W.commas, compact = W.compact;
  var softmax = W.softmax, kl = W.kl, seeded = W.seeded;
  var paintRange = W.paintRange, onInput = W.onInput, segment = W.segment;

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
  // 2e. Lab: the MoE budget
  // =========================================================================

  /* Per-expert size is solved from the published totals rather than quoted:
     Meta reports 109B total / 17B active over 16 experts and 400B / 17B over
     128, and with one routed expert per token those two facts pin the size of
     an expert and of the always-on remainder. */
  var MOE_PRESETS = {
    scout:    { experts: 16,  esize: 6.133, topk: 1, dense: 10.867 },
    maverick: { experts: 128, esize: 3.016, topk: 1, dense: 13.984 }
  };

  function initMoELab() {
    var root = document.getElementById('moe-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var experts = $(root, '#moe-experts');
    var esize = $(root, '#moe-esize');
    var topk = $(root, '#moe-topk');
    var dense = $(root, '#moe-dense');

    segment(root, '.seg-preset', function (value) {
      var preset = MOE_PRESETS[value];
      if (!preset) { return; }
      experts.value = preset.experts;
      esize.value = preset.esize;
      topk.value = preset.topk;
      dense.value = preset.dense;
      [experts, esize, topk, dense].forEach(paintRange);
      draw();
    });

    function draw() {
      var n = parseInt(experts.value, 10);
      var e = parseFloat(esize.value);
      var k = Math.min(parseInt(topk.value, 10), n);
      var dn = parseFloat(dense.value);

      var total = dn + n * e;
      var active = dn + k * e;
      var frac = active / total;

      $(root, '#moe-experts-v').textContent = n;
      $(root, '#moe-esize-v').textContent = e.toFixed(2) + ' B';
      $(root, '#moe-topk-v').textContent = k;
      $(root, '#moe-dense-v').textContent = dn.toFixed(2) + ' B';

      $(root, '#moe-stat-total').innerHTML =
          total.toFixed(0) + ' B <small>stored</small>';
      $(root, '#moe-stat-active').innerHTML =
          active.toFixed(1) + ' B <small>run</small>';
      $(root, '#moe-stat-ratio').innerHTML =
          (frac * 100).toFixed(1) + '% <small>of the weights</small>';

      var verdict = $(root, '#moe-verdict');
      // bf16 is two bytes a parameter; an H100 is 80GB.
      var cards = Math.ceil(total * 2 / 80);
      if (frac > 0.6) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'At ' + (frac * 100).toFixed(0) + '% awake ' +
            'this is barely a mixture — most of the model runs on every ' +
            'token, so you are paying dense compute for a sparse layout.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'Storing ' + total.toFixed(0) + ' B and running ' +
            active.toFixed(1) + ' B: about ' + cards + ' H100' +
            (cards === 1 ? '' : 's') + ' of memory at bf16 to hold weights ' +
            'that cost ' + (1 / frac).toFixed(1) + '× less than that to ' +
            'multiply against.';
      }

      // ---- the drawing ---------------------------------------------------
      clear(svg);
      // Enough columns that 128 experts still fit in a readable block.
      var cols = n <= 16 ? 8 : (n <= 64 ? 16 : 22);
      var cell = n <= 16 ? 30 : (n <= 64 ? 22 : 16);
      var gap = n <= 64 ? 5 : 3;
      var x0 = 40, y0 = 44;

      svg.appendChild(el('text', { x: x0, y: 26, 'class': 'lbl sm' },
                         n + ' routed experts, ' + k + ' run per token'));
      for (var i = 0; i < n; i++) {
        var on = i < k;
        svg.appendChild(el('rect', {
          x: x0 + (i % cols) * (cell + gap),
          y: y0 + Math.floor(i / cols) * (cell + gap),
          width: cell, height: cell, rx: 3, 'class': 'cell',
          fill: on ? 'var(--n-student)' : 'var(--n-grid)',
          stroke: on ? 'var(--n-student)' : 'var(--n-edge)',
          'stroke-width': on ? 1.6 : 1,
          'fill-opacity': on ? 0.92 : 1
        }));
      }
      var gridBottom = y0 + Math.ceil(n / cols) * (cell + gap) + 8;

      // The always-on block, drawn to the same area-per-billion as an expert.
      svg.appendChild(el('rect', {
        x: 470, y: y0, width: 190, height: 46, rx: 6, 'class': 'cell',
        fill: 'var(--n-kept)', 'fill-opacity': 0.9
      }));
      svg.appendChild(el('text', {
        x: 565, y: y0 + 28, 'class': 'lbl mid', fill: 'var(--n-on-fill)'
      }, 'always on'));
      svg.appendChild(el('text', {
        x: 565, y: y0 + 66, 'class': 'lbl sm mid'
      }, dn.toFixed(1) + ' B — attention, embeddings, shared expert'));

      // Two bars: everything stored, against what actually runs.
      var barY = Math.max(gridBottom + 18, 180);
      var barW = 620, scale = barW / Math.max(total, 1);
      svg.appendChild(el('text', { x: 40, y: barY - 6, 'class': 'lbl sm' },
                         'stored ' + total.toFixed(0) + ' B'));
      svg.appendChild(el('rect', {
        x: 40, y: barY, width: barW, height: 16, rx: 4,
        fill: 'var(--n-teacher)', 'fill-opacity': 0.85, 'class': 'bar'
      }));
      svg.appendChild(el('text', {
        x: 40, y: barY + 40, 'class': 'lbl sm'
      }, 'run ' + active.toFixed(1) + ' B'));
      svg.appendChild(el('rect', {
        x: 40, y: barY + 46, width: Math.max(2, active * scale), height: 16,
        rx: 4, fill: 'var(--n-student)', 'fill-opacity': 0.92, 'class': 'bar'
      }));
    }

    onInput(experts, draw);
    onInput(esize, draw);
    onInput(topk, draw);
    onInput(dense, draw);
    draw();
  }

  // =========================================================================
  // 2f. Lab: the iRoPE interleave
  // =========================================================================

  function initIRoPELab() {
    var root = document.getElementById('irope-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var layers = $(root, '#irope-layers');
    var period = $(root, '#irope-period');

    function draw() {
      var n = parseInt(layers.value, 10);
      var p = parseInt(period.value, 10);
      var nope = Math.floor(n / p);
      var rope = n - nope;

      $(root, '#irope-layers-v').textContent = n;
      $(root, '#irope-period-v').textContent = 'every ' + p;

      $(root, '#irope-stat-rope').innerHTML =
          rope + ' <small>with rotary</small>';
      $(root, '#irope-stat-nope').innerHTML =
          nope + ' <small>bare</small>';
      $(root, '#irope-stat-frac').innerHTML =
          (nope / n * 100).toFixed(0) + '%';

      var verdict = $(root, '#irope-verdict');
      if (p === 2) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Half the stack with no positional signal at ' +
            'all. Long-range structure has plenty of room, but the model has ' +
            'given up a lot of the machinery that resolves nearby order.';
      } else if (p >= 8) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Only ' + nope + ' bare layer' +
            (nope === 1 ? '' : 's') + ' in ' + n + '. Almost everything ' +
            'decays with distance again, which is the behaviour the ' +
            'interleave exists to avoid.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = rope + ' rotary layers resolve local order and ' +
            nope + ' bare ones carry the long range — the notebook’s ' +
            'example is exactly this at a period of 4.';
      }

      // ---- the drawing ---------------------------------------------------
      clear(svg);
      var x0 = 30, wMax = 640;
      var slot = wMax / n;
      var bw = Math.max(3, slot - Math.min(5, slot * 0.22));

      svg.appendChild(el('text', { x: x0, y: 26, 'class': 'lbl sm' },
                         'layer 1'));
      svg.appendChild(el('text', {
        x: x0 + wMax, y: 26, 'class': 'lbl sm end'
      }, 'layer ' + n));

      for (var i = 0; i < n; i++) {
        var bare = ((i + 1) % p) === 0;
        svg.appendChild(el('rect', {
          x: x0 + i * slot, y: 40, width: bw, height: 74, rx: 4,
          'class': 'cell',
          fill: bare ? 'var(--n-teacher)' : 'var(--n-student)',
          'fill-opacity': bare ? 0.92 : 0.22
        }));
      }

      var lg = [
        { c: 'var(--n-student)', o: 0.22, t: 'RoPE — local, the < 32k part' },
        { c: 'var(--n-teacher)', o: 0.92, t: 'NoPE — overall, the > 32k part' }
      ];
      lg.forEach(function (item, i) {
        var lx = x0 + i * 320;
        svg.appendChild(el('rect', {
          x: lx, y: 142, width: 13, height: 13, rx: 3,
          fill: item.c, 'fill-opacity': item.o
        }));
        svg.appendChild(el('text', {
          x: lx + 20, y: 153, 'class': 'lbl sm'
        }, item.t));
      });
      svg.appendChild(el('text', { x: x0, y: 180, 'class': 'lbl sm' },
                         'a bare layer still knows roughly where it is — a '
                         + 'token that can see 5,000 others is not at position 5'));
    }

    onInput(layers, draw);
    onInput(period, draw);
    draw();
  }

  // =========================================================================
  // 2g. Lab: temperature
  // =========================================================================

  function initTempLab() {
    var root = document.getElementById('temp-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var tIn = $(root, '#temp-t');
    var spread = $(root, '#temp-spread');
    var KEYS = 12;

    function draw() {
      var T = parseFloat(tIn.value);
      var sp = parseFloat(spread.value);

      // A fixed decaying logit profile, stretched by the spread control.
      var logits = [], i;
      for (i = 0; i < KEYS; i++) {
        logits.push(sp * (3.2 - 0.42 * i - 0.25 * Math.sin(i * 1.7)));
      }
      var probs = softmax(logits, T);

      var ent = 0;
      for (i = 0; i < probs.length; i++) {
        if (probs[i] > 1e-12) { ent -= probs[i] * Math.log(probs[i]); }
      }
      var eff = Math.exp(ent);

      $(root, '#temp-t-v').textContent = 'T = ' + T.toFixed(2);
      $(root, '#temp-spread-v').textContent = '×' + sp.toFixed(2);
      $(root, '#temp-stat-max').innerHTML =
          Math.max.apply(null, probs).toFixed(3);
      $(root, '#temp-stat-eff').innerHTML =
          eff.toFixed(1) + ' <small>of ' + KEYS + '</small>';
      $(root, '#temp-stat-ent').innerHTML =
          ent.toFixed(3) + ' <small>nats</small>';

      var verdict = $(root, '#temp-verdict');
      if (eff < 1.6) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Cold enough that the query reads essentially ' +
            'one key and ignores the rest — decisive, and brittle if the ' +
            'top-ranked key happens to be the wrong one.';
      } else if (eff > KEYS * 0.8) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Hot enough that all ' + KEYS + ' keys are ' +
            'read almost equally. The ordering is intact, but the query is ' +
            'barely pointing at anything — this is what attention fading ' +
            'looks like, arrived at on purpose.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'The query is effectively reading about ' +
            eff.toFixed(1) + ' of the ' + KEYS + ' keys. T never reorders ' +
            'them — the same key ranks first at every temperature.';
      }

      // ---- the drawing ---------------------------------------------------
      clear(svg);
      var x0 = 44, baseline = 172, wMax = 616;
      var slot = wMax / KEYS;
      var peak = Math.max.apply(null, probs);
      var scale = (baseline - 36) / Math.max(peak, 0.08);

      for (i = 0; i < KEYS; i++) {
        var h = Math.max(1.5, probs[i] * scale);
        svg.appendChild(el('rect', {
          x: x0 + i * slot + slot * 0.16, y: baseline - h,
          width: slot * 0.68, height: h, rx: 3, 'class': 'bar',
          fill: 'var(--n-student)', 'fill-opacity': 0.9
        }));
        svg.appendChild(el('text', {
          x: x0 + i * slot + slot / 2, y: baseline + 17,
          'class': 'lbl sm mid'
        }, 'k' + (i + 1)));
      }
      svg.appendChild(el('line', {
        x1: x0 - 6, y1: baseline, x2: x0 + wMax, y2: baseline,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4
      }));
      svg.appendChild(el('text', { x: x0 - 6, y: 26, 'class': 'lbl sm' },
                         'attention weight over 12 keys'));
      // A flat reference line: what "reads everything equally" would look like.
      var flat = baseline - (1 / KEYS) * scale;
      svg.appendChild(el('line', {
        x1: x0, y1: flat, x2: x0 + wMax, y2: flat, 'class': 'bar',
        stroke: 'var(--n-loss)', 'stroke-width': 1.6, 'stroke-dasharray': '5 4'
      }));
      svg.appendChild(el('text', {
        x: x0 + wMax, y: flat - 6, 'class': 'lbl sm end', fill: 'var(--n-loss)'
      }, 'uniform'));
      svg.appendChild(el('text', { x: x0, y: 210, 'class': 'lbl sm' },
                         'the dashed line is 1/12 — attention that has stopped '
                         + 'choosing'));
    }

    onInput(tIn, draw);
    onInput(spread, draw);
    draw();
  }

  // =========================================================================
  // 2h. Lab: softmax against SSMax
  // =========================================================================

  /* One needle of logit z among n-1 background logits at zero. Softmax gives
     the needle e^z / (e^z + n - 1); SSMax scales every logit by s*ln(n)
     first, so the needle's share climbs with n instead of collapsing. */
  function needleSoftmax(z, n) {
    var e = Math.exp(z);
    return e / (e + (n - 1));
  }

  function needleSSMax(z, n, s) {
    var a = s * Math.log(n);
    // exp overflows long before n does, so work in the log domain.
    var az = a * z;
    return 1 / (1 + Math.exp(Math.log(Math.max(n - 1, 1e-9)) - az));
  }

  function initSSMaxLab() {
    var root = document.getElementById('ssmax-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var nIn = $(root, '#ssmax-n');
    var sIn = $(root, '#ssmax-s');
    var zIn = $(root, '#ssmax-z');

    function draw() {
      var logN = parseFloat(nIn.value);
      var n = Math.pow(10, logN);
      var s = parseFloat(sIn.value);
      var z = parseFloat(zIn.value);

      var ps = needleSoftmax(z, n);
      var pk = needleSSMax(z, n, s);
      var scale = s * Math.log(n);

      $(root, '#ssmax-n-v').textContent =
          'n = ' + (n >= 1e4 ? '10^' + logN.toFixed(2) : commas(n));
      $(root, '#ssmax-s-v').textContent = 's = ' + s.toFixed(2);
      $(root, '#ssmax-z-v').textContent = 'z = ' + z.toFixed(1);

      $(root, '#ssmax-stat-soft').innerHTML =
          (ps < 0.001 ? ps.toExponential(1) : ps.toFixed(3));
      $(root, '#ssmax-stat-ss').innerHTML =
          (pk < 0.001 ? pk.toExponential(1) : pk.toFixed(3));
      $(root, '#ssmax-stat-temp').innerHTML =
          scale.toFixed(2) + (scale > 1 ? ' <small>&gt; 1</small>'
                                        : ' <small>&lt; 1</small>');

      var verdict = $(root, '#ssmax-verdict');
      if (scale <= 1) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'With s·ln n = ' + scale.toFixed(2) + ' the ' +
            'rescaling is below 1, so SSMax is flattening rather than ' +
            'sharpening. The paper’s condition is s·log n > 1 — that is ' +
            'what makes it a fix rather than another temperature.';
      } else if (ps < 0.02) {
        verdict.className = 'verdict';
        verdict.textContent = 'Softmax has ' +
            (ps < 0.001 ? ps.toExponential(1) : ps.toFixed(3)) +
            ' on the one key that matters; SSMax has ' + pk.toFixed(3) +
            ', about ' + Math.round(pk / Math.max(ps, 1e-12)) +
            '× more. This gap is the whole paper.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'At this length softmax still copes. Drag n ' +
            'right and watch its share fall while SSMax’s climbs — the ' +
            'two curves cross and then diverge.';
      }

      // ---- the drawing ---------------------------------------------------
      clear(svg);
      var x0 = 56, y0 = 30, w = 590, h = 170;
      var lo = 1, hi = 7;
      var toX = function (lg) { return x0 + (lg - lo) / (hi - lo) * w; };
      var toY = function (p) { return y0 + (1 - p) * h; };

      // Frame and gridlines.
      for (var g = 0; g <= 4; g++) {
        var gy = y0 + (g / 4) * h;
        svg.appendChild(el('line', {
          x1: x0, y1: gy, x2: x0 + w, y2: gy,
          stroke: 'var(--n-grid)', 'stroke-width': 1
        }));
        svg.appendChild(el('text', {
          x: x0 - 10, y: gy + 4, 'class': 'lbl sm end'
        }, (1 - g / 4).toFixed(2)));
      }
      for (var t = 1; t <= 7; t++) {
        svg.appendChild(el('text', {
          x: toX(t), y: y0 + h + 18, 'class': 'lbl sm mid'
        }, '10^' + t));
      }

      // The two curves.
      function curve(fn, colour, width) {
        var pts = [];
        for (var lg = lo; lg <= hi + 0.0001; lg += 0.06) {
          pts.push(toX(lg).toFixed(1) + ' ' + toY(fn(Math.pow(10, lg))).toFixed(1));
        }
        svg.appendChild(el('path', {
          d: 'M' + pts.join(' L'), fill: 'none', stroke: colour,
          'stroke-width': width, 'stroke-linejoin': 'round'
        }));
      }
      curve(function (nn) { return needleSoftmax(z, nn); },
            'var(--n-loss)', 2.4);
      curve(function (nn) { return needleSSMax(z, nn, s); },
            'var(--n-student)', 2.4);

      // The marker at the current n.
      svg.appendChild(el('line', {
        x1: toX(logN), y1: y0 - 6, x2: toX(logN), y2: y0 + h + 4,
        stroke: 'var(--n-dim)', 'stroke-width': 1.6,
        'stroke-dasharray': '5 4', 'class': 'bar'
      }));
      svg.appendChild(el('circle', {
        cx: toX(logN), cy: toY(ps), r: 5, fill: 'var(--n-loss)',
        'class': 'bar'
      }));
      svg.appendChild(el('circle', {
        cx: toX(logN), cy: toY(pk), r: 5, fill: 'var(--n-student)',
        'class': 'bar'
      }));

      svg.appendChild(el('text', { x: x0 - 46, y: 20, 'class': 'lbl sm' },
                         'weight on the needle'));
      // Below the tick row, not on it -- at this width the axis title and the
      // 10^6 / 10^7 labels land on the same pixels.
      svg.appendChild(el('text', {
        x: x0 + w, y: y0 + h + 38, 'class': 'lbl sm end'
      }, 'context length n'));

      var lg2 = [
        { c: 'var(--n-loss)', t: 'softmax' },
        { c: 'var(--n-student)', t: 'SSMax' }
      ];
      lg2.forEach(function (item, i) {
        var lx = x0 + i * 150;
        svg.appendChild(el('rect', {
          x: lx, y: 250, width: 13, height: 13, rx: 3, fill: item.c
        }));
        svg.appendChild(el('text', {
          x: lx + 20, y: 261, 'class': 'lbl sm'
        }, item.t));
      });
    }

    onInput(nIn, draw);
    onInput(sIn, draw);
    onInput(zIn, draw);
    draw();
  }

  // =========================================================================

  initTokenLab();
  initPruneLab();
  initDistillLab();
  initFFNLab();
  initMoELab();
  initIRoPELab();
  initTempLab();
  initSSMaxLab();
}());
