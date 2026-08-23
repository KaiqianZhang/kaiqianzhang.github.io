/* ---------------------------------------------------------------------------
   blog-labs.js -- the interactives in blog posts.

   Helpers and the figure driver come from widgets.js, which loads first.
   Every number below is computed from the papers' own formulas rather than
   sketched: the frequency bank is theta_i = base^(-2i/d), the decay curve is
   the actual sum of cosines over that bank, and the four extension methods
   are the published rescalings. A widget you can trust is worth more than one
   that merely moves.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  var W = window.W;
  if (!W) { return; }
  var el = W.el, clear = W.clear, $ = W.$;
  var commas = W.commas, onInput = W.onInput, segment = W.segment;

  // -- the shared frequency bank --------------------------------------------

  function thetas(dim, base) {
    var out = [];
    for (var i = 0; i < dim / 2; i++) {
      out.push(Math.pow(base, -2 * i / dim));
    }
    return out;
  }

  /* RoPE's relative score for a query and key that agree on every band: the
     phases start together at delta = 0 and drift apart as delta grows. */
  function alignedScore(delta, th) {
    var sum = 0;
    for (var i = 0; i < th.length; i++) { sum += Math.cos(delta * th[i]); }
    return sum / th.length;
  }

  /* What an unrelated pair scores: d/2 unit phasors at random phase,
     normalised the same way. */
  function noiseFloor(th) { return 1 / Math.sqrt(th.length); }

  // =========================================================================
  // Lab 1: how far RoPE can still see
  // =========================================================================

  function initDecayLab() {
    var root = document.getElementById('decay-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var baseIn = $(root, '#dec-base');
    var dimIn = $(root, '#dec-dim');
    var deltaIn = $(root, '#dec-delta');

    /* The first distance at which the matching pair has sunk into the floor
       and stayed there. Scanned on a log grid, and required to stay down for
       a stretch so a single dip through zero does not count. */
    function usableRange(th, floor) {
      var below = 0;
      for (var lg = 0; lg <= 6; lg += 0.02) {
        if (Math.abs(alignedScore(Math.pow(10, lg), th)) < floor) {
          below++;
          if (below >= 12) { return Math.pow(10, lg - 0.24); }
        } else {
          below = 0;
        }
      }
      return Infinity;
    }

    function draw() {
      var base = Math.pow(10, parseFloat(baseIn.value));
      var dim = parseInt(dimIn.value, 10);
      var delta = Math.pow(10, parseFloat(deltaIn.value));
      var th = thetas(dim, base);
      var floor = noiseFloor(th);
      var score = alignedScore(delta, th);
      var range = usableRange(th, floor);

      $(root, '#dec-base-v').textContent = commas(base);
      $(root, '#dec-dim-v').textContent = dim;
      $(root, '#dec-delta-v').textContent = commas(delta) + ' tokens';

      $(root, '#dec-stat-score').textContent = score.toFixed(3);
      $(root, '#dec-stat-floor').innerHTML =
          '±' + floor.toFixed(3) + ' <small>d/2 = ' + (dim / 2) +
          '</small>';
      $(root, '#dec-stat-range').innerHTML = range === Infinity
          ? '&gt; 1M <small>tokens</small>'
          : commas(range) + ' <small>tokens</small>';

      var verdict = $(root, '#dec-verdict');
      if (Math.abs(score) < floor) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'At ' + commas(delta) + ' tokens apart the ' +
            'matching pair scores ' + score.toFixed(3) + ', inside the ±' +
            floor.toFixed(3) + ' band an unrelated pair occupies. Attention ' +
            'cannot tell that these two tokens belong together.';
      } else if (Math.abs(score) < floor * 3) {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Getting thin: ' + score.toFixed(3) +
            ' against a floor of ' + floor.toFixed(3) + '. There is signal ' +
            'here, but not much, and no margin for a competing key.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'Comfortable — ' + score.toFixed(3) +
            ', well clear of the ±' + floor.toFixed(3) + ' floor. ' +
            'Raising the base pushes the whole curve right, which is what ' +
            'Llama 3 bought by moving from 10,000 to 500,000.';
      }

      // ---- the drawing ----------------------------------------------------
      clear(svg);
      var x0 = 62, y0 = 34, w = 578, h = 150, dmax = 6;   // to 10^6 tokens
      var toX = function (lg) { return x0 + (lg / dmax) * w; };
      var toY = function (v) { return y0 + (1 - (v + 0.25) / 1.25) * h; };
      var g, t, lg;

      for (g = 0; g <= 5; g++) {
        svg.appendChild(el('line', {
          x1: x0, y1: y0 + (g / 5) * h, x2: x0 + w, y2: y0 + (g / 5) * h,
          stroke: 'var(--w-grid)', 'stroke-width': 1
        }));
      }
      svg.appendChild(el('line', {
        x1: x0, y1: toY(0), x2: x0 + w, y2: toY(0),
        stroke: 'var(--w-edge)', 'stroke-width': 1.3
      }));
      svg.appendChild(el('text', {
        x: x0 - 8, y: toY(1) + 4, 'class': 'lbl sm end'
      }, '1.0'));
      svg.appendChild(el('text', {
        x: x0 - 8, y: toY(0) + 4, 'class': 'lbl sm end'
      }, '0'));
      for (t = 0; t <= dmax; t++) {
        svg.appendChild(el('text', {
          x: toX(t), y: y0 + h + 20, 'class': 'lbl sm mid'
        }, t === 0 ? '1' : '10^' + t));
      }

      // The floor band: anything inside it is indistinguishable from noise.
      svg.appendChild(el('rect', {
        x: x0, y: toY(floor), width: w,
        height: Math.max(1, toY(-floor) - toY(floor)),
        fill: 'var(--w-pruned)', 'fill-opacity': 0.16, 'class': 'bar'
      }));
      svg.appendChild(el('text', {
        x: x0 + w, y: toY(floor) - 6, 'class': 'lbl sm end',
        fill: 'var(--w-pruned)'
      }, 'noise floor'));

      var pts = [];
      for (lg = 0; lg <= dmax + 1e-9; lg += 0.01) {
        pts.push(toX(lg).toFixed(1) + ' ' +
                 toY(alignedScore(Math.pow(10, lg), th)).toFixed(1));
      }
      svg.appendChild(el('path', {
        d: 'M' + pts.join(' L'), fill: 'none', stroke: 'var(--w-student)',
        'stroke-width': 2.1, 'stroke-linejoin': 'round'
      }));

      if (range !== Infinity && Math.log10(range) <= dmax) {
        svg.appendChild(el('line', {
          x1: toX(Math.log10(range)), y1: y0 - 4,
          x2: toX(Math.log10(range)), y2: y0 + h + 4,
          stroke: 'var(--w-kept)', 'stroke-width': 1.6,
          'stroke-dasharray': '5 4', 'class': 'bar'
        }));
        svg.appendChild(el('text', {
          x: toX(Math.log10(range)) + 6, y: y0 + 12, 'class': 'lbl sm',
          fill: 'var(--w-kept)'
        }, 'usable to here'));
      }

      var lgd = Math.log10(Math.max(delta, 1));
      svg.appendChild(el('line', {
        x1: toX(lgd), y1: y0 - 4, x2: toX(lgd), y2: y0 + h + 4,
        stroke: 'var(--w-dim)', 'stroke-width': 1.6,
        'stroke-dasharray': '4 4', 'class': 'bar'
      }));
      svg.appendChild(el('circle', {
        cx: toX(lgd), cy: toY(score), r: 5.5, fill: 'var(--w-student)',
        'class': 'bar'
      }));
      svg.appendChild(el('text', { x: x0, y: 22, 'class': 'lbl sm' },
                         'relative attention score for a matching pair — '
                         + 'base ' + commas(base) + ', head dim ' + dim));
      svg.appendChild(el('text', {
        x: x0 + w, y: y0 + h + 42, 'class': 'lbl sm end'
      }, 'distance between the two tokens'));
    }

    onInput(baseIn, draw);
    onInput(dimIn, draw);
    onInput(deltaIn, draw);
    draw();
  }

  // =========================================================================
  // Lab 2: the four ways to stretch a context
  // =========================================================================

  /* What actually decides whether a rescaling works is not whether a band is
     "slow" -- it is whether the band is pushed into rotation angles it never
     saw in training. Training showed band i angles up to theta_i * ctx. At the
     stretched length it sees theta'_i * target. The ratio of those two is the
     extrapolation factor: 1 means every angle is familiar, s means the band is
     being asked to work s times outside its experience.

     The second axis is what the rescaling costs locally: how much coarser the
     fastest band's ruler became. Between them these two numbers are the whole
     argument for why NTK and YaRN beat plain interpolation. */

  var YARN_ALPHA = 1.0, YARN_BETA = 32.0;

  function methodThetas(method, dim, base, ctx, s) {
    var th = thetas(dim, base), out = [], i;
    if (method === 'pi') {
      for (i = 0; i < th.length; i++) { out.push(th[i] / s); }
    } else if (method === 'ntk') {
      out = thetas(dim, base * Math.pow(s, dim / (dim - 2)));
    } else if (method === 'yarn') {
      for (i = 0; i < th.length; i++) {
        var turns = ctx / (2 * Math.PI / th[i]);
        var gamma;
        if (turns > YARN_BETA) { gamma = 1; }
        else if (turns < YARN_ALPHA) { gamma = 0; }
        else { gamma = (turns - YARN_ALPHA) / (YARN_BETA - YARN_ALPHA); }
        out.push((1 - gamma) * (th[i] / s) + gamma * th[i]);
      }
    } else {
      out = th;
    }
    return out;
  }

  function initSpectrumLab() {
    var root = document.getElementById('spec-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var sIn = $(root, '#spec-s');
    var ctxIn = $(root, '#spec-ctx');
    var getMethod = segment(root, '.seg-method', function () { draw(); });
    var DIM = 128, BASE = 10000;
    var NAMES = { none: 'No rescaling', pi: 'Position Interpolation',
                  ntk: 'NTK / base raising', yarn: 'YaRN' };

    function draw() {
      var method = getMethod() || 'none';
      var s = parseInt(sIn.value, 10);
      var ctx = parseInt(ctxIn.value, 10);
      var target = ctx * s;
      var th = thetas(DIM, BASE);
      var th2 = methodThetas(method, DIM, BASE, ctx, s);

      // Extrapolation factor per band, and the local cost.
      var ratios = th2.map(function (t, i) {
        return (t * target) / (th[i] * ctx);
      });
      var worstSlow = ratios[ratios.length - 1];
      var worst = Math.max.apply(null, ratios);
      var localCost = th[0] / th2[0];

      $(root, '#spec-s-v').textContent = '×' + s;
      $(root, '#spec-ctx-v').textContent =
          commas(ctx) + ' → ' + commas(target);
      $(root, '#spec-stat-dead').innerHTML =
          worstSlow.toFixed(2) + '× <small>slowest band</small>';
      $(root, '#spec-stat-max').innerHTML =
          localCost.toFixed(2) + '× <small>coarser</small>';
      $(root, '#spec-stat-temp').innerHTML = method === 'yarn'
          ? (0.1 * Math.log(s) + 1).toFixed(3) + ' <small>= 0.1·ln s + 1</small>'
          : '— <small>YaRN only</small>';

      var verdict = $(root, '#spec-verdict');
      if (method === 'none') {
        verdict.className = 'verdict bad';
        verdict.textContent = 'Every band is asked to work ' + s + '× beyond ' +
            'the angles it saw in training, and the local ruler is untouched. ' +
            'This is the naive extension that does not work.';
      } else if (method === 'pi') {
        verdict.className = 'verdict warn';
        verdict.textContent = 'Perfectly safe — no band ever sees an unfamiliar ' +
            'angle — but every band was slowed by ' + s + '×, so the local ' +
            'ruler is ' + localCost.toFixed(0) + '× coarser too. Safety bought ' +
            'with resolution it did not need to spend.';
      } else if (method === 'ntk') {
        verdict.className = 'verdict';
        verdict.textContent = 'The slowest band is at ' + worstSlow.toFixed(2) +
            '× and the local ruler is only ' + localCost.toFixed(2) +
            '× coarser. Raising the base spends the stretch where it matters ' +
            'and leaves the fast bands alone — both axes at once.';
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'YaRN interpolates the slow bands to ' +
            worstSlow.toFixed(2) + '× and leaves the fast ones exactly as ' +
            'trained, so the local ruler is unchanged. The fast bands do ' +
            'extrapolate, which is fine — they wrap many times inside the ' +
            'context anyway.';
      }

      // ---- the drawing ----------------------------------------------------
      clear(svg);
      var x0 = 60, y0 = 44, w = 566, h = 118;
      var n = ratios.length;
      var lo = -0.2, hi = Math.max(Math.log10(Math.max(worst, s)) + 0.15, 0.4);
      var toX = function (i) { return x0 + (i / (n - 1)) * w; };
      var toY = function (r) {
        return y0 + h - (Math.max(Math.log10(Math.max(r, 1e-6)), lo) - lo) /
                        (hi - lo) * h;
      };

      // The line every method is trying to reach.
      svg.appendChild(el('line', {
        x1: x0, y1: toY(1), x2: x0 + w, y2: toY(1),
        stroke: 'var(--w-kept)', 'stroke-width': 1.8,
        'stroke-dasharray': '5 4'
      }));
      svg.appendChild(el('text', {
        x: x0 + w, y: toY(1) - 6, 'class': 'lbl sm end', fill: 'var(--w-kept)'
      }, '1× — every angle familiar'));

      ratios.forEach(function (r, i) {
        svg.appendChild(el('circle', {
          cx: toX(i), cy: toY(r), r: 3.4, 'class': 'cell',
          fill: r > 1.05 ? 'var(--w-loss)' : 'var(--w-kept)',
          'fill-opacity': 0.85
        }));
      });

      svg.appendChild(el('line', {
        x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h,
        stroke: 'var(--w-edge)', 'stroke-width': 1.3
      }));
      svg.appendChild(el('text', { x: x0, y: y0 + h + 20, 'class': 'lbl sm' },
                         'band 0 — fastest'));
      svg.appendChild(el('text', {
        x: x0 + w, y: y0 + h + 20, 'class': 'lbl sm end'
      }, 'band ' + (n - 1) + ' — slowest'));
      svg.appendChild(el('text', { x: x0, y: 20, 'class': 'lbl sm' },
                         NAMES[method] + ', ' + commas(ctx) + ' → ' +
                         commas(target)));
      svg.appendChild(el('text', { x: x0, y: 36, 'class': 'lbl sm' },
                         'how far past its trained angles each band is pushed'));
      svg.appendChild(el('text', {
        x: x0 - 8, y: toY(1) + 4, 'class': 'lbl sm end'
      }, '1×'));
      if (hi > 0.5) {
        svg.appendChild(el('text', {
          x: x0 - 8, y: toY(Math.pow(10, hi - 0.15)) + 4, 'class': 'lbl sm end'
        }, Math.round(Math.pow(10, hi - 0.15)) + '×'));
      }
    }

    onInput(sIn, draw);
    onInput(ctxIn, draw);
    draw();
  }


  // =========================================================================
  // Lab 3: what a real week actually holds
  //
  // Steady-state arithmetic over Keshav's own per-pass costs. For every paper
  // that enters the funnel you pay t1, then s1 of them cost t2, then s1*s2 of
  // them cost t3 -- so one triaged paper costs t1 + s1*t2 + s1*s2*t3 minutes
  // all in, and the week's budget divided by that is how many can enter.
  // =========================================================================

  var T1 = 10, T2 = 60, T3 = 240;        // minutes per pass, Keshav 2007
  var WEEKS_PER_MONTH = 52 / 12;

  function initFunnelLab() {
    var root = document.getElementById('funnel-lab');
    if (!root) { return; }

    var svg = $(root, 'svg');
    var minIn = $(root, '#fun-min');
    var daysIn = $(root, '#fun-days');
    var s1In = $(root, '#fun-s1');
    var s2In = $(root, '#fun-s2');

    function draw() {
      var mins = parseFloat(minIn.value);
      var days = parseFloat(daysIn.value);
      var s1 = parseFloat(s1In.value) / 100;
      var s2 = parseFloat(s2In.value) / 100;

      var budget = mins * days;                        // minutes per week
      var perPaper = T1 + s1 * T2 + s1 * s2 * T3;      // all-in cost of one
      var n1 = budget / perPaper;
      var n2 = n1 * s1;
      var n3 = n2 * s2;
      var deepPerMonth = n3 * WEEKS_PER_MONTH;

      var t1 = n1 * T1, t2 = n2 * T2, t3 = n3 * T3;    // sums to budget

      $(root, '#fun-min-v').textContent = mins + ' min';
      $(root, '#fun-days-v').textContent = days;
      $(root, '#fun-s1-v').textContent = Math.round(s1 * 100) + '%';
      $(root, '#fun-s2-v').textContent = Math.round(s2 * 100) + '%';

      $(root, '#fun-stat-1').innerHTML =
          n1.toFixed(1) + ' <small>a week</small>';
      $(root, '#fun-stat-2').innerHTML =
          n2.toFixed(1) + ' <small>a week</small>';
      $(root, '#fun-stat-3').innerHTML =
          deepPerMonth.toFixed(1) + ' <small>a month</small>';

      var v = $(root, '#fun-verdict');
      if (deepPerMonth < 0.5) {
        v.className = 'verdict bad';
        v.textContent = 'At ' + budget + ' minutes a week you finish a third ' +
            'pass about once every ' + (1 / deepPerMonth).toFixed(1) +
            ' months. You are triaging, not reading — fine for a survey, ' +
            'fatal if you are meant to be building on something.';
      } else if (n1 < 3) {
        v.className = 'verdict warn';
        v.textContent = 'Only ' + n1.toFixed(1) + ' papers reach a first pass ' +
            'each week, so almost nothing is being rejected — the funnel is ' +
            'too narrow at the top to be choosing well. Widen it before you ' +
            'deepen it.';
      } else if (deepPerMonth > 6) {
        v.className = 'verdict warn';
        v.textContent = deepPerMonth.toFixed(1) + ' rebuilt papers a month is ' +
            'more than most full-time researchers manage. Worth checking that ' +
            'what you are calling a third pass is not a careful second one.';
      } else {
        v.className = 'verdict';
        v.textContent = n1.toFixed(1) + ' triaged a week, ' + n2.toFixed(1) +
            ' read through, ' + deepPerMonth.toFixed(1) + ' rebuilt a month. ' +
            'That is a working funnel: wide enough at the top to reject, ' +
            'narrow enough at the bottom to finish something.';
      }

      // ---- the drawing ----------------------------------------------------
      clear(svg);
      var x0 = 168, wMax = 396;
      var rows = [
        ['pass 1 · triage',      n1, T1, 'var(--w-student)', n1.toFixed(1) + ' / week'],
        ['pass 2 · read through', n2, T2, 'var(--w-teacher)', n2.toFixed(1) + ' / week'],
        ['pass 3 · rebuild',      n3, T3, 'var(--w-loss)',
         deepPerMonth.toFixed(1) + ' / month']
      ];
      var top = n1 > 0 ? n1 : 1;

      rows.forEach(function (r, i) {
        var y = 26 + 50 * i;
        var w = Math.max(2, wMax * (r[1] / top));
        svg.appendChild(el('rect', {
          x: x0, y: y, width: wMax, height: 34, rx: 8,
          fill: 'var(--w-grid)'
        }));
        svg.appendChild(el('rect', {
          x: x0, y: y, width: w, height: 34, rx: 8,
          fill: r[3], 'fill-opacity': 0.85, 'class': 'bar'
        }));
        svg.appendChild(el('text', {
          x: x0 - 12, y: y + 22, 'class': 'lbl sm end'
        }, r[0]));
        svg.appendChild(el('text', {
          x: x0 + w + 10, y: y + 22, 'class': 'lbl sm',
          style: 'fill:' + r[3]
        }, r[4]));
        // only label inside the bar when there is room; a narrow pass-3 bar
        // would otherwise collide with its own count on the right.
        if (w > 96) {
          svg.appendChild(el('text', {
            x: x0 + 12, y: y + 22, 'class': 'lbl sm on'
          }, r[2] + ' min each'));
        }
      });

      // where the minutes go
      var by = 196, bw = wMax;
      svg.appendChild(el('text', { x: x0 - 12, y: by + 20, 'class': 'lbl sm end' },
                         'the week’s minutes'));
      var segs = [[t1, 'var(--w-student)'], [t2, 'var(--w-teacher)'],
                  [t3, 'var(--w-loss)']];
      var cx = x0;
      segs.forEach(function (s) {
        var w = bw * (s[0] / budget);
        svg.appendChild(el('rect', {
          x: cx, y: by, width: Math.max(0, w), height: 30,
          fill: s[1], 'fill-opacity': 0.85, 'class': 'bar'
        }));
        if (w > 40) {
          svg.appendChild(el('text', {
            x: cx + w / 2, y: by + 20, 'class': 'lbl sm mid on'
          }, Math.round(100 * s[0] / budget) + '%'));
        }
        cx += w;
      });
      svg.appendChild(el('text', {
        x: x0 + bw + 10, y: by + 20, 'class': 'lbl sm'
      }, commas(budget) + ' min'));
      svg.appendChild(el('text', { x: x0, y: 16, 'class': 'lbl sm' },
                         'one triaged paper costs ' + perPaper.toFixed(0) +
                         ' minutes all in, third pass included'));
    }

    onInput(minIn, draw);
    onInput(daysIn, draw);
    onInput(s1In, draw);
    onInput(s2In, draw);
    draw();
  }

  initDecayLab();
  initSpectrumLab();
  initFunnelLab();
}());
