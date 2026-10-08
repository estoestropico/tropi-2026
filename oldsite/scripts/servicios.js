/* TRÓPICO — servicios.js : handlers del ÍNDICE de Servicios.
   Solo la sección Disciplinas (mismas solapas que en home, siguen al cursor y al
   scroll). El resto —Lenis, topbar, menú, botones magnéticos (data-follow),
   rotador del hero y reveals .rv— lo aporta core-boot.js, que corre después.
   Este archivo se carga con core={true}. */
(function () {
  const { D, clamp, lp } = window.TROPICO;

  /* ===== HERO: parallax de la imagen (mismo efecto que los internos / service.js) ===== */
  (() => {
    const box = document.querySelector(".s-bimg"), img = box && box.querySelector(".bimg");
    if (!box || !img || !D || window.TROPICO.REDUCE) return;
    const on = () => { const r = box.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      img.style.transform = "translateY(" + lp(-8, 8, p).toFixed(2) + "%)"; };
    window.TROPICO.UPDATES.push(on);
  })();

  /* ===== SEAM de color: Piezas (oscuro) → Hagamos (violeta) =====
     Las dos secciones se pintan con el MISMO color a la vez, así el empalme no deja línea. */
  (() => {
    const pz = document.querySelector(".s-piezas"), hag = document.querySelector(".s-hag");
    if (!hag) return;
    const OSC = "var(--oscuro)", VIO = "var(--violeta)";
    const mix = (a, b, t) => { t = clamp(t); return t <= 0 ? a : t >= 1 ? b : `color-mix(in oklab, ${b} ${(t * 100).toFixed(2)}%, ${a})`; };
    const seam = (el) => clamp((innerHeight * 0.52 - el.getBoundingClientRect().top) / (innerHeight * 0.14));
    const paint = () => { const t = seam(hag), c = mix(OSC, VIO, t);
      hag.style.backgroundColor = c; if (pz) pz.style.backgroundColor = c; };
    const T = window.TROPICO; if (T && T.UPDATES) T.UPDATES.push(paint);
    addEventListener("scroll", paint, { passive: true }); addEventListener("resize", paint); paint();
  })();
})();
