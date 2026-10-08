/* TRÓPICO — casos-carousel.js
   Carrusel horizontal de casos (tipo story) para las páginas de servicio.
   Las fichas pasan de a una, se posan en el centro y reproducen su story
   (autoplay por tiempo + flechas). Inactivas en B&N. Al terminar el último
   caso, sigue a la sección siguiente. Se activa solo si hay [data-lc]. */
(function () {
  const sec = document.querySelector('[data-lc]'); if (!sec) return;
  const track = sec.querySelector('[data-track]');
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const lp = (a, b, t) => a + (b - a) * t;
  const REDUCE = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const cards = [...sec.querySelectorAll('[data-card]')].map((c) => ({
    el: c, n: +c.dataset.n, idx: 0, timer: null,
    slides: [...c.querySelectorAll('.lc-slide')],
    bars: [...c.querySelectorAll('.lc-bar i')],
  }));
  const N = cards.length;
  const DUR = 2200;      // ms por slide (autoplay, tipo story)
  const DWELL = 1.4;     // unidades de scroll que la ficha queda posada en el centro
  const GAP = 1.15;      // unidades para el paso entre fichas (transición)

  const segs = []; let T = 0;
  cards.forEach((c, i) => { segs.push({ type: 'd', card: i, start: T, len: DWELL }); T += DWELL;
    if (i < N - 1) { segs.push({ type: 'g', card: i, start: T, len: GAP }); T += GAP; } });
  // el último caso queda centrado y grande hasta que la sección baja (sin salida lateral)

  const centerX = (i) => innerWidth / 2 - (cards[i].el.offsetLeft + cards[i].el.offsetWidth / 2);
  const sectionTop = () => sec.getBoundingClientRect().top + scrollY;   // top absoluto (offsetParent-safe)
  const caseScrollY = (i) => { const g = segs.find((s) => s.type === 'd' && s.card === i);
    return sectionTop() + ((g.start + g.len * 0.5) / T) * (sec.offsetHeight - innerHeight); };

  const paintBars = (c, k, animateCurrent) => {
    c.bars.forEach((b, j) => {
      if (j < k) { b.style.transition = 'none'; b.style.transform = 'scaleX(1)'; }
      else if (j > k) { b.style.transition = 'none'; b.style.transform = 'scaleX(0)'; }
      else if (animateCurrent && !REDUCE) {
        b.style.transition = 'none'; b.style.transform = 'scaleX(0)';
        b.getBoundingClientRect();
        b.style.transition = 'transform ' + DUR + 'ms linear';
        b.style.transform = 'scaleX(1)';
      } else { b.style.transition = 'none'; b.style.transform = 'scaleX(1)'; }
    });
  };
  const showSlide = (c, k, animate) => {
    c.idx = k;
    c.slides.forEach((sl, j) => {
      const on = j === k;
      sl.classList.toggle('on', on);
      const v = sl.querySelector('video');   // los slides de video loopean mientras están activos; obedecen al slider, no tienen controles
      if (v) { if (on) { try { v.currentTime = 0; } catch (e) {} v.play().catch(() => {}); } else { v.pause(); } }
    });
    paintBars(c, k, animate);
  };
  const stopStory = (c) => {
    if (c.timer) { clearTimeout(c.timer); c.timer = null; }
    const b = c.bars[c.idx]; if (b) { const t = getComputedStyle(b).transform; b.style.transition = 'none'; if (t && t !== 'none') b.style.transform = t; }
  };
  const nextSection = () => document.querySelector('.s-balt');
  const smoothTo = (y) => { const L = window.TROPICO && window.TROPICO.lenis;
    if (L) L.scrollTo(y, { duration: 0.9 }); else scrollTo({ top: y, behavior: 'smooth' }); };
  const advanceCase = (c) => { const i = cards.indexOf(c);
    if (i < N - 1) { smoothTo(caseScrollY(i + 1)); }               // → siguiente caso
    else { const nx = nextSection();                               // último caso → próxima sección
      smoothTo(nx ? nx.getBoundingClientRect().top + scrollY : sectionTop() + sec.offsetHeight); } };
  const playFrom = (c, k) => {
    stopStory(c);
    const stepNext = (kk) => {
      showSlide(c, kk, true);
      if (REDUCE) { c.timer = null; return; }
      if (kk < c.n - 1) c.timer = setTimeout(() => stepNext(kk + 1), DUR);
      else c.timer = setTimeout(() => advanceCase(c), DUR);
    };
    stepNext(k);
  };

  let cur = -1;
  // click en la ficha activa: mitad izq → anterior, mitad der → siguiente
  sec.addEventListener('click', (ev) => {
    if (cur < 0) return; const c = cards[cur];
    if (!c.el.contains(ev.target)) return;
    const r = c.el.getBoundingClientRect(); const back = ev.clientX < r.left + r.width / 2;
    if (back) { if (c.idx > 0) playFrom(c, c.idx - 1); else { const i = cards.indexOf(c); if (i > 0) { stopStory(c); smoothTo(caseScrollY(i - 1)); } } }
    else { if (c.idx < c.n - 1) playFrom(c, c.idx + 1); else { stopStory(c); advanceCase(c); } }
  });
  /* cursor "Siguiente" (círculo) sobre la ficha activa (reemplaza la manito y las flechas) */
  (() => {
    const lc = document.querySelector('[data-lc-cursor]'); if (!lc) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    const move = () => { x += (tx - x) * 0.25; y += (ty - y) * 0.25; lc.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)'; raf = requestAnimationFrame(move); };
    sec.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY;
      const over = cur >= 0 && cards[cur].el.contains(e.target);
      if (over) { const r = cards[cur].el.getBoundingClientRect(); lc.textContent = (e.clientX < r.left + r.width / 2) ? 'Anterior' : 'Siguiente';
        if (!on) { on = true; x = tx; y = ty; lc.classList.add('on'); if (!raf) move(); } }
      else if (on) { on = false; lc.classList.remove('on'); }
    });
    sec.addEventListener('mouseleave', () => { if (on) { on = false; lc.classList.remove('on'); } if (raf) { cancelAnimationFrame(raf); raf = 0; } });
  })();

  // el scroll define el objetivo; el movimiento visual se suaviza con inercia (rAF)
  let targetTx = 0, dispTx = null;
  const applyVisual = () => {
    track.style.transform = `translateX(${dispTx.toFixed(1)}px)`;
    cards.forEach((c) => {
      const cx = dispTx + c.el.offsetLeft + c.el.offsetWidth / 2;
      const k = clamp(1 - Math.abs(cx - innerWidth / 2) / (c.el.offsetWidth * 1.15));
      c.el.style.transform = `scale(${lp(0.8, 1, k).toFixed(3)})`;
      c.el.style.filter = `grayscale(${(1 - k).toFixed(3)})`;   // inactivos en blanco y negro
    });
  };

  const render = () => {
    const r = sec.getBoundingClientRect(), tot = sec.offsetHeight - innerHeight;
    const p = clamp(-r.top / tot);
    const pinned = r.top <= 1 && r.bottom >= innerHeight - 1;
    const s = p * T;
    let seg = segs[segs.length - 1];
    for (const g of segs) { if (s >= g.start && s < g.start + g.len) { seg = g; break; } }
    const local = clamp((s - seg.start) / seg.len);

    let active = -1;
    if (seg.type === 'd') { targetTx = centerX(seg.card); active = seg.card; }
    else { targetTx = lp(centerX(seg.card), centerX(seg.card + 1), local); }
    if (!pinned) active = -1;
    if (dispTx === null) { dispTx = targetTx; applyVisual(); }

    cards.forEach((c, i) => c.el.classList.toggle('act', i === active));

    if (active !== cur) {
      if (cur >= 0) stopStory(cards[cur]);
      if (active >= 0) playFrom(cards[active], 0);
      cur = active;
    }
  };

  const loop = () => {
    if (dispTx !== null && Math.abs(targetTx - dispTx) > 0.05) {
      dispTx += (targetTx - dispTx) * 0.09;   // inercia (más chico = más suave/lento)
      applyVisual();
    }
    requestAnimationFrame(loop);
  };

  cards.forEach((c) => showSlide(c, 0, false));
  addEventListener('scroll', render, { passive: true });
  addEventListener('resize', render);
  render();
  requestAnimationFrame(loop);
})();
