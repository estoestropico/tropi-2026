/* TRÓPICO — core-boot.js
   Corre al final del <body>, después de los scripts de página (que ya
   registraron sus handlers en TROPICO.UPDATES). Maneja todo lo que es común
   a TODAS las páginas: preloader, reveal-on-scroll, topbar, menú mobile,
   CTAs magnéticos, "ir arriba", el único loop de scroll y Lenis. */
(function () {
  const T = window.TROPICO;
  const { D, REDUCE, clamp, lp, UPDATES } = T;

  /* El preloader (logo en ola + salida en columnas) vive en Nav.astro (inline),
     así corre en todas las páginas tengan o no core-boot. */

  /* ===== HERO: frase rotativa con máscara de color que sube (cascada) =====
     Estandarizado. NOTA: en las páginas de servicio el efecto está DESACTIVADO por pedido
     (header con una sola frase en color fijo). About mantiene su rotación (about.js).
     Para RE-ACTIVAR el efecto acá: borrar las 2 líneas marcadas abajo (add hero-static + return).
     Self-guard: si la página no tiene .s-bhero [data-rot], no hace nada. */
  (() => {
    const v = document.querySelector(".s-bhero [data-rot]"); if (!v) return;
    const phs = [...v.querySelectorAll(".ph")]; if (!phs.length) return;
    /* >>> desactivación del efecto (borrar estas 2 líneas para volver al header rotativo) <<< */
    v.closest(".s-bhero").classList.add("hero-static"); return;
    const place = (el, y) => el.style.transform = `translateY(${y})`;
    const instant = (el, fn) => { el.style.transition = "none"; fn(); void el.offsetWidth; el.style.transition = ""; };
    let i = 0, gen = 0, iv = null, t0 = null;
    const initP = () => { i = 0; phs.forEach((p, k) => instant(p, () => { p.style.setProperty("--vfill", "0"); place(p, k === 0 ? "0%" : "100%"); })); };
    const cycle = (g) => { if (g !== gen) return; const cur = phs[i], nxt = phs[(i + 1) % phs.length];
      cur.style.setProperty("--vfill", "1");
      setTimeout(() => { if (g !== gen) return; place(cur, "-100%");
        instant(nxt, () => { nxt.style.setProperty("--vfill", "0"); place(nxt, "100%"); });
        setTimeout(() => { if (g === gen) place(nxt, "0%"); }, 30);
        i = (i + 1) % phs.length;
      }, 1750);
    };
    const start = () => { gen++; const g = gen; clearInterval(iv); clearTimeout(t0); initP();
      if (REDUCE) { phs[0].style.setProperty("--vfill", "1"); return; }
      t0 = setTimeout(() => { if (g !== gen) return; cycle(g); iv = setInterval(() => cycle(g), 2700); }, 900); };
    start();
    addEventListener("pageshow", () => { start(); });
  })();

  /* ===== Cuerpo: texto que se completa PALABRA POR PALABRA al scrollear ===== */
  (() => {
    const blocks = [...document.querySelectorAll("[data-paint]")]; if (!blocks.length) return;
    blocks.forEach(b => { const words = b.textContent.trim().split(/\s+/);
      b.innerHTML = words.map(w => `<span class="wd">${w}</span>`).join(" "); });
    if (REDUCE) { blocks.forEach(b => b.querySelectorAll(".wd").forEach(w => w.classList.add("on"))); return; }
    const on = () => blocks.forEach(b => { const ws = [...b.querySelectorAll(".wd")], r = b.getBoundingClientRect();
      const p = clamp((innerHeight * 0.82 - r.top) / (innerHeight * 0.42));
      const n = Math.round(p * ws.length);
      ws.forEach((w, k) => w.classList.toggle("on", k < n));
    });
    UPDATES.push(on);
  })();

  /* ===== CTAs magnéticos (Hagamos, etc.) — scroll-aware (igual que disciplinas):
     recalculan con la última posición global del cursor en mousemove Y scroll, así el
     botón no queda colgado en el medio si scrolleás sin mover el mouse. ===== */
  (() => {
    if (!D) return;
    let mx = innerWidth / 2, my = innerHeight / 2;                 // cursor global
    addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.querySelectorAll("[data-follow]").forEach(el => {
      const host = el.closest("[data-hot]"); if (!host) return;
      const base = el.dataset.base || "";
      let fx = 0, fy = 0, tx = 0, ty = 0, raf = 0;
      const tick = () => { fx += (tx - fx) * .12; fy += (ty - fy) * .12; el.style.transform = `${base} translate(${fx}px,${fy}px)`; raf = requestAnimationFrame(tick); };
      const update = () => { const hr = host.getBoundingClientRect();
        const over = mx >= hr.left && mx <= hr.right && my >= hr.top && my <= hr.bottom;
        if (over) { const r = el.getBoundingClientRect();          // centro real = rect menos el translate actual
          tx = mx - (r.left + r.width / 2 - fx); ty = my - (r.top + r.height / 2 - fy); if (!raf) tick(); }
        else { tx = 0; ty = 0; } };                                // fuera del hot-zone → vuelve al centro
      addEventListener("mousemove", update, { passive: true });
      addEventListener("scroll", update, { passive: true });
    });
  })();

  /* ===== HAGAMOS: el efecto ahora vive en /scripts/hagamos.js (una sola fuente de verdad
     para TODAS las páginas). El color de fondo de esta sección lo maneja cada página. ===== */

  /* ===== Reveal on scroll (repetible) ===== */
  const io = new IntersectionObserver((es) => { es.forEach(e => { e.target.classList.toggle("in", e.isIntersecting); }); }, { threshold: .18 });
  const obs = () => document.querySelectorAll(".rv,.rvo,.rv-l,.rv-r").forEach(el => io.observe(el));
  obs(); setTimeout(obs, 0);

  /* ===== Topbar: baja al hacer scroll hacia arriba ===== */
  (() => {
    const tb = document.getElementById("topbar"); if (!tb) return; let last = scrollY;
    UPDATES.push(() => { const y = scrollY;
      if (y < last - 3 && y > innerHeight) tb.classList.add("show");
      else if (y > last + 3) tb.classList.remove("show");
      if (y < innerHeight * 0.6) tb.classList.remove("show");
      last = y;
    });
  })();

  /* ===== Menú hamburguesa + header mobile ===== */
  (() => {
    const b = document.getElementById("burger"), m = document.getElementById("mmenu"), h = document.getElementById("mhead"); if (!b || !m) return;
    const close = () => { b.classList.remove("open"); m.classList.remove("open"); document.body.style.overflow = ""; };
    b.addEventListener("click", () => { const o = !m.classList.contains("open"); b.classList.toggle("open", o); m.classList.toggle("open", o); document.body.style.overflow = o ? "hidden" : ""; });
    m.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
    if (h) { let l = scrollY; UPDATES.push(() => { const y = scrollY;
      h.classList.toggle("scrolled", y > innerHeight * 0.55);
      if (m.classList.contains("open")) { h.classList.remove("hide"); l = y; return; }
      if (y > l + 4 && y > innerHeight * 0.7) h.classList.add("hide");
      else if (y < l - 4) h.classList.remove("hide");
      l = y;
    }); }
  })();

  /* ===== Ir al top ===== */
  document.querySelectorAll(".s-foot .up").forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => { e.preventDefault(); if (T.lenis) T.lenis.scrollTo(0, { duration: 1.1 }); else window.scrollTo({ top: 0, behavior: "smooth" }); });
  });

  /* ===== Un handler de scroll para TODO el scroll-linked ===== */
  let ticking = false;
  const runUpdates = () => { for (let i = 0; i < UPDATES.length; i++) { try { UPDATES[i](); } catch (e) {} } ticking = false; };
  T.runUpdates = runUpdates;
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(runUpdates); } }, { passive: true });
  addEventListener("resize", runUpdates);
  runUpdates();

  /* ===== Smooth scroll (Lenis) — solo desktop ===== */
  if (!REDUCE && D && window.Lenis) {
    T.lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    (function raf(t) { T.lenis.raf(t); requestAnimationFrame(raf); })();
  }
})();
