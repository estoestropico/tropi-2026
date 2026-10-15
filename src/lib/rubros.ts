import { SIN_360 } from './previa';

/**
 * Links a las páginas de servicio para los textos de las verticales. En el
 * build de previa, cuando 360 no se publica, el nombre va como texto plano.
 */
const enlace = (href: string, texto: string) =>
  `<a href="${href}" class="underline underline-offset-2">${texto}</a>`;

export const L_360 = SIN_360 ? 'Trópico 360' : enlace('/servicios/360', 'Trópico 360');
export const L_BRANDING = enlace('/servicios/branding', 'branding');
export const L_WEB = enlace('/servicios/web', 'web');
