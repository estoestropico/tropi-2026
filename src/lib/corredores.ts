/**
 * Corredores de imágenes de las páginas de servicio y de las verticales.
 * Toman los archivos de cada carpeta en el orden de su número, así sumar una
 * pieza es sólo agregar el archivo.
 */

/* Ordena por el número del nombre y no por el texto, para que `deporte-10`
   caiga después de `deporte-9` y no entre el 1 y el 2. Dos reglas más para
   sumar piezas sin renumerar las que ya están:

   · los ceros a la izquierda arman una tanda que va entera adelante, así
     `deporte-01` y `deporte-02` abren la tira y recién después viene
     `deporte-1`. Con dos ceros la tanda va todavía más adelante;
   · una letra al final del número intercala ahí mismo: `deporte-4b` va
     después de `deporte-4` y antes de `deporte-5`. */
const clave = (ruta: string): [number, number, string] => {
  /* El guion es opcional: la carpeta de 360 nombra los archivos `01.png`. */
  const m = ruta.match(/[/-](\d+)([a-z]*)\.\w+$/i);
  const digitos = m?.[1] ?? '';
  const ceros = digitos.length - digitos.replace(/^0+/, '').length;
  return [-ceros, Number(digitos || 0), (m?.[2] ?? '').toLowerCase()];
};

const armar = (
  archivos: Record<string, { default: ImageMetadata }>,
  alts: string[],
  generico: string
) =>
  Object.keys(archivos)
    .sort((a, b) => {
      const [ca, na, sa] = clave(a);
      const [cb, nb, sb] = clave(b);
      return ca - cb || na - nb || sa.localeCompare(sb);
    })
    .map((ruta, i) => ({ src: archivos[ruta].default, alt: alts[i] ?? generico }));

/* ── Branding ─────────────────────────────────────────────────────────── */
const archivosBranding = import.meta.glob<{ default: ImageMetadata }>('../assets/branding/corredor-*.png', {
  eager: true,
});
const ALTS_BRANDING = [
  'Sosfuerza: indumentaria con la marca',
  'Darkhorse: tarjetas personales',
  'Chéile: packaging de café',
  'Mara: hechos para este suelo',
  'Chéile: ilustración de marca',
  'Ritual: packaging para delivery',
  'QS: sistema de sellos',
  'QS: cartel luminoso',
  'Ragucci: etiqueta de indumentaria',
  'Isotipo sobre fondo oscuro',
  'Sauro: packaging de alimentos',
  'Sauro: pieza de lanzamiento',
  "Mandy's Kids: marca",
  "Mandy's Kids: etiqueta de indumentaria",
];
export const CORREDOR_BRANDING = armar(archivosBranding, ALTS_BRANDING, 'Proyecto de branding de Trópico');

/* ── Web ─────────────────────────────────────────────────────────────── */
const archivosWeb = import.meta.glob<{ default: ImageMetadata }>('../assets/web/web-*.png', {
  eager: true,
});
const ALTS_WEB = [
  'Galarraga: plataforma en el celular',
  'TAO Academy: plataforma de e-learning',
  'FXM: sitio con cuenta regresiva',
  'Café Paraná: tienda online',
  'Washington School: sitio institucional',
  'Parisi: sitio institucional',
  'TAO: sitio y cotizador de proyectos SIP',
];
export const CORREDOR_WEB = armar(archivosWeb, ALTS_WEB, 'Proyecto de web de Trópico');

/* ── Trópico 360 ──────────────────────────────────────────────────────
   Los archivos de esta carpeta no llevan prefijo: `01.png` … `08.png`. */
const archivos360 = import.meta.glob<{ default: ImageMetadata }>('../assets/360/*.png', {
  eager: true,
});
const ALTS_360 = [
  'Galarraga: bandera en el remate',
  'Washington School: indumentaria deportiva',
  'Parisi: folleto de pasturas',
  'Farmaexpert: frente de la farmacia',
  'EV Logística: gráfica vehicular',
  'TAO Academy: cuaderno del curso',
  'Rosmar: cartelería de la tienda online',
  'TAO Point: señalética y folletería',
];
export const CORREDOR_360 = armar(archivos360, ALTS_360, 'Trabajo mensual de Trópico 360');

