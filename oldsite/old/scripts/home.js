/* TRÓPICO — home.js : script autocontenido del home (verbatim; URLs de Figma remapeadas a /img). */
  const D = window.matchMedia("(min-width:1025px)").matches;   // alineado al CSS mobile (max-width:760)
  const clamp = (v)=>Math.min(1,Math.max(0,v));
  const ease = (t)=>1-Math.pow(1-t,3);
  const lp = (a,b,t)=>a+(b-a)*t;
  const P3=a=>`color(display-p3 ${(a[0]/255).toFixed(4)} ${(a[1]/255).toFixed(4)} ${(a[2]/255).toFixed(4)})`;

  // Slider mobile reutilizable: arrastre (mouse+touch) + auto-advance ping-pong con pausa al interactuar.
  // itemsSel: selector de los ítems (si no, usa hijos directos). byVW: avanza de a un viewport.
  window.__mkSlider = function(el, o){ o=o||{}; if(!el) return; if(window.matchMedia("(min-width:1025px)").matches) return;
    let down=false,sx=0,sl=0,moved=false,paused=false,rt=null;
    const pause=()=>{ paused=true; clearTimeout(rt); };
    const resume=()=>{ clearTimeout(rt); rt=setTimeout(()=>{paused=false;},2600); };
    el.style.cursor="grab";
    // ARRASTRE CON MOUSE (en touch alcanza el scroll nativo del overflow-x)
    el.addEventListener("mousedown",e=>{ down=true;moved=false;sx=e.clientX;sl=el.scrollLeft; el.style.cursor="grabbing"; pause(); e.preventDefault(); });
    window.addEventListener("mousemove",e=>{ if(!down)return; const dx=e.clientX-sx; if(Math.abs(dx)>3)moved=true; el.scrollLeft=sl-dx; });
    window.addEventListener("mouseup",()=>{ if(!down)return; down=false; el.style.cursor="grab"; resume(); });
    el.addEventListener("click",e=>{ if(moved){ e.preventDefault(); e.stopPropagation(); } },true);
    // pausar el auto mientras el usuario toca/scrollea
    el.addEventListener("touchstart",pause,{passive:true}); el.addEventListener("touchend",resume,{passive:true});
    const items = o.itemsSel ? [...el.querySelectorAll(o.itemsSel)] : [...el.children];

    // En mobile, el height inline en cqw de los logos le gana a mi CSS y deforma el ancho.
    // Borro el tamaño inline acá (solo mobile: __mkSlider ya salió en desktop) => manda el CSS px.
    if(o.stripImgSize) el.querySelectorAll("img").forEach(im=>{ im.style.width=""; im.style.height=""; });

    // LOOP INFINITO (o.loop): clona un set antes y otro después; el set real queda al medio.
    // Al entrar en la zona de clones se teletransporta ±OW (contenido idéntico => sin salto visible).
    const n=items.length;
    const step=()=> (n>1 ? (items[1].offsetLeft-items[0].offsetLeft) : 0) || el.clientWidth; // paso = distancia entre ítems (incluye gap)
    if(o.loop && n>1){
      const parent=items[0].parentNode;
      const clone=()=>items.map(k=>{const c=k.cloneNode(true);c.dataset.clone="1";c.setAttribute("aria-hidden","true");return c;});
      const pre=clone(); const frag=document.createDocumentFragment(); pre.forEach(c=>frag.appendChild(c)); parent.insertBefore(frag,items[0]);
      clone().forEach(c=>parent.appendChild(c));
      // arranca en el set real (índice n); OW se calcula EN VIVO (no cacheado, evita medir con la sección aún sin ancho)
      const recenter=()=>{ el.scrollLeft=n*step(); };
      requestAnimationFrame(()=>requestAnimationFrame(recenter));
      // teletransporte por rAF (no depende de eventos scroll, que Lenis intercepta):
      // cuando el scroll está quieto y cae en la zona de clones, salta ±un set (contenido idéntico)
      let last=-1, still=0;
      const tick=()=>{ if(!down){ const x=Math.round(el.scrollLeft);
        if(x===last){ still++; if(still>2){ const s=step(); if(s){ const OW=n*s; const idx=Math.round(x/s);
          if(idx<n) el.scrollLeft=x+OW; else if(idx>=2*n) el.scrollLeft=x-OW; } } } else still=0;
        last=Math.round(el.scrollLeft); } requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }

    if(o.interval && items.length>1){
      if(o.loop){ setInterval(()=>{ if(paused)return; el.scrollBy({left:step(), behavior:"smooth"}); }, o.interval); }
      else { let i=0; setInterval(()=>{ if(paused)return; i++; if(i>=items.length) i=0; // loop simple: vuelve al primero
        el.scrollTo({left: o.byVW ? i*el.clientWidth : items[i].offsetLeft, behavior:"smooth"}); }, o.interval); }
    }
  };

  // Efecto escritura: texto que se completa palabra por palabra al scrollear
  (()=>{ const REDUCE=matchMedia("(prefers-reduced-motion:reduce)").matches;
    const blocks=[...document.querySelectorAll("[data-paint]")]; if(!blocks.length)return;
    blocks.forEach(b=>{ const words=b.textContent.trim().split(/\s+/); b.innerHTML=words.map(w=>`<span class="wd">${w}</span>`).join(" "); });
    if(REDUCE){ blocks.forEach(b=>b.querySelectorAll(".wd").forEach(w=>w.classList.add("on"))); return; }
    const on=()=>blocks.forEach(b=>{ const ws=[...b.querySelectorAll(".wd")];
      // En secciones pineadas (desktop), el rect del bloque se congela: manejamos el progreso
      // por el scroll del pin (data-paint-pin en la sección) y un sub-rango data-paint-start/end.
      const pin = D ? b.closest("[data-paint-pin]") : null;
      let p;
      if(pin){ const pr=pin.getBoundingClientRect(), tot=pin.offsetHeight-innerHeight;
        const sp=clamp(-pr.top/tot);
        const a=parseFloat(b.dataset.paintStart)||0, z=parseFloat(b.dataset.paintEnd)||0.3;
        p=clamp((sp-a)/(z-a));
      } else { const r=b.getBoundingClientRect(); p=clamp((innerHeight*0.82-r.top)/(innerHeight*0.25)); }   // rango más corto → el párrafo termina de escribirse más rápido
      const n=Math.round(p*ws.length);
      ws.forEach((w,k)=>w.classList.toggle("on",k<n)); });
    addEventListener("scroll",on,{passive:true}); addEventListener("resize",on); on();
  })();

  // HERO: el video crece desde la máscara a full width; la UI se desvanece
  (()=>{ const sec=document.querySelector("[data-hero]"); if(!sec||!D)return;
    const logo=sec.querySelector(".hui .logo");
    const hv=sec.querySelector("[data-hvideo]"), vid=hv&&hv.querySelector("video");
    const fastEls=[...sec.querySelectorAll(".hui .meta, .hui .left .lead, .hui .left .fs-hero")]; // se van rápido + suben
    const on=()=>{ const r=sec.getBoundingClientRect(),tot=sec.offsetHeight-innerHeight;
      const p=clamp(-r.top/tot); const ge=ease(clamp(p/0.3));
      const gf=clamp(-r.top/(innerHeight*(window.tFade||0.07))); // se van MUY rápido (tocá window.tFade en consola: .04 = más rápido, .15 = más lento)
      const fo=clamp(1-gf*1.3);
      fastEls.forEach(el=>{ el.style.opacity=fo; el.style.transform=`translateY(${(-45*gf).toFixed(1)}px)`; el.style.pointerEvents=fo<0.05?"none":""; });
      if(logo){ logo.style.transformOrigin="top left"; logo.style.transform=`translateY(${lp(0,-9.5,ge).toFixed(2)}vh) scale(${lp(1,0.1235,ge).toFixed(4)})`; } // TRÓPICO -> 90x58, sube al topbar
      if(hv){ const sz=lp(20,165,ge).toFixed(2), px=lp(95,50,ge).toFixed(2), py=lp(86,50,ge).toFixed(2); // el video crece a full width
        hv.style.webkitMaskSize=sz+"vw auto"; hv.style.maskSize=sz+"vw auto"; hv.style.webkitMaskPosition=px+"% "+py+"%"; hv.style.maskPosition=px+"% "+py+"%";
        if(vid){ vid.style.transformOrigin=px+"% "+py+"%"; vid.style.transform="scale("+lp(.92,1,ge).toFixed(3)+")"; } }
    };
    addEventListener("scroll",on,{passive:true}); addEventListener("resize",on); on();
  })();

  // CASOS
  (()=>{ const pin=document.querySelector("[data-casos]"); if(!pin)return;
    const track=pin.querySelector("[data-track]"), stk=pin.querySelector(".stk"), aboutEl=document.querySelector(".s-about");
    const aboutInfo=aboutEl&&aboutEl.querySelector(".info"), aboutArcos=aboutEl&&aboutEl.querySelector(".arcos");
    const ws="/img/caso-placeholder.jpg";
    const data=[{n:"01/04",c:"Washington School",t:["Catorce años","creando identidad","para WS."],bg:"#002D7D",url:"/casos/washington-school",img:"/img/casos/washington_caso_home.webp"},
      {n:"02/04",c:"Parisi",t:["Potenciamos","el campo","desde adentro."],bg:"#00953B",url:"/casos/parisi",img:"/img/casos/parisi_caso_home.webp"},
      {n:"03/04",c:"Farmaexpert",t:["Crecer sin","perder la","cercanía."],bg:"#003DA6",url:"/casos/farmaexpert",img:"/img/casos/farmaexpert_caso_home.webp"},
      {n:"04/04",c:"Galarraga",t:["Su comunicación,","de la marca","al contenido."],bg:"#00A1E1",url:"/contacto",img:"/img/casos/galarraga_caso_home.webp"}];
    const arr='<svg viewBox="0 0 16 11" fill="none"><path d="M1 5.5h13M10 1l4 4.5L10 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    track.innerHTML=data.map(c=>`<div class="slide" data-bg="${c.bg}"><div class="caso" style="--cbg:${c.bg}"><div class="est"><div class="info"><div class="legal"><span class="pill num">${c.n}</span><span class="pill mod">Trópico 360</span></div><div class="txt"><p class="cli">${c.c}</p><h2 class="h">${c.t.map(l=>`<span>${l}</span>`).join("")}</h2><a class="ct-txt" href="${c.url||'/contacto'}">Ver caso ${arr}</a></div></div><div class="img"><img src="${c.img||ws}" alt="Caso ${c.c} — Trópico" loading="lazy"></div></div></div></div>`).join("");
    const cols=[...track.querySelectorAll(".slide")].map(s=>s.dataset.bg.replace("#","").match(/../g).map(h=>parseInt(h,16)));
    const rgb=P3;
    const solid=pin.hasAttribute("data-casos-solid");   // 360: entra directo al azul del caso, sin el blend arena→azul (que sí va en home)
    const bgAt=p=>{const n=cols.length-1,s=p*n,i=Math.min(n-1,Math.floor(s));let t=s-i;t=t<0.55?0:(t-0.55)/0.45;t=t*t*(3-2*t);return rgb([0,1,2].map(k=>Math.round(lp(cols[i][k],cols[i+1][k],t))));};
    // Mobile: slider arrastrable (mouse+touch) + auto-advance
    window.__mkSlider(stk, {interval:3800, itemsSel:".slide", byVW:true, loop:true});
    const on=()=>{ if(!D){return;} const r=pin.getBoundingClientRect();
      // hold de Washington (1er caso) al inicio; cada transición = 1 viewport; el alto extra final queda como hold de Galarraga
      const wsHold=innerHeight*0.2;
      const q=clamp((-r.top-wsHold)/((cols.length-1)*innerHeight));
      track.style.transform=`translateX(${-q*(track.scrollWidth-innerWidth)}px)`;
      if(r.top>0){ const g=clamp((1-r.top/innerHeight)/0.5);   // más rápida: completa en ~medio viewport
        const c= solid ? rgb(cols[0]) : `color-mix(in srgb, var(--arena), rgb(${cols[0][0]},${cols[0][1]},${cols[0][2]}) ${(g*100).toFixed(1)}%)`; stk.style.background=c; if(aboutEl)aboutEl.style.background=c;
        const ao=clamp(1-g*1.4).toFixed(3); if(aboutInfo)aboutInfo.style.opacity=ao; if(aboutArcos)aboutArcos.style.opacity=ao; }   // la info se funde a medida que pasa a azul
      else { stk.style.background=bgAt(q); if(aboutEl)aboutEl.style.background=rgb(cols[0]); if(aboutInfo)aboutInfo.style.opacity=0; if(aboutArcos)aboutArcos.style.opacity=0; } };
    addEventListener("scroll",on,{passive:true}); addEventListener("resize",on); on();
  })();

  // SERVICIO 360: el sello central (360-1) siempre visible; los anillos aparecen
  // hacia afuera al scrollear (spin-in) y el mouse los hace girar (unos a un lado,
  // otros al otro); el sello no se mueve. Reemplaza al círculo enmascarado.
  (()=>{ const sec=document.querySelector("[data-360]"); if(!sec||!D)return;
    const ui=sec.querySelector("[data-360ui]"), stk=sec.querySelector(".s360stk"), stage=sec.querySelector("[data-stage360]");
    if(!stage)return;
    const smooth=(t)=>t*t*(3-2*t);
    const R=[...stage.querySelectorAll(".ring")].map(el=>({el,dir:+el.dataset.dir,rev:+el.dataset.rev,mag:+el.dataset.mag,s0:+(el.dataset.s0||0.62),s1:+(el.dataset.s1||1),rot:0,tRot:0,op:(+el.dataset.dir===0)?1:0,sc:1}));
    const on=()=>{ const r=sec.getBoundingClientRect(),tot=sec.offsetHeight-innerHeight;
      const p=clamp(-r.top/tot);
      // instancias limpias: el intro se va sobre AMARILLO, y recién después el fondo oscurece rápido (con solo el sello) -> sin texto fantasma sobre olivo
      const g2=ease(clamp((p-0.34)/0.08));                                 // bg amarillo -> oscuro, breve y después del intro
      stk.style.backgroundColor=`color-mix(in srgb, var(--amarillo), var(--oscuro) ${(g2*100).toFixed(1)}%)`;
      if(ui){ const uo=clamp(1-(p-0.26)/0.08); ui.style.opacity=uo; ui.style.pointerEvents=uo<0.05?"none":""; } // el intro se desvanece rápido y limpio, sobre amarillo
      const g=smooth(clamp((p-0.22)/0.22));                               // progreso del zoom del centro (empieza al desvanecerse el intro)
      R.forEach(o=>{ if(o.dir===0){ o.op=1; o.sc=lp(o.s0,o.s1,g); return; } // centro: zoom de tamaño inicial (s0) a su tamaño real (s1)
        o.op=smooth(clamp((p-o.rev)/0.06)); }); // anillos hacia afuera (aparecen rápido, en secuencia)
    };
    const onMove=(e)=>{ const nx=(e.clientX/innerWidth-0.5)*2; R.forEach(o=>{ o.tRot=nx*o.mag*o.dir; }); };
    addEventListener("mouseleave",()=>R.forEach(o=>o.tRot=0));
    const tick=()=>{ R.forEach(o=>{ o.rot=lp(o.rot,o.tRot,0.09);
        const spin=o.dir===0?0:(1-o.op)*o.dir*34;                        // entra girando desde ±34°
        o.el.style.opacity=o.op.toFixed(3); o.el.style.transform=`rotate(${(o.rot+spin).toFixed(2)}deg) scale(${o.sc.toFixed(3)})`; });
      requestAnimationFrame(tick); };
    addEventListener("scroll",on,{passive:true}); addEventListener("resize",on); on();
    addEventListener("mousemove",onMove); tick();
  })();

  // DISCIPLINAS: blob + placas siguen al cursor. Funciona también SCROLLEANDO sin mover el mouse:
  // el scroll recalcula qué disciplina está bajo el cursor (usando la última posición global conocida).
  (()=>{ const d=document.querySelector("[data-disc]"); if(!d||!D)return; const b=d.querySelector("[data-blob]");
    const flaps=[...d.querySelectorAll(".dflap")], lis=[...d.querySelectorAll("li")];
    flaps.forEach((f,i)=>f.style.zIndex=i);   // orden fijo: mayor índice, más arriba
    let tx=0,ty=0,bx=0,by=0,raf=0, mx=innerWidth/2, my=innerHeight/2, inside=false;   // mx/my: cursor global
    const tick=()=>{bx+=(tx-bx)*.18;by+=(ty-by)*.18;b.style.left=bx+"px";b.style.top=by+"px";raf=requestAnimationFrame(tick);};
    const update=()=>{ const r=d.getBoundingClientRect();
      const over = mx>=r.left && mx<=r.right && my>=r.top && my<=r.bottom;
      if(over){
        tx=mx-r.left; ty=my-r.top;                         // blob en la posición real del cursor
        if(!inside){ inside=true; bx=tx; by=ty; b.style.opacity="1"; if(!raf)tick(); }
        let j=-1; for(let i=0;i<lis.length;i++){ const lr=lis[i].getBoundingClientRect(); if(my>=lr.top && my<=lr.bottom){ j=i; break; } }
        flaps.forEach((f,i)=>f.classList.toggle("up", j>=0 && i<=j));   // suben 0..j según la disciplina bajo el cursor
      } else if(inside){ inside=false; b.style.opacity="0"; flaps.forEach(f=>f.classList.remove("up")); }
    };
    addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;update();},{passive:true});
    addEventListener("scroll",update,{passive:true});
  })();

  // TESTIMONIOS: transición de fondo (desde Disciplinas) + fichas con parallax
  (()=>{ const sec=document.querySelector("[data-test]"); if(!sec)return;
    const tbg=sec.querySelector("[data-tbg]"), cards=sec.querySelector("[data-tcards]"), stk=sec.querySelector(".tstk");
    const OSC="var(--oscuro)", AREN="var(--arena)", VIO="var(--violeta)";
    const om=(a,b,t)=>{t=clamp(t);return t<=0?a:t>=1?b:`color-mix(in oklab, ${b} ${(t*100).toFixed(2)}%, ${a})`;};   // funde en OKLAB; en reposo, token crudo (sin costura ni titileo)
    const on=()=>{ const r=sec.getBoundingClientRect();
      if(D){ const tot=sec.offsetHeight-innerHeight, p=clamp(-r.top/tot);
        const pAll=clamp((innerHeight-r.top)/(innerHeight+tot));
        let bg;
        if(p<0.85){ const e=clamp((p-0.03)/0.28); bg=om(OSC,AREN,e); }  // negro -> arena (arranca un segundito antes)
        else { const e=clamp((p-0.9)/0.1); bg=om(AREN,VIO,e); }        // arena -> violeta (recién al final, contenido ya salió)
        stk.style.backgroundColor=bg;
        cards.style.transform=`translateY(${lp(85,-115,pAll).toFixed(2)}%)`;     // fichas suben y salen
        tbg.style.transform=`translateY(${lp(8,-28,pAll).toFixed(2)}%)`;          // título/marcas: parallax suave
        tbg.style.opacity=clamp(1-(pAll-0.70)/0.22).toFixed(3);                   // título/línea/logos: quedan visibles durante el pase y se desvanecen al final (cuando las fichas terminan de pasar, no queda texto)
      } else { stk.style.backgroundColor=AREN; }
    };
    addEventListener("scroll",on,{passive:true}); addEventListener("resize",on); on();
  })();

  // HAGAMOS: fondo violeta (seamless con el final de Testimonios). El EFECTO del contenido
  // vive ahora en /scripts/hagamos.js (unificado en todas las páginas).
  (()=>{ const h=document.querySelector(".s-hag"); if(!h)return; h.style.backgroundColor="var(--violeta)"; })();

  // CTAs magnéticos (coordenadas de viewport; funcionan también en secciones pineadas).
  // Scroll-aware (igual que disciplinas): recalculan con la última posición global del
  // cursor tanto en mousemove como en scroll, así el botón no queda colgado en el medio
  // si scrolleás sin mover el mouse. Si el cursor sale del hot-zone, vuelve al centro.
  (()=>{ if(!D)return;
    let mx=innerWidth/2, my=innerHeight/2;                      // cursor global
    addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;},{passive:true});
    document.querySelectorAll("[data-follow]").forEach(el=>{
      const host=el.closest("[data-hot]"); if(!host)return;
      const base=el.dataset.base||"";
      let fx=0,fy=0,tx=0,ty=0,raf=0;
      const tick=()=>{fx+=(tx-fx)*.12;fy+=(ty-fy)*.12;el.style.transform=`${base} translate(${fx}px,${fy}px)`;raf=requestAnimationFrame(tick);};
      const update=()=>{ const hr=host.getBoundingClientRect();
        const over = mx>=hr.left && mx<=hr.right && my>=hr.top && my<=hr.bottom;
        if(over){ const r=el.getBoundingClientRect();              // centro real del botón = rect menos el translate actual
          tx=mx-(r.left+r.width/2-fx); ty=my-(r.top+r.height/2-fy); if(!raf)tick(); }
        else { tx=0; ty=0; } };                                   // fuera del hot-zone → vuelve al centro
      addEventListener("mousemove",update,{passive:true});
      addEventListener("scroll",update,{passive:true});
    });
  })();

  // Reveal on scroll (fade + line-by-line, sutil) — repetible
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{e.target.classList.toggle("in",e.isIntersecting);});},{threshold:.2});
  document.querySelectorAll(".rv,.rv-l,.rv-r").forEach(el=>io.observe(el));

  // Entrada mobile del sello 360: el zoom con scroll es desktop; en touch el sello
  // aparece con un fade+scale al entrar en viewport (una sola vez).
  if(!D){ const seal=document.querySelector(".stage360");
    if(seal){ const io2=new IntersectionObserver((es)=>{es.forEach(e=>{ if(e.isIntersecting){ seal.classList.add("in"); io2.unobserve(seal); } });},{threshold:.25}); io2.observe(seal); } }

  // Topbar: baja al hacer scroll hacia arriba (pasado el hero)
  (()=>{ const tb=document.getElementById("topbar"); if(!tb)return; let last=scrollY;
    addEventListener("scroll",()=>{ const y=scrollY;
      if(y<last-3 && y>innerHeight) tb.classList.add("show");    // scroll arriba -> aparece y SE QUEDA
      else if(y>last+3) tb.classList.remove("show");             // scroll abajo -> se mete
      if(y<innerHeight*0.6) tb.classList.remove("show");         // cerca del top, oculto
      last=y; },{passive:true});
  })();

  // Hora real de Buenos Aires (GMT-3)
  (()=>{ const h=document.getElementById("hora"); if(!h)return;
    const set=()=>{ try{ h.textContent=new Date().toLocaleTimeString("es-AR",{timeZone:"America/Argentina/Buenos_Aires",hour:"2-digit",minute:"2-digit",hour12:false}); }catch(e){} };
    set(); setInterval(set,20000);
  })();

  // Ícono de clima real de Buenos Aires (async, no bloquea la carga; si falla, no aparece)
  (()=>{ const el=document.getElementById("clima"); if(!el)return;
    const S='stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
    const ic={
      sun:`<svg viewBox="0 0 24 24" fill="none" ${S}><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>`,
      moon:`<svg viewBox="0 0 24 24" fill="none" ${S}><path d="M20.5 13.2A8.3 8.3 0 1 1 10.8 3.5a6.5 6.5 0 0 0 9.7 9.7z"/></svg>`,
      cloud:`<svg viewBox="0 0 24 24" fill="none" ${S}><path d="M7.2 18a4.2 4.2 0 0 1-.2-8.4A5.6 5.6 0 0 1 18 10.9 3.6 3.6 0 0 1 17.4 18H7.2z"/></svg>`,
      rain:`<svg viewBox="0 0 24 24" fill="none" ${S}><path d="M7.2 15a4.2 4.2 0 0 1-.2-8.4A5.6 5.6 0 0 1 18 7.9 3.6 3.6 0 0 1 17.4 15H7.2z"/><path d="M8.5 18.5 7.5 21M12.2 18.5 11.2 21M15.9 18.5 14.9 21"/></svg>`
    };
    fetch("https://api.open-meteo.com/v1/forecast?latitude=-34.61&longitude=-58.38&current=weather_code,is_day&timezone=auto")
      .then(r=>r.ok?r.json():Promise.reject()).then(d=>{ const c=d.current.weather_code, day=d.current.is_day;
        let k; if(c<=1) k=day?"sun":"moon"; else if(c<=48) k="cloud"; else k="rain";   // 0-1 despejado · 2-48 nubes/niebla · 51+ lluvia/nieve/tormenta
        el.innerHTML=ic[k]+" · ";   // ícono + separador; si no carga, queda "hora · coordenadas" limpio
      }).catch(()=>{});
  })();

  // Menú hamburguesa + header mobile
  (()=>{ const b=document.getElementById("burger"), m=document.getElementById("mmenu"), h=document.getElementById("mhead"); if(!b||!m)return;
    const close=()=>{ b.classList.remove("open"); m.classList.remove("open"); document.body.style.overflow=""; };
    b.addEventListener("click",()=>{ const o=!m.classList.contains("open"); b.classList.toggle("open",o); m.classList.toggle("open",o); document.body.style.overflow=o?"hidden":""; });
    m.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
    if(h){ let l=scrollY; addEventListener("scroll",()=>{ const y=scrollY;
      h.classList.toggle("scrolled", y>innerHeight*0.55);
      if(m.classList.contains("open")){ h.classList.remove("hide"); l=y; return; }
      if(y>l+4 && y>innerHeight*0.7) h.classList.add("hide");      // baja -> se oculta
      else if(y<l-4) h.classList.remove("hide");                  // sube -> reaparece
      l=y; },{passive:true}); }
  })();

  // Ir al top: viaje suave
  document.querySelectorAll(".s-foot .up, .mh-logo, .tb-logo").forEach(el=>{
    el.style.cursor="pointer";
    el.addEventListener("click",(e)=>{ e.preventDefault(); if(window.TROPICO&&window.TROPICO.lenis) window.TROPICO.lenis.scrollTo(0,{duration:1.1}); else window.scrollTo({top:0,behavior:"smooth"}); });
  });

  // Smooth scroll (Lenis) — solo desktop, mismo setup que el resto del sitio
  (()=>{ if(!D || matchMedia("(prefers-reduced-motion:reduce)").matches || !window.Lenis) return;
    const L=new Lenis({lerp:0.1,smoothWheel:true,wheelMultiplier:1});
    if(window.TROPICO) window.TROPICO.lenis=L;
    (function raf(t){ L.raf(t); requestAnimationFrame(raf); })();
  })();
  // MOBILE: sliders de testimonios arrastrables (mouse+touch) + auto (logos de a 3, fichas una a una)
  window.__mkSlider(document.querySelector(".s-test .logos"), {interval:3600, itemsSel:".lg-slide", byVW:true, loop:true, stripImgSize:true});
  window.__mkSlider(document.querySelector(".s-test .cards"), {interval:4200, loop:true});
