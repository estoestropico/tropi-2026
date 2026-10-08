/* TRÓPICO — service.js
   Handlers específicos de las páginas de servicio (Ads, Web, Branding, Social,
   Automation): scroll horizontal del Proceso, pin de Alternativas, acordeón de
   Preguntas y los empalmes de color a pantalla completa. El hero rotativo es
   compartido y vive en core-boot.js. Corre ANTES del core-boot (registra en
   TROPICO.UPDATES). */
(function () {
  const { D, REDUCE, clamp, lp, UPDATES } = window.TROPICO;

  /* ===== HERO: parallax de la imagen de fondo (desktop). La .bimg sobresale del
     recorte (.s-bimg overflow:hidden) y se desplaza según cruza el viewport. ===== */
  (() => {
    const box = document.querySelector(".s-bimg"), img = box && box.querySelector(".bimg");
    if (!box || !img || !D || REDUCE) return;
    const on = () => { const r = box.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height));   // 0..1 mientras cruza el viewport
      img.style.transform = "translateY(" + lp(-8, 8, p).toFixed(2) + "%)";
    };
    UPDATES.push(on);
  })();

  /* ===== PROCESO: scroll horizontal anclado (vertical → horizontal) ===== */
  (() => {
    const sec = document.querySelector("[data-proc]"); if (!sec) return;
    const track = sec.querySelector("[data-ptrack]"); if (!track || !D) return; // mobile: scroll horizontal nativo (CSS)
    const cards = [...track.children], n = cards.length;
    const STG = 0.15, span = Math.max(0.001, 1 - STG * (n - 1));   // desfase (stagger) por card
    const ez = (t) => t * t * (3 - 2 * t);
    const on = () => { const r = sec.getBoundingClientRect(), tot = sec.offsetHeight - innerHeight, p = clamp(-r.top / tot);
      // 1) ENTRADA escalonada DURANTE la aparición (r.top de +vh → 0), lista al fijarse.
      //    'e' concentra la cascada en el tramo donde las cards ya se ven (no antes).
      const ep = clamp(1 - r.top / innerHeight), e = clamp((ep - 0.25) / 0.75), RISE = innerHeight * 0.5;
      cards.forEach((c, i) => {
        const ct = clamp((e - i * STG) / span);   // la 1ª entra primero, el resto en cascada
        c.style.transform = `translateY(${(RISE * (1 - ez(ct))).toFixed(1)}px)`;
      });
      // 2) SCROLL HORIZONTAL: ya alineadas (arranca al fijarse, ep ya = 1)
      const maxX = Math.max(0, track.scrollWidth - innerWidth);
      track.style.transform = `translateY(-50%) translateX(${(-p * maxX).toFixed(1)}px)`;
    };
    UPDATES.push(on);
  })();

  /* ===== ALTERNATIVAS: se lee scrolleando y se pinea por abajo ===== */
  (() => {
    const sec = document.querySelector(".s-balt"), bastk = sec && sec.querySelector(".bastk"); if (!sec || !bastk) return;
    const setup = () => {
      if (!D) { sec.style.height = ""; bastk.style.position = "static"; bastk.style.top = ""; return; } // mobile: flujo normal
      bastk.style.position = "sticky";
      const Hc = bastk.offsetHeight, vh = innerHeight;
      const EX = document.querySelector(".s-bcasos") ? Math.round(vh * 0.8) : 0;  // branding: queda clavado más tiempo (más lectura), mismo pin
      sec.style.height = (Hc + vh + EX) + "px";
      bastk.style.top = (vh - Hc) + "px";
    };
    setup(); addEventListener("resize", setup); addEventListener("load", setup);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);
  })();

  /* ===== PREGUNTAS: acordeón (uno abierto a la vez) ===== */
  (() => {
    const items = [...document.querySelectorAll(".s-bfaq .faq")];
    const set = (it, open) => { it.classList.toggle("open", open);
      const sg = it.querySelector(".sg"), btn = it.querySelector(".qbtn");
      if (sg) sg.textContent = open ? "–" : "+"; if (btn) btn.setAttribute("aria-label", open ? "Cerrar" : "Abrir"); };
    items.forEach(it => { it.querySelector(".head").addEventListener("click", () => {
      const willOpen = !it.classList.contains("open");
      items.forEach(o => set(o, false));
      set(it, willOpen);
    }); });
  })();

  /* ===== Empalmes de color a PANTALLA COMPLETA (cambian la página, sin línea) ===== */
  const C = {
    arena: "var(--arena)", oscuro: "var(--oscuro)", rojo: "var(--rojo)", white: "#fff", violeta: "var(--violeta)", manzana: "var(--manzana)"
  };
  // Interpolación en OKLCH: croma alto en todo el recorrido (sin gris/opaco del medio) y P3 solo.
  const mix = (A, B, t) => { t = clamp(t); return t <= 0 ? A : t >= 1 ? B : `color-mix(in oklab, ${B} ${(t * 100).toFixed(2)}%, ${A})`; };  // en reposo usa el token crudo (idéntico al CSS, sin costura ni titileo)
  const setBg = (el, c) => { el.style.background = c; };
  const INTRO = document.querySelector(".s-bintro"), ALT = document.querySelector(".s-balt"),
        BAST = document.querySelector(".s-balt .bastk"),
        BCASOS = document.querySelector(".s-bcasos"),
        PROC = document.querySelector(".s-bproc"), FAQ = document.querySelector(".s-bfaq"), HAG = document.querySelector(".s-hag");
  if (!INTRO && !ALT && !PROC && !FAQ) return; // no es una página de servicio
  const HAGeye = HAG && HAG.querySelector(".eye"), HAGttl = HAG && HAG.querySelector(".ttl");
  const PSTK = PROC && PROC.querySelector(".pstk");                 // contenido del Proceso (se desvanece al pasar a blanco)
  const FQT = FAQ && FAQ.querySelector(".ttl"), FQL = FAQ && FAQ.querySelector(".list");  // contenido del FAQ (entra recién con el blanco listo)
  const seamT = (el) => clamp((innerHeight * 0.62 - el.getBoundingClientRect().top) / (innerHeight * 0.42));
  // El blanco→violeta (FAQ/Hagamos) arranca más tarde y COMPLETA antes de que aparezca el
  // contenido del Hagamos (core-boot): primero queda todo violeta, después entra el texto.
  const seamHag = (el) => clamp((innerHeight * 0.52 - el.getBoundingClientRect().top) / (innerHeight * 0.14));
  const paint = () => {
    const tAlt = ALT ? seamT(ALT) : 0, tFaq = FAQ ? seamT(FAQ) : 0, tHag = HAG ? seamHag(HAG) : 0;
    if (INTRO) setBg(INTRO, mix(C.arena, C.oscuro, tAlt));
    if (BCASOS) setBg(BCASOS, mix(C.arena, C.oscuro, tAlt));   // el carrusel funde junto a s-balt (mismo tAlt, sin división)
    if (ALT) setBg(ALT, INTRO ? mix(C.arena, C.oscuro, tAlt) : C.oscuro);     // la SECCIÓN también funde: su bg fijo oscuro asomaba antes de tiempo al entrar (franja abajo)
    if (BAST) setBg(BAST, INTRO ? mix(C.arena, C.oscuro, tAlt) : C.oscuro);   // sin intro arena (automation): la placa va oscura directo, sin el blanco→oscuro
    if (PROC) setBg(PROC, mix(C.manzana, C.arena, tFaq));
    if (FAQ) setBg(FAQ, tHag > 0 ? mix(C.arena, C.violeta, tHag) : mix(C.manzana, C.arena, tFaq));
    if (HAG) { setBg(HAG, mix(C.arena, C.violeta, tHag)); }   // la visibilidad del contenido la maneja core-boot (efecto fijo)
    // Preguntas: primero el fondo pasa a arena, DESPUÉS entran las preguntas; el Proceso se
    // desvanece a la par. Al irse (entra el violeta del Hagamos) las preguntas se van un cachito antes.
    if (D) {
      if (PSTK) PSTK.style.opacity = clamp(1 - tFaq * 1.15).toFixed(3);
      const rf = clamp((tFaq - 0.7) / 0.3), rOut = clamp(1 - tHag * 1.35), y = ((1 - rf) * 16).toFixed(1);
      const op = (rf * rOut).toFixed(3);
      if (FQT) { FQT.style.opacity = op; FQT.style.transform = "translateY(" + y + "px)"; }
      if (FQL) { FQL.style.opacity = op; FQL.style.transform = "translateY(" + y + "px)"; }
    }
  };
  UPDATES.push(paint);
})();
