
/* ============================================================
   JFEASE — People Viewing Product
   MOCK MODE ONLY — All Shopify Themes
   ============================================================ */

/* ---------- 1. Settings ---------- */

var JF_VIEWERS_CONFIG = {
  demoMin: 25,          // Minimum simulated viewers
  demoMax: 60,          // Maximum simulated viewers
  maxStep: 10,          // Maximum change per update
  intervalMs: 20000,    // Update every 20 seconds
  animationMs: 60       // Number animation speed
};

/* ============================================================
   Engine — MOCK ONLY
   ============================================================ */

(function () {
  'use strict';

  var C = JF_VIEWERS_CONFIG;

  // Random integer between min and max.
  function rint(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  // Smooth number animation.
  function animate(el, from, to, state) {

    if (state.animationTimer) {
      clearInterval(state.animationTimer);
      state.animationTimer = null;
    }

    var reducedMotion =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    if (from === to || reducedMotion) {
      el.textContent = to;
      return;
    }

    var dir = to > from ? 1 : -1;
    var cur = from;

    state.animationTimer = setInterval(function () {

      cur += dir;
      el.textContent = cur;

      if (cur === to) {
        clearInterval(state.animationTimer);
        state.animationTimer = null;
      }

    }, C.animationMs);
  }

  // Initialize viewers box.
  function start(box) {

    if (!box || box.dataset.jfViewersReady) {
      return;
    }

    var num = box.querySelector('[data-viewers-n]');

    if (!num) {
      return;
    }

    box.dataset.jfViewersReady = '1';

    var lo = Math.max(
      0,
      Math.floor(Math.min(C.demoMin, C.demoMax))
    );

    var hi = Math.max(
      lo,
      Math.floor(Math.max(C.demoMin, C.demoMax))
    );

    var state = {
      animationTimer: null,
      updateTimer: null
    };

    // Always start with a simulated value.
    var current = rint(lo, hi);

    num.textContent = current;
    box.hidden = false;

    // Update the displayed value.
    function show(n) {

      n = Math.max(lo, Math.min(hi, Math.round(n)));

      animate(num, current, n, state);

      current = n;
      box.hidden = false;
    }

    // Generate next simulated viewer count.
    function update() {

      if (!box.isConnected) {
        clearInterval(state.updateTimer);

        if (state.animationTimer) {
          clearInterval(state.animationTimer);
        }

        return;
      }

      var step = rint(
        1,
        Math.max(1, Math.floor(C.maxStep))
      );

      var direction = Math.random() < 0.5 ? -1 : 1;

      var next = current + step * direction;

      // Bounce back if outside allowed range.
      if (next > hi || next < lo) {
        next = current - step * direction;
      }

      // Keep value inside the range.
      next = Math.max(lo, Math.min(hi, next));

      show(next);
    }

    // Automatically update every configured interval.
    state.updateTimer = setInterval(
      update,
      Math.max(1000, C.intervalMs)
    );
  }

  // Initialize all viewer boxes.
  function boot() {

    document
      .querySelectorAll('[data-jf-viewers]')
      .forEach(start);

  }

  // Initial page load.
  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      boot
    );

  } else {

    boot();

  }

  // Shopify Theme Editor support.
  document.addEventListener(
    'shopify:section:load',
    boot
  );

})();
