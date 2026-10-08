/* TRÓPICO — contacto.js : validación client-side del formulario (UI, sin envío real). */
(function(){
  // ===== FORM: validación client-side (UI only, sin envío real) =====
  (()=>{ const form=document.getElementById("cform"); if(!form)return;
    const ok=document.getElementById("formOk");
    const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const PHONE=/^[+]?[\d\s().-]{6,}$/;
    const flds=[...form.querySelectorAll(".fld")];
    const setErr=(fld,msg)=>{ const e=fld.querySelector(".err"); if(msg){ if(e&&msg!==true)e.textContent=msg; fld.classList.add("invalid"); } else { fld.classList.remove("invalid"); } };
    const validate=(fld,live)=>{ const inp=fld.querySelector("input,textarea"); if(!inp)return true;
      const v=inp.value.trim();
      const req=fld.hasAttribute("data-required");
      const isEmail=fld.hasAttribute("data-email");
      const isPhone=inp.type==="tel";
      const e=fld.querySelector(".err");
      const emptyMsg=e&&e.dataset.empty, fmtMsg=e&&e.dataset.format;
      if(!v){ if(req && !live){ setErr(fld, emptyMsg||"Necesitamos saberlo!"); return false; } setErr(fld,false); return !req; }
      if(isEmail && !EMAIL.test(v)){ if(!live){ setErr(fld, fmtMsg||"Revisá el formato"); return false; } setErr(fld,false); return false; }
      if(isPhone && v && !PHONE.test(v)){ if(!live){ setErr(fld, fmtMsg||"Revisá el número"); return false; } setErr(fld,false); return false; }
      setErr(fld,false); return true;
    };
    flds.forEach(fld=>{ const inp=fld.querySelector("input,textarea"); if(!inp)return;
      inp.addEventListener("blur",()=>validate(fld,false));
      inp.addEventListener("input",()=>{ if(fld.classList.contains("invalid")) validate(fld,true); if(ok)ok.classList.remove("show"); });
    });
    form.addEventListener("submit",(ev)=>{ ev.preventDefault();   // sin endpoint: la integración (envío/CRM) la resuelve el usuario
      let allOK=true; let first=null;
      flds.forEach(fld=>{ const inp=fld.querySelector("input,textarea"); if(!inp)return;
        if(!validate(fld,false)){ allOK=false; if(!first)first=inp; } });
      if(!allOK){ if(first)first.focus(); if(ok)ok.classList.remove("show"); return; }
      if(ok)ok.classList.add("show");
      // form.reset(); // (opcional) limpiar tras "enviar"
    });
  })();

})();
