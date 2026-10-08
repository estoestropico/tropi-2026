// Envío del formulario de contacto con fetch. Sin JavaScript, el formulario
// se envía igual por POST a api/contacto.php y vuelve con ?enviado=1 o ?error=…
const form = document.querySelector('form.formulario');

if (form) {
  const estado = form.querySelector('.estado-form');
  const boton = form.querySelector('button[type="submit"]');
  const inicio = performance.now();

  const avisar = (texto, tipo = 'ok') => {
    estado.dataset.tipo = tipo;
    estado.textContent = texto;
  };

  const params = new URLSearchParams(location.search);
  if (params.has('enviado')) {
    avisar('¡Gracias! Recibimos tu consulta y te vamos a escribir por WhatsApp a la brevedad.');
  } else if (params.has('error')) {
    avisar('No pudimos enviar tu consulta. Revisá los datos y probá de nuevo.', 'error');
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('intentado');
      form.querySelector(':invalid')?.focus();
      return;
    }

    form.elements.t.value = ((performance.now() - inicio) / 1000).toFixed(1);
    boton.disabled = true;
    avisar('Enviando…');

    try {
      const respuesta = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const datos = await respuesta.json();

      if (datos.ok) {
        form.reset();
        form.classList.remove('intentado');
        avisar(datos.mensaje);
      } else {
        const detalle = Object.values(datos.errores ?? {}).join(' ');
        avisar(detalle || datos.mensaje, 'error');
      }
    } catch {
      avisar('No pudimos enviar tu consulta. Revisá tu conexión y probá de nuevo.', 'error');
    } finally {
      boton.disabled = false;
    }
  });
}
