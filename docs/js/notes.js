/* ---------------------------------------------------------------------------
   notes.js -- behaviour for Research Notes.

   The eight interactive labs across the two research notes. The figure
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
  // 2i. The decoder map -- the interactive figure in the Llama 3 note.
  // =========================================================================

  /* Not a lab: no sliders, no redraw. A static roadmap of one decoder layer
     where every box reveals in two stages. Clicking the box body opens the
     tensor it produces and that tensor's shape (teal); clicking the `code`
     chip opens the lines behind it (plum). The two are independent, so a
     reader can hold the shape and the code side by side. A small entrance
     stagger plays when the map first scrolls into view, and again on Replay --
     additive only, so the map stays fully readable if this never runs. */
  function initDecoderRoadmap() {
    var map = document.querySelector('.decoder-map');
    if (!map) { return; }

    map.addEventListener('click', function (e) {
      // The `code` chip: only the ones inside a step do anything -- the one in
      // the header is a legend and stays inert.
      var chip = e.target.closest('.dm-code-btn');
      if (chip) {
        var stepC = chip.closest('.dm-step');
        if (stepC) {
          e.stopPropagation();
          stepC.classList.toggle('code-open');
        }
        return;
      }
      var box = e.target.closest('.dm-box');
      if (box) {
        var step = box.closest('.dm-step');
        var open = step.classList.toggle('io-open');
        box.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    });

    function play() {
      map.classList.remove('playing');
      void map.offsetWidth;      // commit the removal so the animation restarts
      map.classList.add('playing');
    }
    var replay = map.querySelector('.dm-replay');
    if (replay) { replay.addEventListener('click', play); }

    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { play(); io.disconnect(); }
        });
      }, { threshold: 0.12 });
      io.observe(map);
    } else {
      play();
    }
  }

  // =========================================================================
  // 3a. Lab: what one number hides
  // =========================================================================

  /* Pure arithmetic on the model in Note 1. A study that reports one effect
     per variant-gene pair reports the cell-weighted average; these sliders
     set the two underlying effects and show what that average costs. No
     fitted quantity appears anywhere -- the reader supplies the truth. */

  function initAvgLab() {
    var root = document.getElementById('rg-avg-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var e1 = $(root, '#rg-e1'), e2 = $(root, '#rg-e2'), mix = $(root, '#rg-mix');

    function draw() {
      var a = parseFloat(e1.value), b = parseFloat(e2.value);
      var w = parseFloat(mix.value);
      var avg = w * a + (1 - w) * b;

      $(root, '#rg-e1-v').textContent = (a >= 0 ? '+' : '') + a.toFixed(2);
      $(root, '#rg-e2-v').textContent = (b >= 0 ? '+' : '') + b.toFixed(2);
      $(root, '#rg-mix-v').textContent = Math.round(w * 100) + '% in setting 1';

      $(root, '#rg-stat-avg').textContent = (avg >= 0 ? '+' : '') + avg.toFixed(2);
      $(root, '#rg-stat-miss1').textContent = Math.abs(a - avg).toFixed(2);
      $(root, '#rg-stat-miss2').textContent = Math.abs(b - avg).toFixed(2);

      var verdict = $(root, '#rg-avg-verdict');
      var opposed = (a > 0.05 && b < -0.05) || (a < -0.05 && b > 0.05);
      if (opposed && Math.abs(avg) < 0.08) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'The two settings cancel. A study that reports ' +
            'one number reports about zero, and concludes the letter does ' +
            'nothing — while it is doing a great deal in both.';
      } else if (Math.max(Math.abs(a - avg), Math.abs(b - avg)) > 0.35) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'The single reported number is wrong by more ' +
            'than a third of a unit somewhere. It is an average of two ' +
            'things, and it describes neither.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'The two settings agree closely, so one number ' +
            'is a fair summary. This is the regime in which the usual ' +
            'approach loses nothing.';
      }

      // -- stage ------------------------------------------------------------
      clear(svg);
      var W = 700, H = 250, mid = 150, scale = 92;

      svg.appendChild(el('line', {
        x1: 40, y1: mid, x2: W - 40, y2: mid,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4
      }));
      svg.appendChild(el('text', {
        x: 32, y: mid + 5, class: 'lbl sm end', fill: 'var(--n-dim)'
      }, '0'));

      var cols = [
        { x: 150, v: a, name: 'setting 1', hue: 'var(--n-kept)' },
        { x: 400, v: b, name: 'setting 2', hue: 'var(--n-student)' }
      ];
      cols.forEach(function (c) {
        var h = Math.abs(c.v) * scale;
        svg.appendChild(el('rect', {
          x: c.x - 46, y: c.v >= 0 ? mid - h : mid,
          width: 92, height: Math.max(h, 1), rx: 5, fill: c.hue, opacity: 0.9
        }));
        svg.appendChild(el('text', {
          x: c.x, y: c.v >= 0 ? mid - h - 12 : mid + h + 22,
          class: 'lbl mid', fill: c.hue
        }, (c.v >= 0 ? '+' : '') + c.v.toFixed(2)));
        svg.appendChild(el('text', {
          x: c.x, y: H - 14, class: 'lbl sm mid', fill: 'var(--n-dim)'
        }, c.name));
      });

      // The reported average, drawn straight through both.
      var ay = mid - avg * scale;
      svg.appendChild(el('line', {
        x1: 70, y1: ay, x2: 560, y2: ay, stroke: 'var(--n-loss)',
        'stroke-width': 2.6, 'stroke-dasharray': '7 5', 'stroke-linecap': 'round'
      }));
      svg.appendChild(el('text', {
        x: 574, y: ay + 5, class: 'lbl', fill: 'var(--n-loss)'
      }, 'reported'));
      svg.appendChild(el('text', {
        x: 574, y: ay + 25, class: 'lbl sm', fill: 'var(--n-loss)'
      }, (avg >= 0 ? '+' : '') + avg.toFixed(2)));

      // What the average misses, as a bracket on each bar.
      cols.forEach(function (c) {
        var ty = mid - c.v * scale;
        if (Math.abs(ty - ay) < 6) { return; }
        svg.appendChild(el('line', {
          x1: c.x + 58, y1: ty, x2: c.x + 58, y2: ay,
          stroke: 'var(--n-loss)', 'stroke-width': 1.6, 'stroke-linecap': 'round'
        }));
        svg.appendChild(el('text', {
          x: c.x + 66, y: (ty + ay) / 2 + 4, class: 'lbl sm',
          fill: 'var(--n-loss)'
        }, Math.abs(c.v - avg).toFixed(2)));
      });
    }

    onInput(e1, draw); onInput(e2, draw); onInput(mix, draw);
    paintRange(e1); paintRange(e2); paintRange(mix);
    draw();
  }

  // =========================================================================
  // 3b. Lab: what splitting buys and what it cannot
  // =========================================================================

  /* Division, and nothing else. Cells per person per group is cells/groups;
     the number of independent genomes is the number of people, whatever the
     grouping does. The 100-cell line is the threshold Alegbe et al. report
     against, not a fitted value. */

  var CELL_FLOOR = 100;

  function initSplitLab() {
    var root = document.getElementById('rg-split-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var donors = $(root, '#rg-donors');
    var cells = $(root, '#rg-cells');
    var groups = $(root, '#rg-groups');

    function draw() {
      var D = parseInt(donors.value, 10);
      var N = parseInt(cells.value, 10);
      var K = parseInt(groups.value, 10);

      // Real taxonomies are lopsided, so an even split flatters the design.
      // A simple decaying share keeps the point honest without inventing data.
      var shares = [], total = 0, i;
      for (i = 0; i < K; i++) { var s = Math.pow(0.78, i); shares.push(s); total += s; }
      for (i = 0; i < K; i++) { shares[i] = shares[i] / total; }

      var perGroup = shares.map(function (s) { return N * s; });
      var usable = perGroup.filter(function (v) { return v >= CELL_FLOOR; }).length;

      $(root, '#rg-donors-v').textContent = commas(D) + ' people';
      $(root, '#rg-cells-v').textContent = commas(N) + ' cells each';
      $(root, '#rg-groups-v').textContent = K + (K === 1 ? ' group' : ' groups');

      $(root, '#rg-stat-largest').textContent = commas(perGroup[0]);
      $(root, '#rg-stat-usable').innerHTML =
          usable + ' <small>of ' + K + '</small>';
      $(root, '#rg-stat-genomes').textContent = commas(D);

      var verdict = $(root, '#rg-split-verdict');
      if (K === 1) {
        verdict.className = 'verdict';
        verdict.textContent = 'One group. Every cell contributes, and every ' +
            'difference between cells is averaged away.';
      } else if (usable < K) {
        verdict.className = 'verdict bad';
        verdict.textContent = (K - usable) + ' of the ' + K + ' groups fall ' +
            'below ' + CELL_FLOOR + ' cells per person. Splitting further ' +
            'creates groups faster than it creates evidence — and the ' +
            'number of independent genomes has not moved.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'Every group still clears ' + CELL_FLOOR +
            ' cells per person. There is room to split further — but ' +
            'note that the genome count on the right has not changed.';
      }

      // -- stage ------------------------------------------------------------
      clear(svg);
      var W = 700, H = 250, base = 196, top = 40;
      var span = W - 80;
      var bw = Math.max(2, Math.min(46, span / K - 4));
      var gap = K > 1 ? (span - bw * K) / (K - 1) : 0;
      var maxv = perGroup[0];

      var floorY = base - (CELL_FLOOR / maxv) * (base - top);
      if (CELL_FLOOR <= maxv) {
        svg.appendChild(el('line', {
          x1: 40, y1: floorY, x2: W - 40, y2: floorY,
          stroke: 'var(--n-loss)', 'stroke-width': 1.6,
          'stroke-dasharray': '6 5', 'stroke-linecap': 'round'
        }));
        svg.appendChild(el('text', {
          x: W - 40, y: floorY - 8, class: 'lbl sm end', fill: 'var(--n-loss)'
        }, CELL_FLOOR + ' cells per person'));
      }

      perGroup.forEach(function (v, gi) {
        var h = Math.max(1.5, (v / maxv) * (base - top));
        var ok = v >= CELL_FLOOR;
        svg.appendChild(el('rect', {
          x: 40 + gi * (bw + gap), y: base - h, width: bw, height: h, rx: 3,
          fill: ok ? 'var(--n-student)' : 'var(--n-pruned)',
          opacity: ok ? 0.9 : 0.55
        }));
      });

      svg.appendChild(el('line', {
        x1: 40, y1: base, x2: W - 40, y2: base,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4
      }));
      svg.appendChild(el('text', {
        x: 40, y: base + 24, class: 'lbl sm', fill: 'var(--n-dim)'
      }, 'one bar per group, tallest first'));
      svg.appendChild(el('text', {
        x: 40, y: 24, class: 'lbl sm', fill: 'var(--n-dim)'
      }, 'cells per person in each group'));
    }

    onInput(donors, draw); onInput(cells, draw); onInput(groups, draw);
    paintRange(donors); paintRange(cells); paintRange(groups);
    draw();
  }

  // =========================================================================
  // 3c. Lab: the landscape, one method at a time
  // =========================================================================

  /* A browsing widget over the published record. Every row is a fact from the
     cited paper: where its cellular coordinates come from, what resolution it
     delivers, and what object it returns. Nothing here is computed. */

  var METHODS = [
    { id: 'cellregmap', name: 'CellRegMap', year: 2022, col: 0, row: 3,
      coord: 'supplied by the analyst',
      deliver: 'a test per variant–gene pair',
      note: 'The cellular axes are expression components you hand it. A per-cell effect can be read off afterwards, as a characterisation step.' },
    { id: 'nathan', name: 'Nathan et al.', year: 2022, col: 0, row: 3,
      coord: 'supplied by the analyst',
      deliver: 'tests, plus a per-cell effect',
      note: 'Already computes an effect for every cell and plots it. The axes are canonical variates fixed before the genetic model, and each pair is fitted alone.' },
    { id: 'fastgxc', name: 'FastGxC', year: 2026, col: 0, row: 2,
      coord: 'supplied, and discrete',
      deliver: 'a shared and a per-setting effect',
      note: 'Splits each gene into a person-average and a per-setting deviation. Fast and powerful, but the settings must be named in advance.' },
    { id: 'livi', name: 'LIVI', year: 2026, col: 1, row: 3,
      coord: 'learned from appearance',
      deliver: 'tests at the level of a person',
      note: 'Learns cell state without ever seeing genotypes, which sidesteps the circularity. Its answers are about distant effects and cannot be pinned to one gene.' },
    { id: 'snspmf', name: 'sn-spMF', year: 2020, col: 2, row: 0,
      coord: 'learned from genetic effects',
      deliver: 'factors of an effect matrix',
      note: 'Factorises a matrix of effect sizes across forty-nine tissues. The same idea as this project, three rungs up the ladder.' },
    { id: 'picalo', name: 'PICALO', year: 2024, col: 2, row: 1,
      coord: 'learned from genetic effects',
      deliver: 'components, and tests along them',
      note: 'Invents the context that makes the most effects look context-dependent. One coordinate per sample, from bulk tissue.' },
    { id: 'surge', name: 'SURGE', year: 2024, col: 2, row: 3,
      coord: 'learned from genetic effects',
      deliver: 'contexts, and tests along them',
      note: 'The likelihood this project builds on. Learns the axes at cell resolution and then returns a test; there is no mechanism for a person it has not seen.' },
    { id: 'ours', name: 'this work', year: null, col: 2, row: 3,
      coord: 'learned from genetic effects',
      deliver: 'the matrix itself, and a way onto it',
      note: 'Same likelihood as SURGE. What changes is the deliverable: a map you can place a new gene, a new person and a new risk variant onto.' }
  ];

  var LADDER_ROWS = ['tissues', 'whole samples', 'given cell types', 'single cells'];
  var LADDER_COLS = ['supplied', 'from appearance', 'from genetics'];

  function initLadderLab() {
    var root = document.getElementById('rg-ladder-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var getPick = segment(root, '.seg-method', function () { draw(); });

    function draw() {
      var id = getPick() || 'surge';
      var m = null;
      METHODS.forEach(function (x) { if (x.id === id) { m = x; } });
      if (!m) { return; }

      $(root, '#rg-stat-coord').textContent = m.coord;
      $(root, '#rg-stat-res').textContent = LADDER_ROWS[m.row];
      $(root, '#rg-stat-out').textContent = m.deliver;

      var verdict = $(root, '#rg-ladder-verdict');
      verdict.className = m.id === 'ours' ? 'verdict' : 'verdict warn';
      verdict.textContent = m.note;

      clear(svg);
      var x0 = 150, y0 = 46, cw = 168, rh = 44, W = 700;

      LADDER_COLS.forEach(function (name, ci) {
        svg.appendChild(el('text', {
          x: x0 + ci * cw + cw / 2, y: 26, class: 'lbl sm mid',
          fill: 'var(--n-dim)'
        }, name));
      });
      LADDER_ROWS.forEach(function (name, ri) {
        svg.appendChild(el('text', {
          x: x0 - 14, y: y0 + ri * rh + rh / 2 + 5, class: 'lbl sm end',
          fill: 'var(--n-ink)'
        }, name));
      });
      var ri, ci;
      for (ri = 0; ri <= 4; ri++) {
        svg.appendChild(el('line', {
          x1: x0, y1: y0 + ri * rh, x2: x0 + cw * 3, y2: y0 + ri * rh,
          stroke: 'var(--n-grid)', 'stroke-width': 1.2
        }));
      }
      for (ci = 0; ci <= 3; ci++) {
        svg.appendChild(el('line', {
          x1: x0 + ci * cw, y1: y0, x2: x0 + ci * cw, y2: y0 + rh * 4,
          stroke: 'var(--n-grid)', 'stroke-width': 1.2
        }));
      }

      // Every other method as a quiet dot, so the reader sees the field.
      METHODS.forEach(function (x) {
        if (x.id === id) { return; }
        svg.appendChild(el('circle', {
          cx: x0 + x.col * cw + cw / 2 + (x.id.charCodeAt(0) % 5 - 2) * 13,
          cy: y0 + x.row * rh + rh / 2 + (x.id.charCodeAt(1) % 3 - 1) * 9,
          r: 4, fill: 'var(--n-dim)', opacity: 0.4
        }));
      });

      var cx = x0 + m.col * cw + cw / 2, cy = y0 + m.row * rh + rh / 2;
      var hue = m.id === 'ours' ? 'var(--n-student)' : 'var(--n-teacher)';
      svg.appendChild(el('rect', {
        x: x0 + m.col * cw + 3, y: y0 + m.row * rh + 3,
        width: cw - 6, height: rh - 6, rx: 7, fill: hue, opacity: 0.16
      }));
      svg.appendChild(el('circle', { cx: cx, cy: cy, r: 8, fill: hue }));
      svg.appendChild(el('text', {
        x: cx, y: y0 + rh * 4 + 26, class: 'lbl mid', fill: hue
      }, m.name + (m.year ? ' · ' + m.year : '')));

      svg.appendChild(el('text', {
        x: W - 8, y: y0 + rh * 4 + 26, class: 'lbl sm end', fill: 'var(--n-dim)'
      }, 'faint dots are the other methods'));
    }

    draw();
  }

  // =========================================================================
  // 4a. Lab: build one row of the matrix
  // =========================================================================

  /* r = beta + u * lambda, evaluated across cells whose position runs from
     -2 to +2. Nothing is fitted; the reader supplies beta and lambda and the
     line is arithmetic. The point is the sign change: once |u*lambda| exceeds
     |beta|, the same allele raises the gene in some cells and lowers it in
     others, and the average reports neither. */

  function initBuildLab() {
    var root = document.getElementById('rg2-build-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var b = $(root, '#rg2-beta'), l = $(root, '#rg2-lam');

    function draw() {
      var beta = parseFloat(b.value), lam = parseFloat(l.value);
      var N = 40, us = [], rs = [];
      var i;
      for (i = 0; i < N; i++) {
        var u = -2 + 4 * i / (N - 1);
        us.push(u); rs.push(beta + u * lam);
      }
      var lo = rs[0], hi = rs[N - 1];
      if (lo > hi) { var t = lo; lo = hi; hi = t; }
      var flips = (rs[0] > 0) !== (rs[N - 1] > 0);

      $(root, '#rg2-beta-v').textContent = (beta >= 0 ? '+' : '') + beta.toFixed(2);
      $(root, '#rg2-lam-v').textContent = (lam >= 0 ? '+' : '') + lam.toFixed(2);

      $(root, '#rg2-stat-avg').textContent = (beta >= 0 ? '+' : '') + beta.toFixed(2);
      $(root, '#rg2-stat-lo').textContent = (lo >= 0 ? '+' : '') + lo.toFixed(2);
      $(root, '#rg2-stat-hi').textContent = (hi >= 0 ? '+' : '') + hi.toFixed(2);

      var v = $(root, '#rg2-build-verdict');
      if (flips) {
        v.className = 'verdict bad';
        v.textContent = 'The allele raises the gene in some cells and lowers ' +
            'it in others. The single reported number is ' +
            (beta >= 0 ? '+' : '') + beta.toFixed(2) +
            ', which is the effect in no cell in particular.';
      } else if (Math.abs(lam) < 0.06) {
        v.className = 'verdict';
        v.textContent = 'The pair does not respond to position at all. Its row ' +
            'is flat, one number describes it completely, and nothing is lost ' +
            'by reporting that number.';
      } else {
        v.className = 'verdict warn';
        v.textContent = 'The effect varies across cells but keeps its sign. ' +
            'One number is a summary rather than a fiction &mdash; it is still ' +
            'wrong by up to ' + Math.max(Math.abs(hi - beta),
                                         Math.abs(lo - beta)).toFixed(2) + '.';
      }

      clear(svg);
      var W = 700, H = 250, mid = 132, sc = 46;
      var span = Math.max(2.2, Math.abs(lo), Math.abs(hi));
      sc = 92 / span;

      svg.appendChild(el('line', { x1: 56, y1: mid, x2: W - 150, y2: mid,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4 }));
      svg.appendChild(el('text', { x: 48, y: mid + 5, class: 'lbl sm end',
        fill: 'var(--n-dim)' }, '0'));

      // beta, the flat line a one-number study would report
      svg.appendChild(el('line', { x1: 56, y1: mid - beta * sc, x2: W - 150,
        y2: mid - beta * sc, stroke: 'var(--n-loss)', 'stroke-width': 2.2,
        'stroke-dasharray': '7 5', 'stroke-linecap': 'round' }));
      svg.appendChild(el('text', { x: W - 142, y: mid - beta * sc + 5,
        class: 'lbl sm', fill: 'var(--n-loss)' }, 'reported'));

      for (i = 0; i < N; i++) {
        var x = 56 + (W - 206) * i / (N - 1);
        var y = mid - rs[i] * sc;
        var h = Math.abs(rs[i]) * sc;
        svg.appendChild(el('rect', {
          x: x - 5, y: rs[i] >= 0 ? y : mid, width: 10,
          height: Math.max(h, 0.8), rx: 2,
          fill: rs[i] >= 0 ? 'var(--n-student)' : 'var(--n-clay)', opacity: 0.9
        }));
      }
      svg.appendChild(el('text', { x: 56, y: H - 46, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'cells, ordered by position'));
      svg.appendChild(el('text', { x: W - 150, y: H - 46,
        class: 'lbl sm end', fill: 'var(--n-dim)' }, 'one bar per cell'));
    }

    onInput(b, draw); onInput(l, draw);
    paintRange(b); paintRange(l);
    draw();
  }

  // =========================================================================
  // 4b. Lab: rotate the answer, and watch the answer not change
  // =========================================================================

  /* Two coordinates and two loadings at rank 2. Rotating U by theta and
     Lambda by the same theta leaves Lambda U' exactly where it was. The
     readouts show both sides moving while every effect stays put -- which is
     why an axis in this model means nothing and only R may be interpreted. */

  var RG2_U = [[1.20, 0.35], [-0.80, 0.95], [0.20, -1.10], [-1.05, -0.45]];
  var RG2_L = [[0.90, -0.40], [-0.55, 0.85], [1.10, 0.25]];

  function initRotLab() {
    var root = document.getElementById('rg2-rot-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var th = $(root, '#rg2-theta');

    function rot(v, c, s) { return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }

    function draw() {
      var deg = parseFloat(th.value), a = deg * Math.PI / 180;
      var c = Math.cos(a), s = Math.sin(a);
      // U -> U Q,  Lambda -> Lambda Q,  so Lambda Q (U Q)' = Lambda U'
      var U = RG2_U.map(function (v) { return rot(v, c, s); });
      var L = RG2_L.map(function (v) { return rot(v, c, s); });

      $(root, '#rg2-theta-v').textContent = Math.round(deg) + '°';
      $(root, '#rg2-stat-u').textContent =
          '(' + U[0][0].toFixed(2) + ', ' + U[0][1].toFixed(2) + ')';
      $(root, '#rg2-stat-l').textContent =
          '(' + L[0][0].toFixed(2) + ', ' + L[0][1].toFixed(2) + ')';
      var r00 = L[0][0] * U[0][0] + L[0][1] * U[0][1];
      $(root, '#rg2-stat-r').textContent = (r00 >= 0 ? '+' : '') + r00.toFixed(4);

      var v = $(root, '#rg2-rot-verdict');
      v.className = 'verdict';
      v.textContent = 'Both the coordinate and the loading have moved. Every ' +
          'effect in the matrix is unchanged to four decimal places, and will ' +
          'stay unchanged at any angle. That is why no axis here can be given ' +
          'a meaning, and why only the matrix, distances on it, and ' +
          'predictions are interpreted.';

      clear(svg);
      var W = 700, H = 250;

      function panel(ox, title, vecs, hue) {
        var cx = ox + 84, cy = 118, rr = 74;
        svg.appendChild(el('text', { x: cx, y: 24, class: 'lbl sm mid',
          fill: 'var(--n-dim)' }, title));
        svg.appendChild(el('circle', { cx: cx, cy: cy, r: rr, fill: 'none',
          stroke: 'var(--n-grid)', 'stroke-width': 1.2 }));
        vecs.forEach(function (p, k) {
          var m = Math.max(1e-6, Math.hypot(p[0], p[1]));
          var sx = cx + (p[0] / 1.6) * rr, sy = cy - (p[1] / 1.6) * rr;
          svg.appendChild(el('line', { x1: cx, y1: cy, x2: sx, y2: sy,
            stroke: hue, 'stroke-width': 2.2, 'stroke-linecap': 'round',
            opacity: k === 0 ? 1 : 0.42 }));
          svg.appendChild(el('circle', { cx: sx, cy: sy, r: k === 0 ? 4.5 : 3,
            fill: hue, opacity: k === 0 ? 1 : 0.42 }));
        });
      }

      panel(24, 'where the cells sit', U, 'var(--n-clay)');
      panel(212, 'how the pairs respond', L, 'var(--n-student)');

      // the matrix, unmoved
      var gx = 432, gy = 52, cs = 17;
      for (var i = 0; i < RG2_L.length; i++) {
        for (var j = 0; j < RG2_U.length; j++) {
          var r = L[i][0] * U[j][0] + L[i][1] * U[j][1];
          svg.appendChild(el('rect', {
            x: gx + j * cs, y: gy + i * cs, width: cs - 0.8, height: cs - 0.8,
            fill: r >= 0 ? 'var(--n-student)' : 'var(--n-clay)',
            opacity: 0.12 + 0.80 * Math.min(Math.abs(r) / 1.8, 1)
          }));
        }
      }
      svg.appendChild(el('text', { x: gx + RG2_U.length * cs / 2, y: gy - 12,
        class: 'lbl mid', fill: 'var(--n-student)' }, 'R'));
      svg.appendChild(el('text', { x: gx + RG2_U.length * cs / 2,
        y: gy + RG2_L.length * cs + 20, class: 'lbl sm mid',
        fill: 'var(--n-dim)' }, 'never moves'));
      svg.appendChild(el('text', { x: 560, y: 118, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'drag the angle'));
      svg.appendChild(el('text', { x: 560, y: 140, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'and watch the left'));
      svg.appendChild(el('text', { x: 560, y: 162, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'two panels turn'));
    }

    onInput(th, draw);
    paintRange(th);
    draw();
  }

  // =========================================================================
  // L0a. Lab: the donor-balanced transformation
  // =========================================================================

  /* (S20) written out. The weights are a_i = 1/(D * I_{d(i)}), so every donor
     carries total weight 1/D whatever its size; c_k and h_k are that weighted
     mean and spread; and the three substitutions are constructed so that
     beta* + u* lambda* reproduces beta + u lambda entry for entry. Nothing is
     read from a table -- R is rebuilt both ways on every drag and differenced. */

  var L0R_SIZES = {
    equal:   [6, 6, 6, 6, 6],
    uneven:  [2, 4, 6, 8, 10],
    extreme: [1, 1, 2, 4, 22]
  };

  function initL0ReparamLab() {
    var root = document.getElementById('l0-reparam-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var beta = $(root, '#l0r-beta'), lam = $(root, '#l0r-lam');
    var centre = $(root, '#l0r-centre'), spread = $(root, '#l0r-spread');
    var sizes = segment(root, '.seg-l0r-sizes', function () { draw(); });

    function shape(i) {
      // deterministic, so the same cell sits in the same place on every reload
      return Math.sin(i * 1.7) + 0.42 * Math.cos(i * 0.93) + 0.18 * Math.sin(i * 3.1);
    }

    function draw() {
      var counts = L0R_SIZES[sizes() || 'equal'] || L0R_SIZES.equal;
      var D = counts.length, i, k;
      var donor = [];
      for (k = 0; k < D; k++) {
        for (i = 0; i < counts[k]; i++) { donor.push(k); }
      }
      var I = donor.length;
      var b = parseFloat(beta.value), l = parseFloat(lam.value);
      var c0 = parseFloat(centre.value), sp = parseFloat(spread.value);

      var a = [], u = [];
      for (i = 0; i < I; i++) {
        a.push(1 / (D * counts[donor[i]]));
        u.push(c0 + sp * shape(i));
      }
      // (S20): the donor-balanced mean and spread of the coordinate
      var c = 0;
      for (i = 0; i < I; i++) { c += a[i] * u[i]; }
      var h2 = 0;
      for (i = 0; i < I; i++) { h2 += a[i] * (u[i] - c) * (u[i] - c); }
      var h = Math.sqrt(h2);
      var degenerate = !(h > 1e-9);

      var us = [], Rb = [], Ra = [], dmax = 0, mAfter = 0, vAfter = 0, move = 0, un = 0;
      var ls = h * l, bs = b + c * l;
      for (i = 0; i < I; i++) {
        us.push(degenerate ? 0 : (u[i] - c) / h);
        Rb.push(b + u[i] * l);
        Ra.push(bs + us[i] * ls);
        dmax = Math.max(dmax, Math.abs(Ra[i] - Rb[i]));
        mAfter += a[i] * us[i];
        vAfter += a[i] * us[i] * us[i];
        move += (us[i] - u[i]) * (us[i] - u[i]);
        un += u[i] * u[i];
      }
      move = un > 0 ? Math.sqrt(move / un) : 0;

      function fmt(v) {
        if (Math.abs(v) < 1e-12) { return v === 0 ? '0.0e+00' : v.toExponential(1); }
        return Math.abs(v) < 1e-4 ? v.toExponential(1) : v.toFixed(4);
      }
      $(root, '#l0r-beta-v').textContent = b.toFixed(2);
      $(root, '#l0r-lam-v').textContent = l.toFixed(2);
      $(root, '#l0r-centre-v').textContent = c0.toFixed(2);
      $(root, '#l0r-spread-v').textContent = sp.toFixed(2);
      $(root, '#l0r-dr').textContent = fmt(dmax);
      $(root, '#l0r-mean').textContent = degenerate ? '—' : fmt(mAfter);
      $(root, '#l0r-var').textContent = degenerate ? '—' : vAfter.toFixed(4);
      $(root, '#l0r-move').textContent = degenerate ? '—' : (move.toFixed(2) + '×');

      var verdict = $(root, '#l0r-verdict');
      if (degenerate) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'h is numerically zero: the coordinate has no donor-balanced ' +
            'variation at all, so dividing by it is meaningless. The specification drops ' +
            'a factor in this state rather than transforming it, and this is the case ' +
            'that needs its own unit test.';
      } else if (dmax > 1e-9) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'R moved by ' + dmax.toExponential(1) + ', which is far ' +
            'above floating point. On real code that is a failed invariance test.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'U moved by ' + move.toFixed(2) + '× its own norm and λ ' +
            'absorbed the inverse, yet every entry of R is unchanged to ' +
            dmax.toExponential(1) + '. The coordinate now has donor-balanced mean 0 and ' +
            'variance 1, which is the whole purpose of the transformation.';
      }

      // -- stage ------------------------------------------------------------
      clear(svg);
      var Wd = 700, x0 = 92, x1 = 664;
      var HUE = ['var(--n-teacher)', 'var(--n-student)', 'var(--n-data)',
                 'var(--n-kept)', 'var(--n-pruned)'];

      var span = 0.001, j;
      for (i = 0; i < I; i++) {
        span = Math.max(span, Math.abs(u[i]), Math.abs(us[i]));
      }
      span *= 1.12;
      function px(v) { return (x0 + x1) / 2 + v / span * (x1 - x0) / 2; }

      [[u, 62, 'u  before', 'var(--n-pruned)'],
       [us, 116, 'u*  after', 'var(--n-kept)']].forEach(function (row) {
        var vals = row[0], yy = row[1];
        svg.appendChild(el('line', { x1: x0, y1: yy, x2: x1, y2: yy,
          stroke: 'var(--n-edge)', 'stroke-width': 1.4 }));
        svg.appendChild(el('line', { x1: px(0), y1: yy - 13, x2: px(0), y2: yy + 13,
          stroke: 'var(--n-dim)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
        svg.appendChild(el('text', { x: x0 - 10, y: yy + 5, class: 'lbl sm end',
          fill: row[3] }, row[2]));
        for (j = 0; j < I; j++) {
          svg.appendChild(el('circle', { cx: px(vals[j]), cy: yy, r: 4.2,
            fill: HUE[donor[j] % HUE.length], opacity: 0.85 }));
        }
      });
      svg.appendChild(el('text', { x: x0, y: 32, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'one dot per measurement, coloured by donor'));
      svg.appendChild(el('text', { x: x1, y: 32, class: 'lbl sm end',
        fill: 'var(--n-dim)' }, 'donor sizes ' + counts.join(', ')));

      // R, both ways, on one baseline
      var base = 268, top = 176, rmax = 0.001;
      for (i = 0; i < I; i++) { rmax = Math.max(rmax, Math.abs(Rb[i]), Math.abs(Ra[i])); }
      var mid = (base + top) / 2, sc = (base - top) / 2 / (rmax * 1.15);
      svg.appendChild(el('line', { x1: x0, y1: mid, x2: x1, y2: mid,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4 }));
      svg.appendChild(el('text', { x: x0 - 10, y: mid + 5, class: 'lbl sm end',
        fill: 'var(--n-dim)' }, 'r_si'));
      var bw = (x1 - x0) / I;
      for (i = 0; i < I; i++) {
        var cx = x0 + (i + 0.5) * bw;
        var yb = mid - Rb[i] * sc, ya = mid - Ra[i] * sc;
        svg.appendChild(el('rect', {
          x: cx - bw * 0.34, y: Math.min(yb, mid), width: bw * 0.68,
          height: Math.max(Math.abs(yb - mid), 1), rx: 2,
          fill: 'var(--n-pruned)', opacity: 0.55 }));
        svg.appendChild(el('line', { x1: cx - bw * 0.40, y1: ya, x2: cx + bw * 0.40, y2: ya,
          stroke: 'var(--n-kept)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
      }
      svg.appendChild(el('text', { x: x0, y: 292, class: 'lbl sm',
        fill: 'var(--n-pruned)' }, 'bars: before'));
      svg.appendChild(el('text', { x: 190, y: 292, class: 'lbl sm',
        fill: 'var(--n-kept)' }, 'rules: after'));
      svg.appendChild(el('text', { x: x1, y: 292, class: 'lbl sm end',
        fill: degenerate ? 'var(--n-loss)' : 'var(--n-kept)' },
        degenerate ? 'undefined — h ≈ 0' : 'max |ΔR| = ' + dmax.toExponential(1)));
    }

    [beta, lam, centre, spread].forEach(function (s) { onInput(s, draw); paintRange(s); });
    draw();
  }

  // =========================================================================
  // L0b. Lab: back to phenotype units
  // =========================================================================

  /* (S3). r = (q_s/h_s) r-tilde, and the check that matters is not the formula
     but the contribution: q_s * X-tilde * r-tilde has to equal (X - xbar) * r,
     computed independently. Both are built here from the sliders. */

  function initL0UnscaleLab() {
    var root = document.getElementById('l0-unscale-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var q = $(root, '#l0u-q'), h = $(root, '#l0u-h');
    var xc = $(root, '#l0u-x'), rt = $(root, '#l0u-rt');

    function draw() {
      var Q = parseFloat(q.value), H = parseFloat(h.value);
      var X = parseFloat(xc.value), RT = parseFloat(rt.value);
      var dead = Q < 1e-6 || H < 1e-6;

      var r = dead ? NaN : Q / H * RT;
      var xt = dead ? NaN : X / H;
      var lhs = dead ? NaN : Q * xt * RT;
      var rhs = dead ? NaN : X * r;
      var vs = dead ? NaN : (Q / H) * (Q / H);
      var gap = dead ? NaN : Math.abs(lhs - rhs);

      function f(v, n) { return isFinite(v) ? v.toFixed(n === undefined ? 4 : n) : '—'; }
      $(root, '#l0u-q-v').textContent = Q.toFixed(2);
      $(root, '#l0u-h-v').textContent = H.toFixed(2);
      $(root, '#l0u-x-v').textContent = X.toFixed(2);
      $(root, '#l0u-rt-v').textContent = RT.toFixed(2);
      $(root, '#l0u-r').textContent = f(r);
      $(root, '#l0u-lhs').textContent = f(lhs);
      $(root, '#l0u-rhs').textContent = f(rhs);
      $(root, '#l0u-var').textContent = isFinite(vs) ? '×' + vs.toFixed(3) : '—';

      var verdict = $(root, '#l0u-verdict');
      if (H < 1e-6) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'h_s = 0: the genotype does not vary across donors, so no ' +
            'genetic effect is identified at this pair. It has to be filtered out before ' +
            'fitting rather than divided by here.';
      } else if (Q < 1e-6) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'q_s = 0: the molecular phenotype does not vary at all. ' +
            'Same conclusion — remove the pair, do not unscale it.';
      } else if (gap > 1e-9) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'The two routes differ by ' + gap.toExponential(1) +
            '. That is a scale-conversion bug, and it exports biologically meaningless ' +
            'effect sizes while every internal coefficient still looks reasonable.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'The fitting-scale contribution and the original-unit ' +
            'contribution agree to ' + (gap === 0 ? '0' : gap.toExponential(1)) +
            '. The posterior variance carries the square of the same factor, ×' +
            vs.toFixed(3) + '.';
      }

      // -- stage ------------------------------------------------------------
      clear(svg);
      function chip(x, y, w, txt, sub, hue) {
        svg.appendChild(el('rect', { x: x, y: y, width: w, height: 44, rx: 9,
          fill: 'var(--n-panel)', stroke: hue, 'stroke-width': 1.8 }));
        svg.appendChild(el('text', { x: x + w / 2, y: y + 21, class: 'lbl mid',
          fill: hue }, txt));
        svg.appendChild(el('text', { x: x + w / 2, y: y + 38, class: 'lbl sm mid',
          fill: 'var(--n-dim)' }, sub));
      }
      function arrow(x, y) {
        svg.appendChild(el('path', { d: 'M' + x + ' ' + y + ' l18 0 m-6 -5 l6 5 l-6 5',
          fill: 'none', stroke: 'var(--n-dim)', 'stroke-width': 1.6,
          'stroke-linecap': 'round' }));
      }
      svg.appendChild(el('text', { x: 24, y: 26, class: 'lbl sm',
        fill: 'var(--n-teacher)' }, 'the fitting scale'));
      chip(24, 40, 122, isFinite(xt) ? xt.toFixed(3) : '—', 'X̃ = (X−x̄)/h',
           'var(--n-teacher)');
      arrow(150, 62);
      chip(176, 40, 108, RT.toFixed(2), 'r̃', 'var(--n-teacher)');
      arrow(288, 62);
      chip(314, 40, 108, Q.toFixed(2), 'q_s', 'var(--n-teacher)');
      arrow(426, 62);
      chip(452, 40, 152, isFinite(lhs) ? lhs.toFixed(4) : '—', 'q X̃ r̃',
           'var(--n-teacher)');

      svg.appendChild(el('text', { x: 24, y: 130, class: 'lbl sm',
        fill: 'var(--n-student)' }, 'the original units'));
      chip(24, 144, 122, X.toFixed(2), 'X − x̄', 'var(--n-student)');
      arrow(150, 166);
      chip(176, 144, 232, isFinite(r) ? r.toFixed(4) : '—', 'r = (q/h) r̃',
           'var(--n-student)');
      arrow(412, 166);
      chip(452, 144, 152, isFinite(rhs) ? rhs.toFixed(4) : '—', '(X − x̄) r',
           'var(--n-student)');

      // the two contributions, drawn as bars that have to reach the same height
      var base = 262;
      var m = Math.max(Math.abs(lhs) || 0, Math.abs(rhs) || 0, 0.4);
      var sc = 78 / m;
      [[lhs, 634, 'var(--n-teacher)'], [rhs, 668, 'var(--n-student)']].forEach(function (t) {
        if (!isFinite(t[0])) { return; }
        var hh = Math.abs(t[0]) * sc;
        svg.appendChild(el('rect', { x: t[1] - 13, y: t[0] >= 0 ? base - hh : base,
          width: 26, height: Math.max(hh, 1.5), rx: 3, fill: t[2], opacity: 0.85 }));
      });
      svg.appendChild(el('line', { x1: 612, y1: base, x2: 690, y2: base,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4 }));
      svg.appendChild(el('text', { x: 651, y: base + 20, class: 'lbl sm mid',
        fill: isFinite(gap) && gap <= 1e-9 ? 'var(--n-kept)' : 'var(--n-loss)' },
        isFinite(gap) && gap <= 1e-9 ? 'equal' : 'differ'));
      svg.appendChild(el('text', { x: 604, y: 118, class: 'lbl sm end',
        fill: 'var(--n-dim)' }, 'these two must be the same number'));
    }

    [q, h, xc, rt].forEach(function (s) { onInput(s, draw); paintRange(s); });
    draw();
  }

  // =========================================================================
  // L0c. Lab: the posterior, computed two ways
  // =========================================================================

  /* S1.14 check 5, made draggable. The left number in each pair is (S17)/(S18)
     in closed form; the right is a composite 5-point Gauss-Legendre quadrature
     of the same posterior, sharing none of that algebra. The integration window
     is m1 +/- 14 sqrt(v1) rather than a fixed multiple of omega -- a fixed
     window silently loses the spike once |ahat| is large, which is a bug in the
     checker that reads as a bug in the code. */

  var GL5_X = [0, -0.5384693101056831, 0.5384693101056831,
               -0.9061798459386640, 0.9061798459386640];
  var GL5_W = [0.5688888888888889, 0.4786286704993665, 0.4786286704993665,
               0.2369268850561891, 0.2369268850561891];

  function ndens(x, mu, varr) {
    return Math.exp(-0.5 * (x - mu) * (x - mu) / varr) / Math.sqrt(2 * Math.PI * varr);
  }

  /* Closed form: (S17) for the conditional moments, (S18) for the weight. */
  function pointNormalAnalytic(ahat, s, pi, om) {
    var s2 = s * s, o2 = om * om;
    var v1 = o2 * s2 / (o2 + s2);
    var m1 = o2 / (o2 + s2) * ahat;
    var lik0 = ndens(ahat, 0, s2);
    var lik1 = ndens(ahat, 0, s2 + o2);
    var num = pi * lik1, den = (1 - pi) * lik0 + num;
    var w = den > 0 ? num / den : 0;
    return { w: w, mean: w * m1, second: w * (v1 + m1 * m1), m1: m1, v1: v1 };
  }

  /* Bayes' rule, integrated. No reuse of the block above. */
  function pointNormalQuadrature(ahat, s, pi, om) {
    var s2 = s * s, o2 = om * om;
    var v1 = o2 * s2 / (o2 + s2), m1 = o2 / (o2 + s2) * ahat;
    var sd = Math.sqrt(v1);
    var lo = m1 - 14 * sd, hi = m1 + 14 * sd;
    var n = 64, step = (hi - lo) / n;
    var z1 = 0, mm1 = 0, mm2 = 0, i, k;
    for (i = 0; i < n; i++) {
      var a0 = lo + i * step, half = step / 2, mid = a0 + half;
      for (k = 0; k < 5; k++) {
        var a = mid + half * GL5_X[k];
        var fw = GL5_W[k] * half * pi * ndens(ahat, a, s2) * ndens(a, 0, o2);
        z1 += fw; mm1 += a * fw; mm2 += a * a * fw;
      }
    }
    var z0 = (1 - pi) * ndens(ahat, 0, s2);
    var den = z0 + z1;
    if (!(den > 0) || !isFinite(den)) { return { w: 0, mean: 0, second: 0 }; }
    return { w: z1 / den, mean: mm1 / den, second: mm2 / den };
  }

  function initL0CebnmLab() {
    var root = document.getElementById('l0-cebnm-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var ah = $(root, '#l0c-ahat'), sn = $(root, '#l0c-s');
    var om = $(root, '#l0c-omega'), pp = $(root, '#l0c-pi');

    function draw() {
      var A = parseFloat(ah.value), S = parseFloat(sn.value);
      var O = parseFloat(om.value), PI = parseFloat(pp.value);
      var an = pointNormalAnalytic(A, S, PI, O);
      var nu = pointNormalQuadrature(A, S, PI, O);
      var gap = Math.max(Math.abs(an.w - nu.w), Math.abs(an.mean - nu.mean),
                         Math.abs(an.second - nu.second));

      $(root, '#l0c-ahat-v').textContent = A.toFixed(2);
      $(root, '#l0c-s-v').textContent = S.toFixed(2);
      $(root, '#l0c-omega-v').textContent = O.toFixed(2);
      $(root, '#l0c-pi-v').textContent = PI.toFixed(2);
      $(root, '#l0c-w').textContent = an.w.toFixed(6) + ' / ' + nu.w.toFixed(6);
      $(root, '#l0c-m').textContent = an.mean.toFixed(6) + ' / ' + nu.mean.toFixed(6);
      $(root, '#l0c-m2').textContent = an.second.toFixed(6) + ' / ' + nu.second.toFixed(6);
      $(root, '#l0c-gap').textContent = gap === 0 ? '0.0e+00' : gap.toExponential(1);

      var verdict = $(root, '#l0c-verdict');
      if (gap > 1e-9) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'The two routes differ by ' + gap.toExponential(1) +
            '. One of them is wrong, and the point of running both is that the ' +
            'quadrature cannot reproduce a mistake made in the derivation.';
      } else {
        var regime = an.w < 0.05 ? 'the posterior is almost entirely the point mass'
          : an.w > 0.95 ? 'the posterior is almost certainly nonzero'
          : 'the posterior is genuinely undecided between zero and nonzero';
        verdict.className = 'verdict';
        verdict.textContent = 'Closed form and quadrature agree to ' +
            (gap === 0 ? 'the last bit' : gap.toExponential(1)) + '; ' + regime +
            ', and the shrinkage factor ω²/(ω²+s²) is ' +
            (O * O / (O * O + S * S)).toFixed(3) + '.';
      }

      // -- stage ------------------------------------------------------------
      clear(svg);
      var x0 = 46, x1 = 470, base = 236, top = 44, lim = 4.4;
      function px(v) { return x0 + (v + lim) / (2 * lim) * (x1 - x0); }
      svg.appendChild(el('line', { x1: x0, y1: base, x2: x1, y2: base,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4 }));
      var t;
      for (t = -4; t <= 4; t += 2) {
        svg.appendChild(el('line', { x1: px(t), y1: base, x2: px(t), y2: base + 6,
          stroke: 'var(--n-edge)', 'stroke-width': 1.2 }));
        svg.appendChild(el('text', { x: px(t), y: base + 22, class: 'lbl sm mid',
          fill: 'var(--n-dim)' }, String(t)));
      }
      // the continuous part, scaled by its own mass
      var pts = [], peak = 0, xx, dv;
      for (xx = -lim; xx <= lim + 1e-9; xx += 0.06) {
        dv = an.w * ndens(xx, an.m1, an.v1);
        peak = Math.max(peak, dv);
        pts.push([xx, dv]);
      }
      var spikeH = (1 - an.w) * (base - top);
      // keep the spike and the curve on one comparable vertical scale
      var vmax = Math.max(peak, 1e-9);
      var d = 'M' + pts.map(function (p) {
        return px(p[0]).toFixed(1) + ' ' + (base - p[1] / vmax * (base - top) * 0.92).toFixed(1);
      }).join(' L');
      svg.appendChild(el('path', { d: d, fill: 'none', stroke: 'var(--n-student)',
        'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
      svg.appendChild(el('line', { x1: px(0), y1: base, x2: px(0), y2: base - spikeH,
        stroke: 'var(--n-loss)', 'stroke-width': 4.4, 'stroke-linecap': 'round' }));
      svg.appendChild(el('circle', { cx: px(0), cy: base - spikeH, r: 5.4,
        fill: 'var(--n-loss)' }));
      // keep the spike label clear of the density, which leans the same way as â
      var lblRight = A < 0;
      svg.appendChild(el('text', {
        x: px(0) + (lblRight ? 12 : -12), y: base - spikeH - 10,
        class: 'lbl sm' + (lblRight ? '' : ' end'),
        fill: 'var(--n-loss)' }, 'mass at 0: ' + (1 - an.w).toFixed(3)));
      // where the observation sits, and where the two means land
      svg.appendChild(el('line', { x1: px(A), y1: top - 6, x2: px(A), y2: base,
        stroke: 'var(--n-data)', 'stroke-width': 1.6, 'stroke-dasharray': '5 5' }));
      svg.appendChild(el('text', { x: px(A), y: top - 12, class: 'lbl sm mid',
        fill: 'var(--n-data)' }, 'â'));
      svg.appendChild(el('circle', { cx: px(an.mean), cy: base + 34, r: 5.0,
        fill: 'var(--n-teacher)' }));
      svg.appendChild(el('circle', { cx: px(nu.mean), cy: base + 34, r: 8.4,
        fill: 'none', stroke: 'var(--n-kept)', 'stroke-width': 2.0 }));
      svg.appendChild(el('text', { x: x0, y: base + 56, class: 'lbl sm',
        fill: 'var(--n-teacher)' }, 'dot: closed-form E[a]'));
      svg.appendChild(el('text', { x: 214, y: base + 56, class: 'lbl sm',
        fill: 'var(--n-kept)' }, 'ring: quadrature E[a]'));
      svg.appendChild(el('text', { x: x0, y: 26, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'the point-normal posterior'));

      // the three quantities, analytic against numerical
      var bx = 512, by = 52, bw = 160;
      svg.appendChild(el('text', { x: bx, y: 26, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'agreement, per quantity'));
      [['w', an.w, nu.w, 'var(--n-teacher)'],
       ['E[a]', an.mean, nu.mean, 'var(--n-student)'],
       ['E[a²]', an.second, nu.second, 'var(--n-data)']].forEach(function (row, ix) {
        var yy = by + ix * 62;
        svg.appendChild(el('rect', { x: bx, y: yy, width: bw, height: 48, rx: 9,
          fill: 'var(--n-panel)', stroke: 'var(--n-edge)', 'stroke-width': 1.6 }));
        svg.appendChild(el('text', { x: bx + 12, y: yy + 20, class: 'lbl sm',
          fill: row[3] }, row[0]));
        svg.appendChild(el('text', { x: bx + bw - 12, y: yy + 20, class: 'lbl sm end',
          fill: 'var(--n-ink)' }, row[1].toFixed(6)));
        var g = Math.abs(row[1] - row[2]);
        svg.appendChild(el('text', { x: bx + bw - 12, y: yy + 40, class: 'lbl sm end',
          fill: g > 1e-9 ? 'var(--n-loss)' : 'var(--n-kept)' },
          'gap ' + (g === 0 ? '0.0e+00' : g.toExponential(1))));
      });
      svg.appendChild(el('text', { x: bx, y: 262, class: 'lbl sm',
        fill: 'var(--n-dim)' }, '320 quadrature nodes,'));
      svg.appendChild(el('text', { x: bx, y: 282, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'recomputed on every drag'));
    }

    [ah, sn, om, pp].forEach(function (s) { onInput(s, draw); paintRange(s); });
    draw();
  }

  // =========================================================================
  // L0d. Lab: the spike disappearing
  // =========================================================================

  /* S1.14 check 6. The Gaussian column is written straight from
     v^-1 = kappa + p and m = v p ahat, so it shares nothing with the
     point-normal block above; at pi = 1 the two have to be the same number. */

  function initL0PiOneLab() {
    var root = document.getElementById('l0-pi-one-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var pi = $(root, '#l0p-pi'), ah = $(root, '#l0p-ahat');
    var sn = $(root, '#l0p-s'), om = $(root, '#l0p-omega');

    function draw() {
      var PI = parseFloat(pi.value), A = parseFloat(ah.value);
      var S = parseFloat(sn.value), O = parseFloat(om.value);
      var an = pointNormalAnalytic(A, S, PI, O);
      var pnVar = an.second - an.mean * an.mean;
      // the ordinary Gaussian normal-means update, from precisions
      var kappa = 1 / (O * O), prec = 1 / (S * S);
      var v = 1 / (kappa + prec), m = v * prec * A;
      var gap = Math.max(Math.abs(an.mean - m), Math.abs(pnVar - v));

      $(root, '#l0p-pi-v').textContent = PI.toFixed(2);
      $(root, '#l0p-ahat-v').textContent = A.toFixed(2);
      $(root, '#l0p-s-v').textContent = S.toFixed(2);
      $(root, '#l0p-omega-v').textContent = O.toFixed(2);
      $(root, '#l0p-pn').textContent = an.mean.toFixed(4) + ' / ' + pnVar.toFixed(4);
      $(root, '#l0p-gauss').textContent = m.toFixed(4) + ' / ' + v.toFixed(4);
      $(root, '#l0p-gap').textContent = gap === 0 ? '0.0e+00' : gap.toExponential(1);
      $(root, '#l0p-spike').textContent = (1 - an.w).toFixed(4);

      var verdict = $(root, '#l0p-verdict');
      if (PI >= 0.9999) {
        verdict.className = 'verdict';
        verdict.textContent = 'π = 1, so w = 1, the point mass is gone and the prior is ' +
            'just N(0, ω²). The two routes agree to ' +
            (gap === 0 ? 'the last bit' : gap.toExponential(1)) +
            ', which is the bridge from the new prior back to the checked Gaussian path.';
      } else {
        verdict.className = 'verdict warn';
        verdict.textContent = 'At π = ' + PI.toFixed(2) + ' there is still ' +
            (1 - an.w).toFixed(3) + ' of posterior mass at zero, so the two updates ' +
            'differ by ' + gap.toExponential(1) + '. That difference is the whole ' +
            'content of the spike — it is not a bug, and it is why the reduction has to ' +
            'be tested exactly at one.';
      }

      // -- stage ------------------------------------------------------------
      clear(svg);
      var x0 = 46, x1 = 470, base = 214, top = 42, lim = 4.4;
      function px(val) { return x0 + (val + lim) / (2 * lim) * (x1 - x0); }
      svg.appendChild(el('line', { x1: x0, y1: base, x2: x1, y2: base,
        stroke: 'var(--n-edge)', 'stroke-width': 1.4 }));
      var pts = [], peak = 0, xx, dv;
      for (xx = -lim; xx <= lim + 1e-9; xx += 0.06) {
        dv = an.w * ndens(xx, an.m1, an.v1);
        peak = Math.max(peak, dv);
        pts.push([xx, dv]);
      }
      var vmax = Math.max(peak, 1e-9);
      svg.appendChild(el('path', { d: 'M' + pts.map(function (p) {
        return px(p[0]).toFixed(1) + ' ' +
          (base - p[1] / vmax * (base - top) * 0.90).toFixed(1); }).join(' L'),
        fill: 'none', stroke: 'var(--n-student)', 'stroke-width': 2.6,
        'stroke-linejoin': 'round' }));
      var spikeH = (1 - an.w) * (base - top);
      if (spikeH > 0.4) {
        svg.appendChild(el('line', { x1: px(0), y1: base, x2: px(0), y2: base - spikeH,
          stroke: 'var(--n-loss)', 'stroke-width': 4.4, 'stroke-linecap': 'round' }));
        svg.appendChild(el('circle', { cx: px(0), cy: base - spikeH, r: 5.4,
          fill: 'var(--n-loss)' }));
      } else {
        svg.appendChild(el('text', { x: px(0), y: base - 14, class: 'lbl sm mid',
          fill: 'var(--n-kept)' }, 'no spike left'));
      }
      svg.appendChild(el('circle', { cx: px(an.mean), cy: base + 30, r: 5.0,
        fill: 'var(--n-student)' }));
      svg.appendChild(el('circle', { cx: px(m), cy: base + 30, r: 8.6, fill: 'none',
        stroke: 'var(--n-teacher)', 'stroke-width': 2.0 }));
      svg.appendChild(el('text', { x: x0, y: base + 52, class: 'lbl sm',
        fill: 'var(--n-student)' }, 'dot: point-normal E[a]'));
      svg.appendChild(el('text', { x: 230, y: base + 52, class: 'lbl sm',
        fill: 'var(--n-teacher)' }, 'ring: Gaussian m'));
      svg.appendChild(el('text', { x: x0, y: 26, class: 'lbl sm',
        fill: 'var(--n-dim)' }, 'prior mass at zero: ' + (1 - PI).toFixed(2) +
        '  →  posterior mass at zero: ' + (1 - an.w).toFixed(3)));

      // the two routes, side by side
      var bx = 512, bw = 160;
      [['point-normal', an.mean, pnVar, 'var(--n-student)'],
       ['Gaussian', m, v, 'var(--n-teacher)']].forEach(function (row, ix) {
        var yy = 52 + ix * 74;
        svg.appendChild(el('rect', { x: bx, y: yy, width: bw, height: 60, rx: 9,
          fill: 'var(--n-panel)', stroke: row[3], 'stroke-width': 1.8 }));
        svg.appendChild(el('text', { x: bx + 12, y: yy + 20, class: 'lbl sm',
          fill: row[3] }, row[0]));
        svg.appendChild(el('text', { x: bx + bw - 12, y: yy + 38, class: 'lbl sm end',
          fill: 'var(--n-ink)' }, 'E[a] ' + row[1].toFixed(4)));
        svg.appendChild(el('text', { x: bx + bw - 12, y: yy + 54, class: 'lbl sm end',
          fill: 'var(--n-ink)' }, 'Var ' + row[2].toFixed(4)));
      });
      svg.appendChild(el('text', { x: bx + bw / 2, y: 212, class: 'lbl mid',
        fill: gap > 1e-9 ? 'var(--n-loss)' : 'var(--n-kept)' },
        gap === 0 ? '0.0e+00' : gap.toExponential(1)));
      svg.appendChild(el('text', { x: bx + bw / 2, y: 232, class: 'lbl sm mid',
        fill: 'var(--n-dim)' }, '|difference|'));
    }

    [pi, ah, sn, om].forEach(function (s) { onInput(s, draw); paintRange(s); });
    draw();
  }

  // =========================================================================


  // =========================================================================
  // 3f. Lab: split the loci -- does the same geometry come back?
  // =========================================================================

  /* The reproducibility experiment from note 5, made draggable. A rank-two
     cellular coordinate is fixed; two reference sets of cis pairs are drawn
     over it, each with its own loadings and its own estimation noise. What
     the reader compares is never a factor and never an entry of R -- it is
     the Eq (12) distance matrix each fit induces on the same cells.

     Two anchors are exact and are asserted in the verification pass:
       - split = 'same'  ->  both fits are literally the same fit, so the
         agreement is 1.000 and neighbour overlap is 100%;
       - responding pairs = 0 and noise = 0  ->  every column of R is the
         same, so every distance is exactly 0 and there is no geometry. */

  var RG_CELLS = 26;
  var RG_K = 5;                       // neighbours compared

  function rgCoords() {
    var U = [], i;
    for (i = 0; i < RG_CELLS; i++) {
      var t = 1.45 * Math.PI * i / (RG_CELLS - 1);
      U.push([Math.cos(t), Math.sin(t)]);
    }
    return U;
  }

  /* Box-Muller over the shared seeded stream, so the whole lab is a pure
     function of (seed, controls) and never shifts under the reader. */
  function rgGauss(rnd) {
    var spare = null;
    return function () {
      if (spare !== null) { var s = spare; spare = null; return s; }
      var u = Math.max(rnd(), 1e-12), v = rnd();
      var r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
  }

  function rgFitHalf(U, nPairs, pRespond, sigma, seed) {
    var rnd = seeded(seed), g = rgGauss(rnd);
    var R = [], responding = 0, s, i;
    for (s = 0; s < nPairs; s++) {
      var responds = rnd() < pRespond;
      if (responds) { responding++; }
      var l0 = responds ? g() : 0, l1 = responds ? g() : 0;
      var beta = 0.5 * g();
      var row = [];
      for (i = 0; i < RG_CELLS; i++) {
        row.push(beta + U[i][0] * l0 + U[i][1] * l1 + sigma * g());
      }
      R.push(row);
    }
    return { R: R, responding: responding };
  }

  /* Eq (12) with s_g = 1: the mean over pairs of the squared difference.
     Dividing by the number of pairs is what lets two reference sets of
     different size be compared at all. */
  function rgDistances(R) {
    var S = R.length, d = [], i, j, s;
    for (i = 0; i < RG_CELLS; i++) {
      d.push(new Array(RG_CELLS));
      d[i][i] = 0;
    }
    for (i = 0; i < RG_CELLS; i++) {
      for (j = i + 1; j < RG_CELLS; j++) {
        var acc = 0;
        for (s = 0; s < S; s++) { var e = R[s][i] - R[s][j]; acc += e * e; }
        var v = S ? acc / S : 0;
        d[i][j] = v;
        d[j][i] = v;
      }
    }
    return d;
  }

  function rgOffDiag(d) {
    var out = [], i, j;
    for (i = 0; i < RG_CELLS; i++) {
      for (j = i + 1; j < RG_CELLS; j++) { out.push(d[i][j]); }
    }
    return out;
  }

  function rgRanks(a) {
    var idx = a.map(function (v, i) { return i; });
    idx.sort(function (x, y) { return a[x] - a[y]; });
    var r = new Array(a.length);
    idx.forEach(function (orig, pos) { r[orig] = pos; });
    return r;
  }

  function rgPearson(a, b) {
    var n = a.length, i, ma = 0, mb = 0;
    if (!n) { return NaN; }
    for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    var sab = 0, sa = 0, sb = 0;
    for (i = 0; i < n; i++) {
      var da = a[i] - ma, db = b[i] - mb;
      sab += da * db; sa += da * da; sb += db * db;
    }
    if (sa <= 1e-18 || sb <= 1e-18) { return NaN; }
    return sab / Math.sqrt(sa * sb);
  }

  function rgSpearman(a, b) { return rgPearson(rgRanks(a), rgRanks(b)); }

  function rgNeighbours(d, i) {
    var order = [], j;
    for (j = 0; j < RG_CELLS; j++) { if (j !== i) { order.push(j); } }
    order.sort(function (x, y) { return d[i][x] - d[i][y]; });
    return order.slice(0, RG_K);
  }

  function rgOverlap(dA, dB) {
    var out = [], i;
    for (i = 0; i < RG_CELLS; i++) {
      var na = rgNeighbours(dA, i), nb = rgNeighbours(dB, i), hit = 0;
      na.forEach(function (x) { if (nb.indexOf(x) >= 0) { hit++; } });
      out.push(hit / RG_K);
    }
    return out;
  }

  function initReproLab() {
    var root = document.getElementById('rg-repro-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var pairs = $(root, '#rg-pairs');
    var resp = $(root, '#rg-resp');
    var noise = $(root, '#rg-noise');
    var U = rgCoords();
    var getSplit = segment(root, '.seg-split', function () { draw(); });

    function draw() {
      var nPairs = parseInt(pairs.value, 10);
      var p = parseInt(resp.value, 10) / 100;
      var sigma = parseInt(noise.value, 10) / 100;
      var same = getSplit() === 'same';

      var A = rgFitHalf(U, nPairs, p, sigma, 20260906);
      var B = same ? A : rgFitHalf(U, nPairs, p, sigma, 77712345);
      var dA = rgDistances(A.R), dB = rgDistances(B.R);
      var a = rgOffDiag(dA), b = rgOffDiag(dB);

      var amax = Math.max.apply(null, a), bmax = Math.max.apply(null, b);
      var degenerate = amax < 1e-12 || bmax < 1e-12;

      var rho = degenerate ? NaN : (same ? 1 : rgSpearman(a, b));
      var ov = rgOverlap(dA, dB);
      var meanOv = ov.reduce(function (s, v) { return s + v; }, 0) / ov.length;

      $(root, '#rg-pairs-v').textContent = nPairs + ' per set';
      $(root, '#rg-resp-v').textContent = Math.round(p * 100) + '% respond';
      $(root, '#rg-noise-v').textContent = sigma.toFixed(2) + ' sd';

      $(root, '#rg-stat-rho').textContent =
          degenerate ? '—' : rho.toFixed(3);
      $(root, '#rg-stat-nn').textContent =
          degenerate ? '—' : Math.round(meanOv * 100) + '%';
      $(root, '#rg-stat-resp').innerHTML =
          A.responding + ' <small>of ' + nPairs + '</small>';

      var verdict = $(root, '#rg-repro-verdict');
      if (degenerate) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'No pair responds and nothing is noisy, so ' +
            'every cell has the same cis-effect profile. Every distance is ' +
            'exactly zero: there is no cellular organization to reproduce, ' +
            'and a reproducibility statistic is undefined rather than good.';
      } else if (same) {
        verdict.className = 'verdict';
        verdict.textContent = 'Nothing changed between the two fits, so the ' +
            'agreement is 1.000 by construction. This is the ceiling to ' +
            'read the disjoint-loci number against, not a result.';
      } else if (rho >= 0.85 && meanOv >= 0.6) {
        verdict.className = 'verdict';
        verdict.textContent = 'Two disjoint sets of cis regions place the ' +
            'same cells in nearly the same relative positions. That is the ' +
            'evidence a recurrent response structure exists — no single ' +
            'locus set is carrying it.';
      } else if (rho >= 0.5) {
        verdict.className = 'verdict';
        verdict.textContent = 'The broad geometry survives but local ' +
            'neighbourhoods do not. Distances would be reportable here; a ' +
            'discrete grouping built on these neighbours would not be.';
      } else {
        verdict.className = 'verdict bad';
        verdict.textContent = 'The two locus sets disagree about how the ' +
            'cells are arranged. Either too few pairs respond to the map, ' +
            'or each pair is estimated too noisily for a shared structure ' +
            'to show through.';
      }

      // -- stage ------------------------------------------------------------
      clear(svg);
      var px = 46, py = 30, pw = 302, ph = 200;

      svg.appendChild(el('rect', { x: px, y: py, width: pw, height: ph, rx: 6,
                                   fill: 'var(--n-panel)',
                                   stroke: 'var(--n-edge)', 'stroke-width': 1.2 }));
      var g;
      for (g = 1; g < 4; g++) {
        svg.appendChild(el('line', { x1: px + pw * g / 4, y1: py + 5,
                                     x2: px + pw * g / 4, y2: py + ph - 5,
                                     stroke: 'var(--n-grid)', 'stroke-width': 1 }));
        svg.appendChild(el('line', { x1: px + 5, y1: py + ph * g / 4,
                                     x2: px + pw - 5, y2: py + ph * g / 4,
                                     stroke: 'var(--n-grid)', 'stroke-width': 1 }));
      }
      var lo = Math.min.apply(null, a.concat(b));
      var hi = Math.max.apply(null, a.concat(b));
      var span = hi - lo > 1e-12 ? hi - lo : 1;
      var fx = function (v) { return px + 14 + (pw - 28) * (v - lo) / span; };
      var fy = function (v) { return py + ph - 14 - (ph - 28) * (v - lo) / span; };
      if (!degenerate) {
        svg.appendChild(el('line', { x1: fx(lo), y1: fy(lo),
                                     x2: fx(hi), y2: fy(hi),
                                     stroke: 'var(--n-edge)', 'stroke-width': 1.2,
                                     'stroke-dasharray': '5 4' }));
      }
      var t;
      for (t = 0; t < a.length; t++) {
        svg.appendChild(el('circle', { cx: fx(a[t]), cy: fy(b[t]), r: 2.4,
                                       fill: 'rgba(var(--n-violet-rgb), 0.40)' }));
      }
      svg.appendChild(el('text', { x: px + pw / 2, y: py + ph + 22,
                                   'class': 'lbl sm mid',
                                   fill: 'var(--n-student)' },
                         'distance under set A'));
      svg.appendChild(el('text', { x: px - 14, y: py + ph / 2,
                                   'class': 'lbl sm mid',
                                   fill: 'var(--n-teacher)',
                                   transform: 'rotate(-90 ' + (px - 14) + ' ' +
                                              (py + ph / 2) + ')' },
                         'distance under set B'));
      svg.appendChild(el('text', { x: px, y: py - 10, 'class': 'lbl sm',
                                   fill: 'var(--n-dim)' },
                         a.length + ' pairs of cells'));

      // neighbour agreement, one bar per cell
      var qx = 400, qw = 232, base = py + ph, bh = ph - 16;
      svg.appendChild(el('text', { x: qx, y: py - 10, 'class': 'lbl sm',
                                   fill: 'var(--n-dim)' },
                         'shared nearest neighbours, per cell'));
      svg.appendChild(el('line', { x1: qx, y1: base, x2: qx + qw, y2: base,
                                   stroke: 'var(--n-edge)', 'stroke-width': 1.2 }));
      var bw = qw / RG_CELLS;
      for (t = 0; t < RG_CELLS; t++) {
        var h = Math.max(1.5, bh * ov[t]);
        var hue = ov[t] >= 0.6 ? 'var(--n-kept)'
                : (ov[t] >= 0.3 ? 'var(--n-data)' : 'var(--n-loss)');
        svg.appendChild(el('rect', { x: qx + t * bw + 1, y: base - h,
                                     width: Math.max(1.5, bw - 2), height: h,
                                     rx: 2, fill: hue, 'fill-opacity': 0.85 }));
      }
      [[1, '5 of 5'], [0.6, '3 of 5'], [0.2, '1 of 5']].forEach(function (pair) {
        var yy = base - bh * pair[0];
        svg.appendChild(el('line', { x1: qx, y1: yy, x2: qx + qw, y2: yy,
                                     stroke: 'var(--n-grid)', 'stroke-width': 1 }));
        svg.appendChild(el('text', { x: qx + qw + 6, y: yy + 4,
                                     'class': 'lbl sm',
                                     fill: 'var(--n-dim)' }, pair[1]));
      });
      svg.appendChild(el('text', { x: qx + qw / 2, y: base + 22,
                                   'class': 'lbl sm mid',
                                   fill: 'var(--n-dim)' },
                         'each of the ' + RG_CELLS + ' cells'));
    }

    onInput(pairs, draw);
    onInput(resp, draw);
    onInput(noise, draw);
    draw();
  }

  initTokenLab();
  initPruneLab();
  initDistillLab();
  initFFNLab();
  initMoELab();
  initIRoPELab();
  initTempLab();
  initSSMaxLab();
  initDecoderRoadmap();
  initAvgLab();
  initSplitLab();
  initLadderLab();
  initBuildLab();
  initRotLab();
  initReproLab();
  initL0ReparamLab();
  initL0UnscaleLab();
  initL0CebnmLab();
  initL0PiOneLab();
}());
