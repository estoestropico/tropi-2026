/* TRÓPICO — caso.js : script de las páginas de caso.
   Adaptación liviana del original (functions.js): se queda con lo esencial
   (GSAP + ScrollTrigger + Lenis) y reemplaza jQuery/AOS/jarallax/headroom/
   slicknav por vanilla y por el sistema del sitio. Requiere que el shell cargue
   gsap.min.js, ScrollTrigger.min.js y lenis.min.js antes que este archivo. */
(function () {
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = window.gsap && window.ScrollTrigger;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ===== Lenis + sincronía con GSAP ScrollTrigger (patrón estándar) ===== */
  let lenis = null;
  if (!REDUCE && window.Lenis) {
    lenis = new Lenis();
    if (window.TROPICO) window.TROPICO.lenis = lenis;
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }

  /* ===== Reveal on scroll (data-aos → feel .rv del sitio, una sola vez) ===== */
  (() => {
    const els = [...document.querySelectorAll("[data-aos]")];
    if (REDUCE || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("aos-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("aos-in"); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    els.forEach(e => io.observe(e));
  })();

  /* ===== Parallax (reemplaza jarallax) con GSAP ===== */
  if (hasGSAP && !REDUCE) {
    document.querySelectorAll(".jarallax").forEach(box => {
      const img = box.querySelector(".jarallax-img"); if (!img) return;
      img.style.willChange = "transform";
      gsap.fromTo(img, { yPercent: -10, scale: 1.18 }, {
        yPercent: 10, scale: 1.18, ease: "none",
        scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ===== Overlap del título: la imagen sube y tapa el título fijo ===== */
  if (hasGSAP && !REDUCE) {
    const main = document.querySelector("#tropi-project-main");
    const overlap = document.querySelector("#tropi-project-overlap");
    if (main && overlap) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: overlap,
          start: 0,
          end: () => main.offsetHeight,
          toggleActions: "play none none reverse",
          scrub: 1
        }
      });
      // Solo desvanecemos el hero fijo. NO animamos el margin-top del overlap:
      // eso cambiaba el alto del documento en pleno scroll (−615px) y dejaba a Lenis
      // con un límite viejo → footer cortado. El reveal lo hace el margin-top CSS
      // estático (var(--main-top-height)): el overlap tapa al hero fijo con el scroll natural.
      tl.to(main, { yPercent: -10, opacity: 0, ease: "power2.out" });
    }
  }

  /* ===== Videos: carga diferida al entrar en viewport ===== */
  (() => {
    const videos = document.querySelectorAll("video[data-src]");
    if (!("IntersectionObserver" in window)) { videos.forEach(v => { v.src = v.dataset.src; v.load(); }); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { const v = e.target; v.src = v.dataset.src; v.load(); io.unobserve(v); } });
    }, { rootMargin: "200px" });
    videos.forEach(v => io.observe(v));
  })();

  if (hasGSAP) window.addEventListener("resize", () => ScrollTrigger.refresh());

  /* ===== Re-medir el alto cuando cargan imágenes/videos pesados =====
     Lenis y ScrollTrigger miden el límite de scroll en el load inicial. En páginas
     con imágenes grandes (Parisi, Farmaexpert) esas imágenes terminan de cargar
     DESPUÉS, el documento crece y queda un límite viejo → el footer se "corta".
     Abrir el inspector lo arregla porque dispara un `resize`. Replicamos ese resize:
     no alcanza con lenis.resize() a secas, hay que emitir el evento real. */
  (() => {
    let t;
    const remeasure = () => {
      window.dispatchEvent(new Event("resize"));            // = lo que hace abrir el inspector
      try { if (window.TROPICO && window.TROPICO.lenis) window.TROPICO.lenis.resize(); } catch (e) {}
      if (hasGSAP) ScrollTrigger.refresh();
    };
    const debounced = () => { clearTimeout(t); t = setTimeout(remeasure, 120); };
    // tras el load, varias pasadas por si el decode de imágenes llega tarde
    window.addEventListener("load", () => { remeasure(); setTimeout(remeasure, 300); setTimeout(remeasure, 1000); });
    // cualquier cambio de alto del documento (imagen/video que entra en layout)
    if ("ResizeObserver" in window) new ResizeObserver(debounced).observe(document.documentElement);
    document.querySelectorAll("img").forEach(img => { if (!img.complete) img.addEventListener("load", debounced, { once: true }); });
    document.querySelectorAll("video").forEach(v => v.addEventListener("loadeddata", debounced, { once: true }));
  })();

  /* ===== Shell: topbar + menú mobile + ir-arriba (reusa los IDs del Nav/Footer) ===== */
  (() => {
    // Topbar (barra oscura): aparece al scrollear hacia arriba pasado el hero, como en el resto del sitio.
    const tb = document.getElementById("topbar");
    if (tb) { let last = scrollY;
      addEventListener("scroll", () => { const y = scrollY;
        if (y < last - 3 && y > innerHeight) tb.classList.add("show");
        else if (y > last + 3) tb.classList.remove("show");
        if (y < innerHeight * 0.6) tb.classList.remove("show");
        last = y;
      }, { passive: true });
    }
    const b = document.getElementById("burger"), m = document.getElementById("mmenu"), h = document.getElementById("mhead");
    if (b && m) {
      const close = () => { b.classList.remove("open"); m.classList.remove("open"); document.body.style.overflow = ""; };
      b.addEventListener("click", () => { const o = !m.classList.contains("open"); b.classList.toggle("open", o); m.classList.toggle("open", o); document.body.style.overflow = o ? "hidden" : ""; });
      m.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
      if (h) { let l = scrollY; addEventListener("scroll", () => { const y = scrollY;
        h.classList.toggle("scrolled", y > innerHeight * 0.55);
        if (m.classList.contains("open")) { h.classList.remove("hide"); l = y; return; }
        if (y > l + 4 && y > innerHeight * 0.7) h.classList.add("hide");
        else if (y < l - 4) h.classList.remove("hide");
        l = y;
      }, { passive: true }); }
    }
    document.querySelectorAll(".s-foot .up").forEach(el => {
      el.style.cursor = "pointer";
      el.addEventListener("click", (e) => { e.preventDefault(); if (lenis) lenis.scrollTo(0, { duration: 1.1 }); else window.scrollTo({ top: 0, behavior: "smooth" }); });
    });
  })();
})();
