
/* ============================================================
   JFEASE — Bottom Notification Slider
   MOCK MODE ONLY — All Shopify themes
   ============================================================ */

/* ---------- 1. Settings ---------- */
var JF_TOAST_CONFIG = {
  firstDelayMs: 6000,
  minGapMs: 20000,
  maxGapMs: 35000,
  minShowMs: 4000,
  maxShowMs: 5000,
  remainingStart: 23,
  remainingMin: 3,
  orderLine: 'Ejemplo de pedido',
  fromWord: ' de '
};

/* ---------- 2. Demo orders ---------- */
var JF_MOCK_ORDERS = [
  { name: 'Lucía', city: 'Madrid', timeAgo: 'hace 2 min' },
  { name: 'Javier', city: 'Valencia', timeAgo: 'hace 5 min' },
  { name: 'Carmen', city: 'Sevilla', timeAgo: 'hace 8 min' },
  { name: 'Pablo', city: 'Zaragoza', timeAgo: 'hace 11 min' },
  { name: 'Marta', city: 'Málaga', timeAgo: 'hace 14 min' },
  { name: 'Andrés', city: 'Bilbao', timeAgo: 'hace 19 min' },
  { name: 'Elena', city: 'Murcia', timeAgo: 'hace 23 min' },
  { name: 'Sergio', city: 'Alicante', timeAgo: 'hace 27 min' },
  { name: 'Nuria', city: 'Granada', timeAgo: 'hace 31 min' },
  { name: 'Raúl', city: 'Valladolid', timeAgo: 'hace 36 min' }
];

/* ---------- 3. Service messages ---------- */
var JF_SERVICE_MESSAGES = [
  {
    icon: 'truck',
    title: 'Envío gratis',
    text: 'en todos los pedidos'
  },
  {
    icon: 'cash',
    title: 'Pagas al recibir',
    text: 'en efectivo, sin tarjeta'
  },
  {
    icon: 'phone',
    title: 'Te llamamos en 24 h',
    text: 'para confirmar tu pedido'
  },
  {
    icon: 'shield',
    title: 'Garantía de 30 días',
    text: 'devolución sin complicaciones'
  }
];

/* ============================================================
   Engine — MOCK ONLY
   ============================================================ */

(function () {
  'use strict';

  var C = JF_TOAST_CONFIG;

  var ICONS = {
    truck:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 7h12v9H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',

    cash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/></svg>',

    phone:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/></svg>',

    shield:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>'
  };

  var AVATAR_COLORS = [
    '#F25A1F',
    '#3E7C6A',
    '#4A6FA5',
    '#9A5B8C',
    '#C6803B',
    '#5E8C4A'
  ];

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function shuffle(list) {
    var a = list.slice();

    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }

    return a;
  }

  function colorFor(s) {
    var h = 0;

    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }

    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  function start(el) {
    if (!el || el.dataset.jfToastReady) return;

    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var av = el.querySelector('[data-toast-av]');
    var t1 = el.querySelector('[data-toast-t1]');
    var t2 = el.querySelector('[data-toast-t2]');
    var closeBtn = el.querySelector('[data-toast-close]');

    if (!av || !t1 || !t2 || !closeBtn) return;

    el.dataset.jfToastReady = '1';

    var closed = false;

    // Always use mock data.
    var orders = shuffle(JF_MOCK_ORDERS);
    var services = shuffle(JF_SERVICE_MESSAGES);

    var oi = 0;
    var si = 0;
    var turn = 0;

    // Demo counter, independent of real stock.
    var remainingCount = C.remainingStart;

    function updateRemaining() {
      document.dispatchEvent(
        new CustomEvent('jf:remaining', {
          detail: remainingCount
        })
      );
    }

    updateRemaining();

    function showOrder(o) {
      av.innerHTML = '';
      av.textContent = o.name.charAt(0).toUpperCase();

      av.style.background = colorFor(o.name);
      av.style.color = '#fff';

      t1.textContent =
        o.name + (o.city ? C.fromWord + o.city : '');

      t2.textContent =
        C.orderLine + (o.timeAgo ? ' · ' + o.timeAgo : '');
    }

    function showService(m) {
      av.innerHTML = ICONS[m.icon] || ICONS.truck;

      av.style.background = '';
      av.style.color = '';

      t1.textContent = m.title;
      t2.textContent = m.text;
    }

    function beat() {
      if (closed) return;

      // Alternate: mock order, service, mock order, service.
      var useOrder = orders.length > 0 && turn % 2 === 0;
      turn++;

      if (useOrder) {
        showOrder(orders[oi++ % orders.length]);

        if (remainingCount > C.remainingMin) {
          remainingCount--;
          updateRemaining();
        }

      } else if (services.length > 0) {
        showService(services[si++ % services.length]);

      } else if (orders.length > 0) {
        showOrder(orders[oi++ % orders.length]);

      } else {
        return;
      }

      el.hidden = false;

      requestAnimationFrame(function () {
        if (!closed) el.classList.add('is-on');
      });

      setTimeout(function () {
        el.classList.remove('is-on');
      }, rand(C.minShowMs, C.maxShowMs));

      setTimeout(beat, rand(C.minGapMs, C.maxGapMs));
    }

    closeBtn.addEventListener('click', function () {
      closed = true;
      el.classList.remove('is-on');
    });

    setTimeout(beat, C.firstDelayMs);

    // Browser console testing.
    window.jfToast = {
      demo: true,
      remaining: function () {
        return remainingCount;
      },
      next: beat
    };
  }

  function boot() {
    document.querySelectorAll('[data-jf-toast]').forEach(start);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Support Shopify theme editor section reloads.
  document.addEventListener('shopify:section:load', boot);

})();
