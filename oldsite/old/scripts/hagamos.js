/* TRÓPICO — hagamos.js
   Efecto UNIFICADO del bloque "Hagamos algo juntos". Una sola fuente de verdad.

   Criterio: las DISTANCIAS entre eventos son idénticas en todas las páginas
   (gap violeta→texto, fade, stagger de las 2 líneas, firmeza del botón). Lo único
   que cambia por página es el ANCLA A = el punto de scroll donde el fondo ya quedó
   violeta (data-hag-anchor en el .s-hag, fracción del viewport). Así, si en una página
   el violeta llega temprano el Hagamos aparece temprano, y si llega tarde aparece tarde,
   pero SIEMPRE a la misma distancia del violeta.

   El color de fondo (blanco/oscuro→violeta) lo maneja cada página. Desktop only. */
(function () {
  var h = document.querySelector(".s-hag"); if (!h) return;
  var mq = window.matchMedia("(min-width:1025px)");   // = CSS mobile (max-width:760). RESIZE-AWARE (no cacheado).
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  var eye = h.querySelector(".eye"), ttl = h.querySelector(".ttl"), cta = h.querySelector(".cta");

  // parte el título en 2 líneas (l1/l2) si no lo está — sin tocar el markup
  var l1 = ttl && ttl.querySelector(".l1"), l2 = ttl && ttl.querySelector(".l2");
  if (ttl && !l1 && /<br/i.test(ttl.innerHTML)) {
    var parts = ttl.innerHTML.split(/<br\s*\/?>/i);
    ttl.innerHTML = '<span class="l1">' + parts[0].trim() + '</span><br><span class="l2">' + parts.slice(1).join(" ").trim() + '</span>';
    l1 = ttl.querySelector(".l1"); l2 = ttl.querySelector(".l2");
  }

  var els = [eye, ttl, cta].filter(Boolean);
  // ANCLA por página: fracción del viewport donde el fondo ya quedó violeta.
  var A = parseFloat(h.getAttribute("data-hag-anchor")); if (isNaN(A)) A = 0.38;

  // ==== DISTANCIAS (fracción de viewport) — IGUALES EN TODAS LAS PÁGINAS ====
  var TTL_GAP = 0.10,   // el título/eye entra este tanto DESPUÉS del violeta
      FADE    = 0.16,   // duración del fade-in + entrada 10px
      L2LAG   = 0.06,   // "algo juntos" arranca este cachito después
      CTA_GAP = 0.02,   // el botón entra casi con el violeta...
      CTA_FADE= 0.18;   // ...y más firme (menos transparente)

  // limpia todo lo que el efecto pudo dejar inline → vuelve al CSS estático (mobile)
  var clearFixed = function () {
    els.forEach(function (el) { el.style.position = ""; el.style.opacity = ""; el.style.pointerEvents = ""; el.style.transform = ""; });
    if (l1) l1.style.transform = ""; if (l2) l2.style.transform = "";
  };

  var on = function () {
    if (!mq.matches) { clearFixed(); return; }   // mobile/tablet-portrait: nada fijo, manda el CSS
    var st = h.getBoundingClientRect().top, H = innerHeight;
    if (l1) l1.style.transform = "translateY(" + ((1 - clamp(((A - TTL_GAP) * H - st) / (FADE * H))) * 10).toFixed(1) + "px)";
    if (l2) l2.style.transform = "translateY(" + ((1 - clamp(((A - TTL_GAP - L2LAG) * H - st) / (FADE * H))) * 10).toFixed(1) + "px)";
    if (st <= 0) {
      els.forEach(function (el) { el.style.position = "absolute"; el.style.opacity = "1"; el.style.pointerEvents = ""; });
    } else {
      var vis = clamp(((A - TTL_GAP) * H - st) / (FADE * H)),
          ctaVis = clamp(((A - CTA_GAP) * H - st) / (CTA_FADE * H));
      [eye, ttl].forEach(function (el) { if (el) { el.style.position = "fixed"; el.style.opacity = vis.toFixed(3); el.style.pointerEvents = vis < 0.05 ? "none" : ""; } });
      if (cta) { cta.style.position = "fixed"; cta.style.opacity = ctaVis.toFixed(3); cta.style.pointerEvents = ctaVis < 0.05 ? "none" : ""; }
    }
  };

  addEventListener("scroll", on, { passive: true });
  addEventListener("resize", on);
  if (mq.addEventListener) mq.addEventListener("change", on); else mq.addListener(on);   // limpia/activa al cruzar el breakpoint
  var T = window.TROPICO; if (T && T.UPDATES) T.UPDATES.push(on);
  on();
})();
