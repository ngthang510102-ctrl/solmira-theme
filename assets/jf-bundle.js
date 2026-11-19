/* JFEASE - combos Individual / Duo para la landing de cajas de almacenaje.
   Lo carga sections/jf-bundle.liquid. Construye el selector de combos dentro de la caja de compra de
   jf-landing, elige la variante (?variant=, que lee el formulario COD), cambia la foto de la galeria,
   calcula el total y anade una nota en el formulario de pedido.
   Variantes (opcion "Cantidad"): "2 uds", "4 uds", "Duo: 2 uds + 2 uds", "Duo: 2 uds + 4 uds", "Duo: 4 uds + 4 uds".
   Un titulo con un solo numero es Individual; con dos numeros es Duo. */
(function () {
  'use strict';

  var active = null;

  function money(c) {
    return (c / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function fill(t, o) {
    return String(t || '').replace(/\[(\w+)\]/g, function (m, k) { return o[k] != null ? o[k] : m; });
  }

  function init() {
    var dataEl = document.querySelector('script[data-jf-bundle]');
    var root = document.querySelector('[data-jf-landing]');
    if (!dataEl || !root) return;
    var old = root.querySelector('.jfb');
    if (old) old.remove();

    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var cfg = data.cfg || {};

    var singles = {}, duos = {}, sizes = [];
    (data.variants || []).forEach(function (v) {
      var nums = String(v.title).match(/\d+/g);
      if (!nums) return;
      nums = nums.map(Number);
      if (nums.length === 1) {
        singles[nums[0]] = v;
        if (sizes.indexOf(nums[0]) < 0) sizes.push(nums[0]);
      } else if (nums.length === 2) {
        duos[Math.min(nums[0], nums[1]) + '-' + Math.max(nums[0], nums[1])] = v;
      }
    });
    sizes.sort(function (a, b) { return a - b; });
    if (!sizes.length) return;

    var ref = root.querySelector('.jf-packs__h') || root.querySelector('[data-jf-packs]') ||
      root.querySelector('.jf-freeship') || root.querySelector('.jf-cta--main');
    if (!ref || !ref.parentNode) return;

    // Galeria: las dos ultimas fotos son el pack de 2 y el pack de 4
    var thumbs = [].slice.call(root.querySelectorAll('.jf-gal__thumb'));
    var slideImgs = [].slice.call(root.querySelectorAll('.jf-gal__slide img'));
    var n = thumbs.length;
    function sizeIdx(sz) { return n - sizes.length + sizes.indexOf(sz); }
    function imgIndex(combo, sz) {
      if (!n) return -1;
      var fixed = parseInt(combo === 'duo' ? cfg.img_duo : cfg.img_single, 10) || 0;
      if (fixed > 0) return Math.min(fixed, n) - 1;
      if (combo === 'duo') return n - 1;
      return Math.max(0, sizeIdx(sz));
    }
    function thumbSrc(sz) {
      var t = thumbs[Math.max(0, sizeIdx(sz))];
      var im = t && t.querySelector('img');
      return im ? (im.currentSrc || im.src) : '';
    }
    function fullSrc(i) {
      var im = slideImgs[i];
      return im ? (im.currentSrc || im.src) : '';
    }
    function jump(i) {
      var t = thumbs[i];
      if (t) t.click();
    }

    function unit(k) { return k + ' ' + (cfg.unit || 'uds'); }

    var st = {
      combo: cfg.default_combo === 'single' ? 'single' : 'duo',
      s: sizes[0], d1: sizes[0], d2: sizes[0]
    };
    function duoVariant() {
      return duos[Math.min(st.d1, st.d2) + '-' + Math.max(st.d1, st.d2)];
    }
    function variant() {
      return st.combo === 'single' ? singles[st.s] : duoVariant();
    }
    function units() {
      return st.combo === 'single' ? st.s : st.d1 + st.d2;
    }

    function selectHtml(key) {
      return '<select class="jfb__sel" data-sel="' + key + '" aria-label="' + esc(cfg.qty_label) + '">' +
        sizes.map(function (k) { return '<option value="' + k + '">' + esc(unit(k)) + '</option>'; }).join('') +
        '</select>';
    }
    function rowHtml(key, label) {
      return '<div class="jfb__opt">' +
        (n ? '<img data-thumb="' + key + '" alt="" width="44" height="44">' : '') +
        (label ? '<span>' + esc(label) + '</span>' : '') +
        selectHtml(key) + '</div>';
    }

    var box = document.createElement('div');
    box.className = 'jfb';
    box.setAttribute('role', 'radiogroup');
    box.innerHTML =
      '<p class="jfb__h"><span>' + esc(cfg.heading) + '</span></p>' +
      '<div class="jfb__card" data-combo="single" role="radio" tabindex="0" aria-checked="false">' +
        '<div class="jfb__row"><i class="jfb__radio" aria-hidden="true"></i>' +
        '<div class="jfb__tx"><span class="jfb__name">' + esc(cfg.single_name) + '</span>' +
        '<span class="jfb__sub">' + esc(cfg.single_sub) + '</span></div>' +
        '<div class="jfb__price"><b data-p="single"></b><s data-c="single"></s></div></div>' +
        '<div class="jfb__opts"><div class="jfb__optl">' + esc(cfg.qty_label) + '</div>' + rowHtml('s', '') + '</div>' +
      '</div>' +
      '<div class="jfb__card" data-combo="duo" role="radio" tabindex="0" aria-checked="false">' +
        (cfg.duo_badge ? '<span class="jfb__badge">' + esc(cfg.duo_badge) + '</span>' : '') +
        '<div class="jfb__row"><i class="jfb__radio" aria-hidden="true"></i>' +
        '<div class="jfb__tx"><span class="jfb__name">' + esc(cfg.duo_name) + '<em class="jfb__save" data-save hidden></em></span>' +
        '<span class="jfb__sub" data-pct></span></div>' +
        '<div class="jfb__price"><b data-p="duo"></b><s data-c="duo"></s></div></div>' +
        '<div class="jfb__opts"><div class="jfb__optl">' + esc(cfg.qty_label) + '</div>' +
        rowHtml('d1', (cfg.pack_label || 'Pack') + ' 1') + rowHtml('d2', (cfg.pack_label || 'Pack') + ' 2') + '</div>' +
      '</div>' +
      '<div class="jfb__tot"><span data-totl></span><b data-tot></b></div>' +
      '<p class="jfb__hint" data-hint hidden></p>';
    ref.parentNode.insertBefore(box, ref);

    function setPrice(key, v) {
      if (!v) return;
      box.querySelector('[data-p="' + key + '"]').textContent = money(v.price);
      box.querySelector('[data-c="' + key + '"]').textContent = v.compare > v.price ? money(v.compare) : '';
    }

    // Precio principal, total fijo y ?variant= para el formulario COD
    function apply(v) {
      if (!v) return;
      var p = root.querySelector('[data-jf-price]');
      var c = root.querySelector('[data-jf-compare]');
      var b = root.querySelector('[data-jf-badge]');
      var has = v.compare > v.price;
      if (p) p.textContent = money(v.price);
      if (c) { c.hidden = !has; c.textContent = has ? money(v.compare) : ''; }
      if (b) {
        b.hidden = !has;
        b.textContent = has ? (cfg.badge_label || 'AHORRA') + ' ' + Math.round((v.compare - v.price) * 100 / v.compare) + ' %' : '';
      }
      root.querySelectorAll('[data-jf-total]').forEach(function (el) { el.textContent = money(v.price); });
      try {
        var url = new URL(location.href);
        url.searchParams.set('variant', v.id);
        history.replaceState(history.state, '', url.toString());
      } catch (e) {}
    }

    function render() {
      box.querySelectorAll('[data-combo]').forEach(function (card) {
        var on = card.dataset.combo === st.combo;
        card.classList.toggle('is-on', on);
        card.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      var dv = duoVariant();
      setPrice('single', singles[st.s]);
      setPrice('duo', dv);

      var saveEl = box.querySelector('[data-save]');
      var pctEl = box.querySelector('[data-pct]');
      if (dv && dv.compare > dv.price) {
        saveEl.hidden = false;
        saveEl.textContent = (cfg.save_word || 'AHORRA') + ' ' + money(dv.compare - dv.price);
        pctEl.textContent = fill(cfg.saved_pct, { pct: Math.round((dv.compare - dv.price) * 100 / dv.compare) });
      } else {
        saveEl.hidden = true;
        pctEl.textContent = '';
      }

      box.querySelectorAll('select[data-sel]').forEach(function (sel) { sel.value = String(st[sel.dataset.sel]); });
      box.querySelectorAll('[data-thumb]').forEach(function (im) {
        var src = thumbSrc(st[im.dataset.thumb]);
        if (src && im.getAttribute('src') !== src) im.src = src;
      });

      var v = variant();
      box.querySelector('[data-totl]').textContent = fill(cfg.total_label, { n: units() });
      box.querySelector('[data-tot]').textContent = v ? money(v.price) : '';
      var hint = box.querySelector('[data-hint]');
      hint.hidden = st.combo !== 'duo' || !cfg.duo_hint;
      hint.textContent = cfg.duo_hint || '';
      apply(v);
    }

    function choose(combo) {
      if (st.combo === combo) return;
      st.combo = combo;
      render();
      jump(imgIndex(combo, st.s));
    }

    box.addEventListener('click', function (e) {
      if (e.target.closest('select')) return;
      var card = e.target.closest('[data-combo]');
      if (card) choose(card.dataset.combo);
    });
    box.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.tagName === 'SELECT') return;
      var card = e.target.closest('[data-combo]');
      if (!card) return;
      e.preventDefault();
      choose(card.dataset.combo);
    });
    box.addEventListener('change', function (e) {
      var sel = e.target.closest('select[data-sel]');
      if (!sel) return;
      var val = parseInt(sel.value, 10);
      var key = sel.dataset.sel;
      if (key === 's') {
        st.s = val;
        render();
        jump(imgIndex('single', val));
      } else if (key === 'd1') {
        // Al cambiar el pack 1, el pack 2 le sigue (se puede volver a cambiar a mano)
        st.d1 = val;
        st.d2 = val;
        render();
      } else {
        st.d2 = val;
        render();
      }
    });

    // Lo que el formulario COD debe mostrar para la eleccion actual
    active = function () {
      var pk = cfg.pack_label || 'Pack';
      var desc = st.combo === 'single'
        ? cfg.single_name + ' · ' + unit(st.s)
        : cfg.duo_name + ' · ' + pk + ' 1: ' + unit(st.d1) + ' + ' + pk + ' 2: ' + unit(st.d2);
      return {
        desc: desc,
        note: fill(cfg.cod_note, { desc: desc, n: units() }),
        img: fullSrc(imgIndex(st.combo, st.s))
      };
    };

    render();
  }

  // Formulario de pedido: resumen claro de lo que ha elegido el cliente
  function onCodOpen() {
    if (!active) return;
    var f = document.querySelector('cod-form');
    if (!f) return;
    var a = active();
    var vEl = f.querySelector('[data-summary-variant]');
    if (vEl) vEl.textContent = a.desc;
    var img = f.querySelector('[data-summary-image]');
    if (img && a.img) img.src = a.img;
    var note = f.querySelector('.jfb-codnote');
    if (!note) {
      var sum = f.querySelector('.cod-summary');
      if (!sum) return;
      note = document.createElement('p');
      note.className = 'jfb-codnote';
      sum.parentNode.insertBefore(note, sum.nextSibling);
    }
    note.textContent = a.note;
  }

  if (!window.__jfbBound) {
    window.__jfbBound = true;
    document.addEventListener('cod:open', onCodOpen);
    document.addEventListener('shopify:section:load', function () { setTimeout(init, 60); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();