/* ── Agro ───────────────────────────────────────────────────────────────
   Piezas de 1080×1440. Como en 360, los archivos no llevan prefijo:
   `01.png` … `09.png`. */
const archivosAgro = import.meta.glob<{ default: ImageMetadata }>('../assets/agro/*.png', {
  eager: true,
});
const ALTS_AGRO = [
  'EV Logística: gráfica sobre el camión jaula',
  'Galarraga: app con las cotizaciones del día',
  'Galarraga: bandera en el corral del remate',
  'Galarraga: calendario de pared',
  'Parisi: chomba institucional',
  'Parisi: folleto de rollos y pasturas',
  'La Reforma: cartel en la ruta',
  'La Reforma: llavero por los 120 años',
  'La Rosalía: sitio de leche de exportación',
];
export const CORREDOR_AGRO = armar(archivosAgro, ALTS_AGRO, 'Proyecto para el agro de Trópico');

/* ── Deporte ─────────────────────────────────────────────────────────────
   Piezas de 1080×1440, la misma relación 3:4 que el corredor de branding.
   Los alts van en el orden de los archivos: 01, 02, 1, 2, 3, 4, 4b, 5 … 11. */
const archivosDeporte = import.meta.glob<{ default: ImageMetadata }>('../assets/deporte/deporte-*.png', {
  eager: true,
});
const ALTS_DEPORTE = [
  'FXM: camiseta de la marca',
  'FXM: bufanda Fulbo por el Mundo',
  'Sosfuerza: indumentaria con la marca',
  'Sosfuerza: sitio web',
  'Tiempo Extra: pecheras en la cancha',
  'Tiempo Extra: banner en el arco',
  'Sport Maniac: placas de producto',
  'Hidromantes: etiqueta de indumentaria',
  'Hidromantes: gorro de natación',
  'CEAF: escudo bordado en la camiseta',
  'CEAF: placa de Batalla de Arqueros',
  'Argentinos Juniors: pieza de campaña',
  'Argentinos Juniors: app oficial',
  'XTUFIT: placas para redes',
];
export const CORREDOR_DEPORTE = armar(archivosDeporte, ALTS_DEPORTE, 'Proyecto deportivo de Trópico');

/* ── Industria y construcción ────────────────────────────────────────────
   Piezas de 1080×1440. Como en 360 y agro, los archivos no llevan prefijo:
   `01.png` … `13.png`. */
const archivosIndustria = import.meta.glob<{ default: ImageMetadata }>('../assets/industria/*.png', {
  eager: true,
});
const ALTS_INDUSTRIA = [
  'Malva: papelería institucional',
  'Malva: sitio del desarrollo en el celular',
  'Folleto institucional de un desarrollo',
  'Collecta: marca',
  'Collecta: plataforma de desarrollos',
  'Motus: placas para redes',
  'Motus: papelería institucional',
  'Cáceres Fahey: indumentaria y elementos de obra',
  'Cáceres Fahey: cartel en la obra',
  'TAO Point: gráfica del punto de venta',
  'TAO: sitio con cotizador de proyectos',
  'TAO: material institucional impreso',
  'TAO Academy: plataforma de e-learning',
];
export const CORREDOR_INDUSTRIA = armar(
  archivosIndustria,
  ALTS_INDUSTRIA,
  'Proyecto de industria y construcción de Trópico'
);

/* ── Consumo masivo ──────────────────────────────────────────────────────
   Piezas de 1080×1440, sin prefijo: `01.png` … `11.png`. */
const archivosConsumo = import.meta.glob<{ default: ImageMetadata }>('../assets/consumo/*.png', {
  eager: true,
});
const ALTS_CONSUMO = [
  'Café Paraná: tienda online en el celular',
  'QS: cartel luminoso',
  'QS: sistema de sellos',
  'Cartel corpóreo en el frente del local',
  'Fornaro: placas de promociones',
  'Sauro: packaging de arvejas',
  'Sauro: línea de congelados',
  'Chéile: ilustración de marca',
  'Chéile: packaging de café',
  'Puff: tienda online',
  'Puff: producto en góndola',
];
export const CORREDOR_CONSUMO = armar(archivosConsumo, ALTS_CONSUMO, 'Proyecto de consumo masivo de Trópico');
