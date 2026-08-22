/* ---------------------------------------------------------------------------
   widgets.js -- the figure driver and the helpers every lab is built from.

   Shared by blog posts and scratch notes, and loaded before either of their
   own scripts. It does two things:

   1. Drives `.nfig` and `.flashcard`: both start paused, play when they first
      scroll into view, and restart when Replay is pressed. The CSS owns the
      choreography; this measures path lengths so `a-draw` knows how far to
      travel, and adds or removes one class.
   2. Exposes `window.W` -- the DOM, maths and control helpers the labs share,
      so one fix to a slider or a softmax lands everywhere at once.

   Everything degrades to a static page if a lab's markup is missing.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -- DOM ------------------------------------------------------------------

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

  // -- numbers --------------------------------------------------------------

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
     blank a readout mid-drag. */
  function kl(p, q) {
    var total = 0;
    for (var i = 0; i < p.length; i++) {
      var pi = Math.max(p[i], 1e-12);
      var qi = Math.max(q[i], 1e-12);
      total += pi * Math.log(pi / qi);
    }
    return Math.max(total, 0);
  }

  /* A deterministic [0,1) stream. Labs need values that look organic but must
     be identical on every render and reload, so nothing shifts under the
     reader when they drag a slider back and forth. */
  function seeded(seed) {
    var s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  // -- controls -------------------------------------------------------------

  /* Paint the filled part of a range track. WebKit has no
     ::-moz-range-progress equivalent, so the fill is a gradient stop driven
     by this variable. */
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

  /* A segmented control: buttons with data-value, one pressed at a time.
     Returns a getter for the pressed value. */
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

  // -- the figure driver ----------------------------------------------------

  /* Every animated class, spelled out. A restart has to touch the exact
     elements, and `[class*="a-"]` would also catch anything else containing
     those two characters. */
  var ANIMATED = ['.a-draw', '.a-rise', '.a-fade', '.a-grow', '.a-wide',
                  '.a-pop', '.a-drop', '.a-slide', '.a-vanish', '.a-flow',
                  '.a-beat', '.a-glow', '.a-spin', '.a-sweep', '.a-travel',
                  '.a-breathe', '.card'].join(',');

  function play(stage) {
    /* Toggling `is-playing` alone only flips animation-play-state, and the
       reveal animations are all `forwards` -- once finished, resuming holds
       the last frame, so Replay appears to do nothing. The animation has to
       be destroyed and rebuilt: drop it inline, force a reflow so the removal
       is committed, then hand it back. Clearing the inline value restores the
       stylesheet's animation, delays and all, and leaves the --d custom
       properties on the element untouched. */
    var nodes = $$(stage, ANIMATED);
    stage.classList.remove('is-playing');
    nodes.forEach(function (node) { node.style.animation = 'none'; });
    void stage.offsetWidth;
    nodes.forEach(function (node) { node.style.animation = ''; });
    stage.classList.add('is-playing');
  }

  function initFigures() {
    var stages = $$(document, '.nfig, .flashcard');
    if (!stages.length) { return; }

    /* `a-draw` traces a stroke by animating dashoffset from the path's own
       length down to zero, so each path is measured before it can animate.
       Doing it here rather than hard-coding --len keeps figures editable. */
    stages.forEach(function (stage) {
      $$(stage, '.a-draw').forEach(function (path) {
        if (path.style.getPropertyValue('--len')) { return; }
        var len = 0;
        try { len = path.getTotalLength(); } catch (e) { len = 0; }
        if (len > 0) { path.style.setProperty('--len', Math.ceil(len + 2)); }
      });
      var button = $(stage, '.replay');
      if (button) {
        button.addEventListener('click', function () { play(stage); });
      }
    });

    if (reduceMotion) {
      // The CSS already forces the finished state; marking them played keeps
      // the two halves consistent.
      stages.forEach(function (s) { s.classList.add('is-playing'); });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      stages.forEach(play);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        play(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

    stages.forEach(function (s) { observer.observe(s); });
  }

  // -- export ---------------------------------------------------------------

  window.W = {
    SVG: SVG,
    reduceMotion: reduceMotion,
    el: el, clear: clear, $: $, $$: $$,
    commas: commas, compact: compact,
    softmax: softmax, kl: kl, seeded: seeded,
    paintRange: paintRange, onInput: onInput, segment: segment,
    play: play
  };

  initFigures();
}());
