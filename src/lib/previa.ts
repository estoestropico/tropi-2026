/**
 * Interruptores del build.
 *
 * `SIN_360` saca la página de Trópico 360 de la publicación: no se genera, no
 * entra en el sitemap y no queda enlazada desde ningún lado. Es para la copia
 * de 2026.tropico.ar mientras esa página no esté cerrada. Cuando lo esté,
 * alcanza con usar `npm run build:previa` en vez de `build:previa:sin360`.
 */
export const SIN_360 = process.env.SIN_360 === '1';
