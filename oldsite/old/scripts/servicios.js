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

  /* ===== DISCIPLINAS: solapas que suben siguiendo el cursor (idéntico a home) ===== */
  (() => {
    const d = document.querySelector("[data-disc]"); if (!d || !D) return;
    const b = d.querySelector("[data-blob]");
    const flaps = [...d.querySelectorAll(".dflap")], lis = [...d.querySelectorAll("li")];
    flaps.forEach((f, i) => f.style.zIndex = i);   // orden fijo: mayor índice, más arriba
    let tx = 0, ty = 0, bx = 0, by = 0, raf = 0, mx = innerWidth / 2, my = innerHeight / 2, inside = false;
    const tick = () => { bx += (tx - bx) * .18; by += (ty - by) * .18; b.style.left = bx + "px"; b.style.top = by + "px"; raf = requestAnimationFrame(tick); };
    const update = () => {
      const r = d.getBoundingClientRect();
      const over = mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
      if (over) {
        tx = mx - r.left; ty = my - r.top;
        if (!inside) { inside = true; bx = tx; by = ty; b.style.opacity = "1"; if (!raf) tick(); }
        let j = -1; for (let i = 0; i < lis.length; i++) { const lr = lis[i].getBoundingClientRect(); if (my >= lr.top && my <= lr.bottom) { j = i; break; } }
        flaps.forEach((f, i) => f.classList.toggle("up", j >= 0 && i <= j));   // suben 0..j según la disciplina bajo el cursor
      } else if (inside) { inside = false; b.style.opacity = "0"; flaps.forEach(f => f.classList.remove("up")); }
    };
    addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; update(); }, { passive: true });
    addEventListener("scroll", update, { passive: true });   // recalcula al scrollear sin mover el mouse
  })();

  /* ===== SEAMS de color: Disciplinas(oscuro) → Etapas(arena) → Hagamos(violeta) =====
     Truco de las internas (service.js): las DOS secciones de cada empalme se pintan con
     el MISMO color a la vez, así no hay línea — la pantalla entera funde junta. Disciplinas
     y Etapas comparten el negro→arena; Etapas y Hagamos comparten el arena→violeta. En
     Hagamos el violeta completa antes de que entre el texto (timing en hagamos.js). */
  (() => {
    const disc = document.querySelector(".s-disc"), mom = document.querySelector(".s-momento"), hag = document.querySelector(".s-hag");
    const momWrap = mom && mom.querySelector(".mm-wrap");
    const OSC = "var(--oscuro)", AREN = "var(--arena)", VIO = "var(--violeta)";
    // Interpolación en OKLCH: mantiene el croma alto en todo el recorrido (sin el gris/opaco del
    // medio que da el sRGB) y maneja P3 solo. Los extremos rinden EXACTO al color base.
    const mix = (a, b, t) => { t = clamp(t); return t <= 0 ? a : t >= 1 ? b : `color-mix(in oklab, ${b} ${(t * 100).toFixed(2)}%, ${a})`; };  // en reposo usa el token crudo (idéntico al CSS, sin costura ni titileo)
    // negro→arena, arranca TARDE: recién cuando Disciplinas casi salió de cuadro (su borde
    // inferior por arriba del 12% del viewport), así Disciplinas se mantiene oscuro sólido
    // mientras se ve, y no se aclara/titila. Rango corto (0.16vh).
    const seamMom = (el) => clamp((innerHeight * 0.28 - el.getBoundingClientRect().top) / (innerHeight * 0.18));
    // arena→violeta; completa antes de que aparezca el texto del Hagamos
    const seamHag = (el) => clamp((innerHeight * 0.52 - el.getBoundingClientRect().top) / (innerHeight * 0.14));
    const paint = () => {
      const tMom = mom ? seamMom(mom) : 1, tHag = hag ? seamHag(hag) : 0;
      if (D && disc) disc.style.backgroundColor = mix(OSC, AREN, tMom);            // Disciplinas funde a arena al salir (comparte color con Etapas)
      if (mom) mom.style.backgroundColor = (tHag > 0) ? mix(AREN, VIO, tHag) : (D ? mix(OSC, AREN, tMom) : mix(AREN, AREN, 0));
      if (hag) hag.style.backgroundColor = mix(AREN, VIO, tHag);
      // el contenido de Etapas aparece ATADO al color (fade-in con arena) y se DESVANECE al
      // entrar el violeta del Hagamos — mismo criterio que about→washington
      if (momWrap) {
        const revIn = D ? clamp((tMom - 0.6) / 0.4) : 1;
        const revOut = clamp(1 - tHag * 1.4);   // ya no se ve el texto de etapas cuando pasa a violeta
        momWrap.style.opacity = (revIn * revOut).toFixed(3);
        momWrap.style.transform = "translateY(" + ((1 - revIn) * 14).toFixed(1) + "px)";
      }
    };
    const T = window.TROPICO; if (T && T.UPDATES) T.UPDATES.push(paint);
    addEventListener("scroll", paint, { passive: true }); addEventListener("resize", paint); paint();
  })();
})();
