/**
 * Acordeón de preguntas frecuentes con apertura y cierre animados.
 *
 * El `<details>` nativo abre y cierra de golpe. Acá se intercepta el clic del
 * `<summary>` y se anima el alto de la respuesta: al abrir se marca `open` y
 * la respuesta crece desde cero; al cerrar se achica y recién al terminar se
 * saca `open`. Abrir una cierra las demás del mismo grupo, también animadas.
 *
 * El atributo `name` de los `<details>` hace la exclusión en HTML sin JS,
 * pero cierra las otras al instante; por eso, con JS, se quita y la
 * exclusión la maneja este script. Sin JS el acordeón sigue funcionando.
 */
interface Opciones {
  duracion?: number;
  /* Curva de la apertura y el cierre. El default es parejo en los dos
     extremos; los bloques altos usan uno que arranca antes, porque con el
     parejo los primeros cuadros casi no mueven el alto y se lee trabado. */
  curva?: string;
  /* Desde dónde arranca el fundido del contenido al abrir. En un bloque
     alto, arrancar en cero deja la caja vacía durante el primer tercio. */
  opacidadDesde?: number;
}

export function iniciarAcordeon(selector = 'details.pregunta', opciones: Opciones = {}) {
  const items = [...document.querySelectorAll<HTMLDetailsElement>(selector)];
  if (!items.length) return;

  const {
    duracion = 380,
    curva = 'cubic-bezier(0.4, 0, 0.2, 1)',
    opacidadDesde = 0,
  } = opciones;

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animaciones = new WeakMap<HTMLDetailsElement, Animation>();

  const respuestaDe = (d: HTMLDetailsElement) =>
    d.querySelector<HTMLElement>(':scope > :not(summary)');

  /* Estado buscado de cada ítem. Mientras cierra, `open` sigue en true hasta
     que termina la animación; por eso el estado se lleva aparte. */
  const estaAbierto = (d: HTMLDetailsElement) =>
    d.dataset.estado ? d.dataset.estado === 'abierto' : d.open;

  const animar = (d: HTMLDetailsElement, abrir: boolean) => {
    d.dataset.estado = abrir ? 'abierto' : 'cerrado';
    const cuerpo = respuestaDe(d);
    if (!cuerpo || quieto) {
      d.open = abrir;
      return;
    }
    animaciones.get(d)?.cancel();

    /* El alto de partida es el que tiene ahora, así una animación cortada a
       mitad de camino sigue desde donde quedó. */
    const desde = d.open ? cuerpo.getBoundingClientRect().height : 0;
    if (abrir) d.open = true;
    const hasta = abrir ? cuerpo.scrollHeight : 0;

    cuerpo.style.overflow = 'hidden';
    const anim = cuerpo.animate(
      [
        { height: `${desde}px`, opacity: abrir ? opacidadDesde : 1 },
        { height: `${hasta}px`, opacity: abrir ? 1 : 0 },
      ],
      { duration: duracion, easing: curva }
    );
    animaciones.set(d, anim);
    anim.onfinish = () => {
      if (!abrir) d.open = false;
      cuerpo.style.overflow = '';
      animaciones.delete(d);
    };
  };

  items.forEach((d) => {
    d.removeAttribute('name');
    const resumen = d.querySelector('summary');
    resumen?.addEventListener('click', (e) => {
      e.preventDefault();
      const vaAbrir = !estaAbierto(d);
      animar(d, vaAbrir);
      if (vaAbrir) items.forEach((otra) => otra !== d && estaAbierto(otra) && animar(otra, false));
    });
  });
}
