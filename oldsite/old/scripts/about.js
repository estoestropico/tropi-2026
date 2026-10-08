/* TRÓPICO — about.js : script autocontenido de About (verbatim, con hero estandarizado al de servicios). */
  const D = window.matchMedia("(min-width:1025px)").matches;   // alineado al CSS mobile (max-width:760)
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v)=>Math.min(1,Math.max(0,v));
  const ease = (t)=>1-Math.pow(1-t,3);
  const lp = (a,b,t)=>a+(b-a)*t;
  const P3=a=>`color(display-p3 ${(a[0]/255).toFixed(4)} ${(a[1]/255).toFixed(4)} ${(a[2]/255).toFixed(4)})`;
  const UPDATES = [];          // todo el scroll-linked corre desde un único handler de scroll
  let lenis = null;

  // El preloader ahora vive en Nav.astro (inline, compartido). Ya no va acá.

  // Efecto escritura: texto que se completa palabra por palabra al scrollear
  (()=>{ const blocks=[...document.querySelectorAll("[data-paint]")]; if(!blocks.length)return;
    blocks.forEach(b=>{ const words=b.textContent.trim().split(/\s+/); b.innerHTML=words.map(w=>`<span class="wd">${w}</span>`).join(" "); });
    if(REDUCE){ blocks.forEach(b=>b.querySelectorAll(".wd").forEach(w=>w.classList.add("on"))); return; }
    UPDATES.push(()=>blocks.forEach(b=>{ const ws=[...b.querySelectorAll(".wd")],r=b.getBoundingClientRect();
      const p=clamp((innerHeight*0.82-r.top)/(innerHeight*0.42)); const n=Math.round(p*ws.length);
      ws.forEach((w,k)=>w.classList.toggle("on",k<n)); }));
  })();

  // ===== EQUIPO: render de fichas =====
  (()=>{ const g=document.getElementById("teamGrid"); if(!g)return;
    const FOTO="";  // foto pendiente (placeholder)
    const ig='<svg viewBox="0 0 24 24" fill="none"><rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" stroke="#fff" stroke-width="1.8"/><circle cx="17.5" cy="6.6" r="1.25" fill="#fff"/></svg>';
    const li='<svg viewBox="0 0 24 24" fill="#fff"><path d="M4.98 3.5a2 2 0 11-.02 4 2 2 0 01.02-4zM3.2 8.98h3.6V21H3.2zM9 8.98h3.45v1.64h.05c.5-.92 1.74-1.9 3.6-1.9 3.85 0 4.56 2.4 4.56 5.6V21h-3.6v-4.96c0-1.18-.02-2.7-1.7-2.7-1.7 0-1.96 1.28-1.96 2.62V21H9z"/></svg>';
    // Redes: sólo Fer las tiene visibles. Al resto se les deja el markup pero display:none (se activan luego).
    const team=[
      {n:"Fer",r:"Director",li:"https://www.linkedin.com/in/fernandoacenso/",ig:"https://instagram.com/feracenso"},
      {n:"Fran",r:"Ejecutivo Comercial"},
      {n:"Anti",r:"Directora Creativa"},
      {n:"Ainhoa",r:"Ejecutiva de Cuentas"},
      {n:"Carme",r:"Diseñadora"},
      {n:"Martin",r:"Full Stack Developer"},
      {n:"Lucho",r:"Trafficker"},
      {n:"Danu",r:"Administrativa"},
      {n:"Caro",r:"Administrativa"},
      {n:"Juli",r:"Diseño Audiovisual"},
      {n:"Luna",r:"Editora"}
    ];
    const key=s=>s.trim().toLowerCase();   // "Fer" -> "fer"
    const cards=team.map((m,idx)=>{ const k=key(m.n), hasSoc=!!(m.li||m.ig);
      return `<article class="tcard rv d${(idx%3)+1}">
      <span class="ph ph-a" style="background-image:url('/img/equipo/${k}_1.webp')"></span>
      <div class="ic"${hasSoc?"":' style="display:none"'}>
        <a href="${m.ig||'#'}" target="_blank" rel="noopener" aria-label="Instagram"${m.ig?"":' style="display:none"'}>${ig}</a>
        <a href="${m.li||'#'}" target="_blank" rel="noopener" aria-label="LinkedIn"${m.li?"":' style="display:none"'}>${li}</a>
      </div>
      <div class="meta"><p class="nm">${m.n}</p><p class="rl">${m.r}</p></div>
    </article>`; }).join("");
    const join=`<a class="tcard tjoin rv d${(team.length%3)+1}" href="/contacto"><span class="tjoin-plus">+</span><span class="tjoin-t">Sumate al equipo</span></a>`;
    g.innerHTML=cards+join;
  })();

  // ===== HERO: frase rotativa con mascara de color (estandarizado, igual a servicios) =====
  (()=>{ const v=document.querySelector("[data-rot]"); if(!v)return;
    const phs=[...v.querySelectorAll(".ph")]; if(!phs.length)return;
    const place=(el,y)=>el.style.transform=`translateY(${y})`;
    const instant=(el,fn)=>{ el.style.transition="none"; fn(); void el.offsetWidth; el.style.transition=""; };
    let i=0, gen=0, iv=null, t0=null;
    const initP=()=>{ i=0; phs.forEach((p,k)=>instant(p,()=>{ p.style.setProperty("--vfill","0"); place(p,k===0?"0%":"100%"); })); };
    const cycle=(g)=>{ if(g!==gen)return; const cur=phs[i], nxt=phs[(i+1)%phs.length];
      cur.style.setProperty("--vfill","1");
      setTimeout(()=>{ if(g!==gen)return; place(cur,"-100%");
        instant(nxt,()=>{ nxt.style.setProperty("--vfill","0"); place(nxt,"100%"); });
        setTimeout(()=>{ if(g===gen) place(nxt,"0%"); },30);
        i=(i+1)%phs.length;
      },1750);
    };
    const start=()=>{ gen++; const g=gen; clearInterval(iv); clearTimeout(t0); initP();
      if(REDUCE){ phs[0].style.setProperty("--vfill","1"); return; }
      t0=setTimeout(()=>{ if(g!==gen)return; cycle(g); iv=setInterval(()=>cycle(g),2700); },900); };
    start();
    addEventListener("pageshow",()=>{ start(); });
  })();
  // ===== EQUIPO: la plaquita de Meet queda fija abajo-centro mientras dura la sección, después se suelta =====
  (()=>{ const sec=document.querySelector(".s-team"), meet=sec&&sec.querySelector(".meet"); if(!sec||!meet||!D)return;
    const GAP=45;
    const on=()=>{ const r=sec.getBoundingClientRect(), barH=meet.offsetHeight||80;
      const fixedTop=innerHeight-GAP-barH;
      if(r.top>fixedTop){                         // entrando: pegada al tope de la sección (sube con el scroll)
        meet.style.position="absolute"; meet.style.bottom="auto"; meet.style.top="0px";
      } else if(r.bottom>innerHeight-GAP){         // clavada al viewport: position:fixed real, sin temblequeo
        meet.style.position="fixed"; meet.style.top="auto"; meet.style.bottom=GAP+"px";
      } else {                                     // estacionada al fondo de la sección: se va con el scroll
        meet.style.position="absolute"; meet.style.bottom="auto"; meet.style.top=(sec.offsetHeight-barH)+"px";
      } };
    const img=meet.querySelector("img"); if(img&&!img.complete) img.addEventListener("load",on);
    UPDATES.push(on);
  })();

  // ===== HISTORIA: contador en vivo desde la fundación =====
  (()=>{ const box=document.getElementById("counter"); if(!box)return;
    const FUND=new Date(2013,2,25,9,0,0); // <- fecha de fundación (editable): 25 de marzo de 2013, 9hs
    const set=(u,v)=>{const el=box.querySelector(`[data-u="${u}"]`);if(el)el.textContent=String(v).padStart(2,"0");};
    const tick=()=>{ const now=new Date();
      let y=now.getFullYear()-FUND.getFullYear(), mo=now.getMonth()-FUND.getMonth(), d=now.getDate()-FUND.getDate(),
          h=now.getHours()-FUND.getHours(), mi=now.getMinutes()-FUND.getMinutes(), s=now.getSeconds()-FUND.getSeconds();
      if(s<0){s+=60;mi--;} if(mi<0){mi+=60;h--;} if(h<0){h+=24;d--;}
      if(d<0){ const pm=new Date(now.getFullYear(),now.getMonth(),0).getDate(); d+=pm; mo--; }
      if(mo<0){mo+=12;y--;}
      set("anios",y);set("meses",mo);set("dias",d);set("horas",h);set("min",mi);set("seg",s);
    };
    tick(); setInterval(tick,1000);
  })();

  // ===== HISTORIA: la etiqueta va cambiando de texto a medida que scrolleás por la sección =====
  // El bloque queda FIJO (pineado con el contador) y recorre 4 frases según el avance del scroll.
  // Cifras editables acá abajo (PH).
  (()=>{
    if(REDUCE) return;
    const sec=document.querySelector(".s-hist"), hace=document.querySelector(".s-hist .hace");
    if(!sec||!hace) return;
    const PH=["haciendo lo que nos gusta","y +120 marcas nuevas","y +75 sitios web","y +70 clientes","y +320 proyectos","y +12 industrias","y +180 campañas"];
    let band=-1;
    const on=()=>{
      const r=sec.getBoundingClientRect(), range=sec.offsetHeight-innerHeight;
      const p=range>0?clamp(-r.top/range):0;                 // 0→1 mientras el contador está pineado
      const vis=clamp(p/0.42);                               // todas las frases entran ANTES de que Valores tape la pastilla (~p 0.5); arranca a cambiar temprano
      const N=PH.length, b=Math.max(0,Math.min(N-1,Math.floor(vis*N - 1e-6)));
      if(b!==band){ band=b; hace.textContent=PH[b]; }
    };
    addEventListener("scroll",on,{passive:true}); addEventListener("resize",on); on();
  })();

  // ===== VALORES: la frase más cercana al centro se ilumina =====
  (()=>{ const lines=[...document.querySelectorAll(".s-val .vln")]; if(!lines.length)return;
    const on=()=>{ const vc=innerHeight*0.5; let best=0,bd=1e9;
      lines.forEach((l,i)=>{const r=l.getBoundingClientRect();const c=r.top+r.height/2;const dd=Math.abs(c-vc);if(dd<bd){bd=dd;best=i;}});
      lines.forEach((l,i)=>l.classList.toggle("on",i===best)); };
    UPDATES.push(on);
  })();

  // ===== MAPA: amarillo→celeste, aparecen los dots, y el dot de BA se expande a negro =====
  (()=>{ const sec=document.querySelector("[data-mapa]"); if(!sec)return;
    const stk=sec.querySelector(".mstk"), blk=sec.querySelector("[data-mblack]");
    const txt=sec.querySelector(".txt"), map=sec.querySelector("#mapHost"), baTag=sec.querySelector(".ba");
    const vwrap=document.querySelector(".s-val .vwrap");   // contenido anterior (Valores) — se desvanece al acercarse el mapa
    let baEl=null;
    (()=>{ const s=map.querySelector("svg"); if(!s)return;                              // SVG inline → anda en local sin servidor
      const bx=+(s.dataset.baX||330), by=+(s.dataset.baY||613);
      const dots=[...s.querySelectorAll(".dot")]; let maxd=1;
      dots.forEach(d=>{ const dx=d.cx.baseVal.value-bx, dy=d.cy.baseVal.value-by; d.__d=Math.hypot(dx,dy); if(d.__d>maxd)maxd=d.__d; });
      dots.forEach(d=>{ d.style.transitionDelay = D ? Math.round((Math.random()*0.8 + (d.__d/maxd)*0.2)*500)+"ms" : "0ms"; });  // desktop: random desde BA · mobile: simple (juntos)
      const ping=document.createElementNS("http://www.w3.org/2000/svg","circle");      // anillo que titila en BA
      ping.setAttribute("class","ping"); ping.setAttribute("cx",bx); ping.setAttribute("cy",by); s.appendChild(ping);
      baEl=s.querySelector("#ba");
    })();
    const seg=(p,a,b)=>ease(clamp((p-a)/(b-a)));
    const on=()=>{ const r=sec.getBoundingClientRect(), tot=sec.offsetHeight-innerHeight, p=clamp(-r.top/tot);
      // desvanece los Valores mientras el mapa entra (antes del pin), así el amarillo llega "vacío" y la transición arranca antes
      if(D && vwrap){ const pre=clamp((innerHeight-r.top)/innerHeight); vwrap.style.opacity=(1-clamp((pre-0.20)/0.5)).toFixed(3); }
      const g1=clamp(p/0.045);                               // 1) amarillo→celeste MÁS corto (antes 0.08)
      stk.style.background=`color-mix(in oklab, var(--celeste) ${(g1*100).toFixed(2)}%, var(--amarillo))`;
      map.style.opacity = seg(p,0.04,0.11);                  // 2) el mapa aparece apenas antes…
      map.classList.toggle("dots-in", p>0.08);               //    …y los dots brotan desde Buenos Aires
      txt.style.opacity = seg(p,0.11,0.19);
      baTag.style.opacity = seg(p,0.22,0.31);
      const g3=seg(p,0.58,0.94);                             // 3) Buenos Aires se agranda a negro más cerca del final (menos cola de negro fijo)
      let ox=38, oy=79;
      if(baEl){ const b=baEl.getBoundingClientRect(); ox=(b.left+b.width/2)/innerWidth*100; oy=(b.top+b.height/2)/innerHeight*100; }
      const cp=`circle(${(g3*150).toFixed(1)}% at ${ox.toFixed(1)}% ${oy.toFixed(1)}%)`;
      blk.style.clipPath=cp; blk.style.webkitClipPath=cp;
    };
    UPDATES.push(on);
  })();

  // ===== TESTIMONIOS: fondo + fichas con parallax (del home) =====
  (()=>{ const sec=document.querySelector("[data-test]"); if(!sec)return;
    const tbg=sec.querySelector("[data-tbg]"), cards=sec.querySelector("[data-tcards]"), stk=sec.querySelector(".tstk");
    const OSC="var(--oscuro)", AREN="var(--arena)", VIO="var(--violeta)";
    const om=(a,b,t)=>{t=clamp(t);return t<=0?a:t>=1?b:`color-mix(in oklab, ${b} ${(t*100).toFixed(2)}%, ${a})`;};   // funde en OKLAB; en reposo, token crudo (sin costura ni titileo)
    const on=()=>{ const r=sec.getBoundingClientRect();
      if(D){ const tot=sec.offsetHeight-innerHeight, p=clamp(-r.top/tot);
        const pAll=clamp((innerHeight-r.top)/(innerHeight+tot));
        let bg;
        if(p<0.85){ const e=clamp((p-0.03)/0.28); bg=om(OSC,AREN,e); }  // negro -> arena (arranca un segundito antes)
        else { const e=clamp((p-0.9)/0.1); bg=om(AREN,VIO,e); }
        stk.style.background=bg;
        cards.style.transform=`translateY(${lp(85,-115,pAll).toFixed(2)}%)`;
        tbg.style.transform=`translateY(${lp(8,-28,pAll).toFixed(2)}%)`;
        tbg.style.opacity=clamp(1-(pAll-0.70)/0.22).toFixed(3);                   // título/línea/logos visibles durante el pase, se desvanecen al final
      } else { stk.style.background=AREN; }
    };
    UPDATES.push(on);
  })();

  // ===== HAGAMOS: fondo violeta (seamless). El EFECTO del contenido vive ahora en
  //        /scripts/hagamos.js (unificado en todas las páginas). =====
  (()=>{ const h=document.querySelector(".s-hag"); if(!h)return; h.style.background="var(--violeta)"; })();

  // ===== CTAs magnéticos =====
  (()=>{ if(!D)return; document.querySelectorAll("[data-follow]").forEach(el=>{
    const host=el.closest("[data-hot]"); if(!host)return;
    const base=el.dataset.base||"";
    let fx=0,fy=0,tx=0,ty=0,raf=0,home=null;
    const measure=()=>{el.style.transform=base;const r=el.getBoundingClientRect();home={x:r.left+r.width/2,y:r.top+r.height/2};};
    const tick=()=>{fx+=(tx-fx)*.12;fy+=(ty-fy)*.12;el.style.transform=`${base} translate(${fx}px,${fy}px)`;raf=requestAnimationFrame(tick);};
    host.addEventListener("mouseenter",()=>{measure();if(!raf)tick();});
    host.addEventListener("mousemove",e=>{if(!home)measure();tx=e.clientX-home.x;ty=e.clientY-home.y;});
    host.addEventListener("mouseleave",()=>{tx=0;ty=0;});
    addEventListener("scroll",()=>{home=null;},{passive:true});
  });})();

  // ===== Reveal on scroll (repetible) =====
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{e.target.classList.toggle("in",e.isIntersecting);});},{threshold:.18});
  const obs=()=>document.querySelectorAll(".rv,.rvo,.rv-l,.rv-r").forEach(el=>io.observe(el));
  obs(); setTimeout(obs,0); // re-observa fichas del equipo (render dinámico)

  // ===== Topbar: baja al hacer scroll hacia arriba =====
  (()=>{ const tb=document.getElementById("topbar"); if(!tb)return; let last=scrollY;
    UPDATES.push(()=>{ const y=scrollY;
      if(y<last-3 && y>innerHeight) tb.classList.add("show");
      else if(y>last+3) tb.classList.remove("show");
      if(y<innerHeight*0.6) tb.classList.remove("show");
      last=y; });
  })();

  // ===== Menú hamburguesa + header mobile =====
  (()=>{ const b=document.getElementById("burger"), m=document.getElementById("mmenu"), h=document.getElementById("mhead"); if(!b||!m)return;
    const close=()=>{ b.classList.remove("open"); m.classList.remove("open"); document.body.style.overflow=""; };
    b.addEventListener("click",()=>{ const o=!m.classList.contains("open"); b.classList.toggle("open",o); m.classList.toggle("open",o); document.body.style.overflow=o?"hidden":""; });
    m.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
    if(h){ let l=scrollY; UPDATES.push(()=>{ const y=scrollY;
      h.classList.toggle("scrolled", y>innerHeight*0.55);
      if(m.classList.contains("open")){ h.classList.remove("hide"); l=y; return; }
      if(y>l+4 && y>innerHeight*0.7) h.classList.add("hide");
      else if(y<l-4) h.classList.remove("hide");
      l=y; }); }
  })();

  // ===== Ir al top =====
  document.querySelectorAll(".s-foot .up").forEach(el=>{
    el.style.cursor="pointer";
    el.addEventListener("click",(e)=>{ e.preventDefault(); if(lenis) lenis.scrollTo(0,{duration:1.1}); else window.scrollTo({top:0,behavior:"smooth"}); });
  });

  // ===== Testimonios mobile: el slider avanza solo cada tanto =====
  (()=>{ if(D)return; const cards=document.querySelector("[data-tcards]"); if(!cards)return;
    let i=0; setInterval(()=>{ const n=cards.children.length; if(!n)return; i=(i+1)%n;
      cards.scrollTo({left:Math.round(i*cards.scrollWidth/n),behavior:"smooth"}); },4500);
  })();

  // ===== Un handler de scroll para TODO el scroll-linked (nativo, pasivo, rAF-throttle) =====
  let ticking=false;
  const runUpdates=()=>{ for(let i=0;i<UPDATES.length;i++){ try{ UPDATES[i](); }catch(e){} } ticking=false; };
  addEventListener("scroll",()=>{ if(!ticking){ ticking=true; requestAnimationFrame(runUpdates); } },{passive:true});
  addEventListener("resize",runUpdates);
  runUpdates();

  // ===== Smooth scroll (Lenis) — solo desktop, sin bloquear nada (el preloader ya no toca el scroll) =====
  if(!REDUCE && D && window.Lenis){ lenis=new Lenis({lerp:0.1,smoothWheel:true,wheelMultiplier:1});
    (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(); }
  // MOBILE: sliders de testimonios arrastrables (mouse+touch) + auto, igual que home
  (function(){ if(window.matchMedia("(min-width:1025px)").matches) return;
    function mk(el,o){ o=o||{}; if(!el) return;
      var down=false,sx=0,sl=0,moved=false,paused=false,rt=null;
      var pause=function(){paused=true;clearTimeout(rt);};
      var resume=function(){clearTimeout(rt);rt=setTimeout(function(){paused=false;},2600);};
      el.style.cursor="grab";
      el.addEventListener("mousedown",function(e){down=true;moved=false;sx=e.clientX;sl=el.scrollLeft;el.style.cursor="grabbing";pause();e.preventDefault();});
      window.addEventListener("mousemove",function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>3)moved=true;el.scrollLeft=sl-dx;});
      window.addEventListener("mouseup",function(){if(!down)return;down=false;el.style.cursor="grab";resume();});
      el.addEventListener("click",function(e){if(moved){e.preventDefault();e.stopPropagation();}},true);
      el.addEventListener("touchstart",pause,{passive:true}); el.addEventListener("touchend",resume,{passive:true});
      var items=[].slice.call(el.children);
      if(o.stripImgSize) [].slice.call(el.querySelectorAll("img")).forEach(function(im){ im.style.width=""; im.style.height=""; });
      var n=items.length;
      var step=function(){ return (n>1 ? (items[1].offsetLeft-items[0].offsetLeft) : 0) || el.clientWidth; };
      // LOOP infinito: clona un set antes y otro después; teletransporta ±OW en la zona de clones.
      if(o.loop && n>1){
        var parent=items[0].parentNode;
        var clone=function(){ return items.map(function(k){var c=k.cloneNode(true);c.dataset.clone="1";c.setAttribute("aria-hidden","true");return c;}); };
        var pre=clone(); var frag=document.createDocumentFragment(); pre.forEach(function(c){frag.appendChild(c);}); parent.insertBefore(frag,items[0]);
        clone().forEach(function(c){parent.appendChild(c);});
        // OW en vivo (no cacheado): evita medir con la sección aún sin ancho
        var recenter=function(){ el.scrollLeft=n*step(); };
        requestAnimationFrame(function(){requestAnimationFrame(recenter);});
        // teletransporte por rAF (no depende de eventos scroll, que Lenis intercepta)
        var last=-1, still=0;
        var tick=function(){ if(!down){ var x=Math.round(el.scrollLeft);
          if(x===last){ still++; if(still>2){ var s=step(); if(s){ var OW=n*s; var idx=Math.round(x/s);
            if(idx<n) el.scrollLeft=x+OW; else if(idx>=2*n) el.scrollLeft=x-OW; } } } else still=0;
          last=Math.round(el.scrollLeft); } requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
      if(o.interval&&items.length>1){
        if(o.loop){ setInterval(function(){ if(paused)return; el.scrollBy({left:step(),behavior:"smooth"}); },o.interval); }
        else { var i=0; setInterval(function(){ if(paused)return; i++; if(i>=items.length) i=0;
          el.scrollTo({left:o.byVW?i*el.clientWidth:items[i].offsetLeft,behavior:"smooth"}); },o.interval); }
      }
    }
    mk(document.querySelector(".s-test .logos"),{interval:3600,byVW:true,loop:true,stripImgSize:true});
    mk(document.querySelector(".s-test .cards"),{interval:4200,loop:true});
  })();
