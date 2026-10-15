// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/* `npm run build` arma el sitio público, en https://www.tropico.ar. El
   dominio con www es el canónico: el servidor tiene que redirigir a él, con
   301, tanto el dominio sin www como cualquier pedido por http.

   `npm run build:previa` arma la copia para el equipo en 2026.tropico.ar:
   mismo código, otro dominio en los canónicos y el og:url, noindex en todas
   las páginas y sin los códigos de seguimiento, para que esa copia no compita
   con el sitio público ni le ensucie las métricas. Lo único que cambia es la
   variable PREVIA; no hay una segunda rama del sitio que mantener. */
const PREVIA = process.env.PREVIA === '1';
/* Con SIN_360=1 la página de Trópico 360 tampoco entra en el sitemap. El
   archivo de la página se borra después del build, en el script de npm. */
const SIN_360 = process.env.SIN_360 === '1';

export default defineConfig({
  site: PREVIA ? 'https://2026.tropico.ar' : 'https://www.tropico.ar',
  integrations: [
    sitemap({
      /* `muchas-gracias` es el destino del formulario: se llega sólo después
         de enviar, así que no entra en el sitemap. El 404 lo excluye la
         integración por su cuenta. */
      filter: (pagina) =>
        !pagina.includes('/muchas-gracias') &&
        !(SIN_360 && pagina.includes('/servicios/360')),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      /* El proyecto vive adentro de una carpeta que la app de escritorio
         observa y sincroniza, y las escrituras que entran por ahí no siempre
         disparan un evento de FSEvents en macOS. El watcher de Vite no se
         entera, el archivo en disco ya está nuevo y el dev server sigue
         sirviendo el anterior. Con `usePolling` no depende de los eventos del
         sistema: revisa los archivos cada 250 ms. Sólo afecta a `dev`. */
      watch: {
        usePolling: true,
        interval: 250,
      },
    },
  },
  image: {
    responsiveStyles: true,
  },
});
