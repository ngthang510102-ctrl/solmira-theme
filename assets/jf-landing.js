/* JFEASE landing page behaviour (sections/jf-landing.liquid, jf-reviews.liquid).
   No libraries. Every buy button opens the store's COD form (snippets/cod-form.liquid) by clicking
   its own opener (#cod-open); the chosen variant is put in the URL (?variant=), which the COD form
   reads, so the order flow is unchanged. */
(function () {
  'use strict';

  var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function money(cents, trim) {
    var whole = trim && cents % 100 === 0;
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2
    });
  }

  function initLanding(root) {
    if (!root || root.dataset.jfReady) return;
    root.dataset.jfReady = '1';

    var dataEl = root.querySelector('[data-jf-product]');
    var data = dataEl ? JSON.parse(dataEl.textContent) : { variants: [], packPos: 0, colorPos: 0 };
    var variants = data.variants;
    var packIdx = data.packPos - 1;
    var colorIdx = data.colorPos - 1;

    // Pack size, decided per variant: the number at the start of the pack name ("2 sartenes" = 2)
    // wins; without a number, the SKU suffix x1/x2 (read by the theme); if no variant has either,
    // the position of the pack in the list.
    if (packIdx >= 0) {
      var packNames = [];
      variants.forEach(function (v) { if (packNames.indexOf(v.options[packIdx]) < 0) packNames.push(v.options[packIdx]); });
      var allOne = variants.every(function (v) { return v.qty === 1; });
      variants.forEach(function (v) {
        var n = parseInt(v.options[packIdx], 10);
        if (n > 0) v.qty = n;
        else if (allOne) v.qty = packNames.indexOf(v.options[packIdx]) + 1;
      });
    }

    /* ---------- Variant choice (pack + colour) ---------- */
    var packInputs = [].slice.call(root.querySelectorAll('[data-jf-packs] input[type="radio"]'));
    var colorSelects = [].slice.call(root.querySelectorAll('[data-jf-color]'));
    var colorPills = [].slice.call(root.querySelectorAll('[data-jf-color-pill]'));
    var cards = data.packLayout === 'cards';
    var current = null;

    function chosenColor() {
      if (colorIdx < 0) return null;
      if (colorPills.length) {
        var on = colorPills.filter(function (p) { return p.checked; })[0];
        return (on || colorPills[0]).value;
      }
      if (!colorSelects.length) return null;
      var checked = packInputs.filter(function (i) { return i.checked; })[0];
      var sel = checked ? checked.closest('.jf-pack').querySelector('[data-jf-color]') : null;
      return (sel || colorSelects[0]).value;
    }

    // Price of one single unit in the given colour (the pack with qty 1), used for the real saving
    function singlePrice(color) {
      var one = variants.filter(function (v) {
        return v.qty === 1 && (colorIdx < 0 || color == null || v.options[colorIdx] === color);
      })[0];
      return one ? one.price : null;
    }

    function find(pack, color) {
      return variants.filter(function (v) {
        return (packIdx < 0 || pack == null || v.options[packIdx] === pack) &&
          (colorIdx < 0 || color == null || v.options[colorIdx] === color);
      });
    }

    function pick() {
      var checked = packInputs.filter(function (i) { return i.checked; })[0];
      var pack = checked ? checked.value : null;
      var color = chosenColor();
      var list = find(pack, color);
      return list.filter(function (v) { return v.available; })[0] || list[0] || variants[0];
    }

    function fromUrl() {
      var id = Number(new URLSearchParams(location.search).get('variant'));
      return variants.filter(function (v) { return v.id === id; })[0];
    }

    // Compare-at price: the real one from Shopify, else built from the pack's "discount %" setting
    function cmp(v, packValue) {
      if (v.compare > v.price) return v.compare;
      var idx = packInputs.map(function (i) { return i.value; }).indexOf(packValue);
      var d = Number((data.discounts || [])[idx]) || 0;
      return d > 0 && d < 100 ? Math.round(v.price * 100 / (100 - d)) : 0;
    }

    function render() {
      var v = current;
      if (!v) return;
      var color = chosenColor();

      // Price row
      var priceEl = root.querySelector('[data-jf-price]');
      var compEl = root.querySelector('[data-jf-compare]');
      var badgeEl = root.querySelector('[data-jf-badge]');
      if (priceEl) priceEl.textContent = money(v.price);
      var vCmp = cmp(v, data.packPos > 0 ? v.options[data.packPos - 1] : null);
      var hasSale = vCmp > v.price;
      if (compEl) { compEl.hidden = !hasSale; compEl.textContent = hasSale ? money(vCmp) : ''; }
      if (badgeEl) {
        badgeEl.hidden = !hasSale;
        badgeEl.textContent = hasSale ? data.saveLabel + ' ' + Math.round((vCmp - v.price) * 100 / vCmp) + ' %' : '';
      }

      // Pack cards: price for the chosen colour, price per unit, real saving, sold out
      var single = singlePrice(color);
      packInputs.forEach(function (input) {
        var card = input.closest('.jf-pack');
        var pv = find(input.value, color)[0];
        if (!pv) return;
        var p = card.querySelector('[data-jf-pack-price]');
        var c = card.querySelector('[data-jf-pack-compare]');
        var u = card.querySelector('[data-jf-unit]');
        var s = card.querySelector('[data-jf-save]');
        if (p) p.textContent = money(pv.price, cards);
        var pc = cmp(pv, input.value);
        if (c) c.textContent = pc > pv.price ? money(pc, cards) : '';
        if (u) u.textContent = money(Math.round(pv.price / Math.max(1, pv.qty)), cards) + (data.unitSuffix || '');
        if (s) {
          var saving = single != null && pv.qty > 1 ? single * pv.qty - pv.price : 0;
          s.hidden = saving <= 0;
          s.textContent = saving > 0 ? (data.savingLabel || 'Ahorra') + ' ' + money(saving, true) : '';
        }
        card.classList.toggle('is-off', !pv.available);
      });
      // Keep every colour control showing the same colour
      colorSelects.forEach(function (s) { if (color && s.value !== color) s.value = color; });
      colorPills.forEach(function (p) { p.checked = p.value === color; });

      // Sticky total + URL for the COD form
      root.querySelectorAll('[data-jf-total]').forEach(function (el) { el.textContent = money(v.price); });
      var url = new URL(location.href);
      url.searchParams.set('variant', v.id);
      history.replaceState(history.state, '', url.toString());

      // Gallery: show the variant image
      if (v.media && gallery) gallery.goToMedia(v.media);

      root.dispatchEvent(new CustomEvent('jf:variant', { bubbles: true, detail: v }));
    }

    function update() {
      current = pick();
      render();
    }

    packInputs.forEach(function (i) { i.addEventListener('change', update); });
    colorSelects.forEach(function (s) {
      s.addEventListener('change', function () {
        var val = s.value;
        colorSelects.forEach(function (o) { o.value = val; });
        update();
      });
      // Clicking the select inside a card should not toggle another pack
      s.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    colorPills.forEach(function (p) { p.addEventListener('change', update); });

    /* ---------- Buy buttons → existing COD form ---------- */
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-jf-buy]');
      if (!btn) return;
      e.preventDefault();
      var opener = document.getElementById('cod-open');
      if (opener && !opener.disabled) {
        opener.click();
      } else if (Shopify && Shopify.designMode) {
        alert('Form COD chưa có URL máy chủ: Cài đặt theme → Formulario COD.');
      }
    });

    /* ---------- Gallery ---------- */
    var gallery = (function () {
      var g = root.querySelector('[data-jf-gallery]');
      if (!g) return null;
      var track = g.querySelector('[data-jf-track]');
      var slides = [].slice.call(track.children);
      var thumbs = [].slice.call(g.querySelectorAll('[data-jf-thumb]'));
      function index() { return Math.round(track.scrollLeft / (track.clientWidth || 1)); }
      function go(i) {
        i = (i + slides.length) % slides.length;
        track.scrollTo({ left: i * track.clientWidth });
        mark(i);
      }
      function mark(i) {
        thumbs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); });
        var on = thumbs[i];
        if (on && on.parentNode.scrollWidth > on.parentNode.clientWidth) {
          on.parentNode.scrollTo({ left: on.offsetLeft - 40, behavior: 'smooth' });
        }
      }
      var t;
      track.addEventListener('scroll', function () {
        clearTimeout(t);
        t = setTimeout(function () { mark(index()); }, 80);
      }, { passive: true });
      thumbs.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.jfThumb); }); });
      var prev = g.querySelector('[data-jf-prev]');
      var next = g.querySelector('[data-jf-next]');
      if (prev) prev.addEventListener('click', function () { go(index() - 1); });
      if (next) next.addEventListener('click', function () { go(index() + 1); });
      return {
        goToMedia: function (id) {
          var k = slides.findIndex(function (s) { return s.dataset.mediaId == id; });
          if (k > -1 && k !== index()) go(k);
        }
      };
    })();

    /* ---------- Menu ---------- */
    var burger = root.querySelector('[data-jf-burger]');
    var menu = root.querySelector('#jf-menu-m');
    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = burger.getAttribute('aria-expanded') !== 'true';
        burger.setAttribute('aria-expanded', open);
        menu.hidden = !open;
      });
    }

    /* ---------- Offer box: stock + countdown ---------- */
    var offer = root.querySelector('[data-jf-offer]');
    var stock = { remaining: null, total: 100 };
    if (offer) {
      var mode = offer.dataset.stockMode;
      var stockBox = offer.querySelector('[data-jf-stock]');
      stock.total = Math.max(1, parseInt(offer.dataset.stockTotal, 10) || 100);

      var paintStock = function () {
        if (mode === 'hidden' || stock.remaining == null) { stockBox.hidden = true; return; }
        var left = Math.max(0, Math.min(stock.remaining, stock.total));
        var sold = Math.round((stock.total - left) * 100 / stock.total);
        stockBox.hidden = false;
        offer.querySelector('[data-jf-remaining]').textContent = left;
        offer.querySelector('[data-jf-sold]').textContent = sold;
        offer.querySelector('[data-jf-stock-bar]').style.width = sold + '%';
      };

      var demoRemaining = null; // set only by the preview-only demo in jf-toast.js
      var readStock = function () {
        if (demoRemaining != null) stock.remaining = demoRemaining;
        else if (mode === 'manual') stock.remaining = parseInt(offer.dataset.stockManual, 10);
        else if (mode === 'inventory') stock.remaining = current && current.inventory != null ? current.inventory : null;
        if (isNaN(stock.remaining)) stock.remaining = null;
        paintStock();
      };
      root.addEventListener('jf:variant', readStock);
      // The bottom notification sets the count in its demo mode (preview only, see jf-toast.js)
      document.addEventListener('jf:remaining', function (e) {
        if (mode === 'hidden') return;
        stock.remaining = demoRemaining = e.detail;
        paintStock();
      });
      window.jfStock = function () { return stock.remaining; };

      // Countdown to the end date the merchant set (visitor's local time)
      var endTxt = (offer.dataset.countdownEnd || '').trim();
      var cd = offer.querySelector('[data-jf-cd]');
      var end = endTxt ? new Date(endTxt.replace(' ', 'T')) : null;
      if (end && !isNaN(end) && end > new Date()) {
        var D = cd.querySelector('[data-cd-d]');
        var Dsep = cd.querySelector('[data-cd-dsep]');
        var H = cd.querySelector('[data-cd-h]');
        var M = cd.querySelector('[data-cd-m]');
        var S = cd.querySelector('[data-cd-s]');
        var two = function (n) { return (n < 10 ? '0' : '') + n; };
        var tick = function () {
          var s = Math.max(0, Math.floor((end - new Date()) / 1000));
          if (s === 0) { cd.hidden = true; clearInterval(timer); return; }
          var days = Math.floor(s / 86400);
          D.hidden = Dsep.hidden = days === 0;
          D.textContent = days;
          H.textContent = two(Math.floor(s / 3600) % 24);
          M.textContent = two(Math.floor(s / 60) % 60);
          S.textContent = two(s % 60);
        };
        cd.hidden = false;
        tick();
        var timer = setInterval(tick, 1000);
      }
    }

    /* ---------- Delivery dates (business days from today) ---------- */
    root.querySelectorAll('[data-tl]').forEach(function (el) {
      var r = el.getAttribute('data-tl').split('-');
      var a = +r[0], b = +r[1];
      function day(n) {
        var x = new Date();
        while (n > 0) {
          x.setDate(x.getDate() + 1);
          if (x.getDay() !== 0 && x.getDay() !== 6) n--;
        }
        return x.getDate() + ' ' + MONTHS[x.getMonth()];
      }
      el.textContent = a === b ? day(a) : day(a) + ' – ' + day(b);
    });
    var steps = [].slice.call(root.querySelectorAll('.jf-tl__c'));
    if (steps.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var k = 0;
      setInterval(function () {
        steps.forEach(function (s, i) { s.classList.toggle('is-on', i === k); });
        k = (k + 1) % (steps.length + 1);
      }, 1100);
    }

    /* ---------- Sticky buy bar ---------- */
    var sticky = root.querySelector('[data-jf-sticky]');
    var mainCta = root.querySelector('.jf-cta--main');
    if (sticky && mainCta && 'IntersectionObserver' in window) {
      var past = false;
      var set = function (show) {
        sticky.classList.toggle('is-on', show);
        sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
        sticky.querySelector('button').tabIndex = show ? 0 : -1;
        document.documentElement.style.setProperty('--jf-dock', (show ? sticky.offsetHeight : 0) + 'px');
      };
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        past = !e.isIntersecting && e.boundingClientRect.top < 0;
        set(past);
      }).observe(mainCta);
    }

    // First render: honour ?variant= when it exists
    var start = fromUrl();
    if (start) {
      packInputs.forEach(function (i) { i.checked = packIdx >= 0 && i.value === start.options[packIdx]; });
      if (colorIdx >= 0) {
        colorSelects.forEach(function (s) { s.value = start.options[colorIdx]; });
        colorPills.forEach(function (p) { p.checked = p.value === start.options[colorIdx]; });
      }
    }
    if (packInputs.length && !packInputs.some(function (i) { return i.checked; })) packInputs[0].checked = true;
    update();
  }

  /* ---------- Reviews: "Ver más" ---------- */
  function initReviews(sec) {
    if (!sec || sec.dataset.jfReady) return;
    sec.dataset.jfReady = '1';
    var more = sec.querySelector('[data-jf-rs-more]');
    if (!more) return;
    more.addEventListener('click', function () {
      var step = parseInt(sec.dataset.visible, 10) || 8;
      var hidden = [].slice.call(sec.querySelectorAll('[data-extra][hidden]'));
      hidden.slice(0, step).forEach(function (c) { c.hidden = false; });
      if (hidden.length <= step) more.hidden = true;
    });
  }

  function boot() {
    document.querySelectorAll('[data-jf-landing]').forEach(initLanding);
    document.querySelectorAll('[data-jf-reviews]').forEach(initReviews);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
