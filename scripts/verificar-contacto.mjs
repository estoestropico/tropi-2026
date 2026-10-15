/* Chequeo de la integración del formulario con Prometheo.
 *
 * Corre al final de `npm run build` y `npm run build:previa`, sobre la
 * carpeta recién generada. Si falta algo de lo que necesita el envío —el PHP,
 * su protección, el formulario o alguno de sus campos—, sale con error y el
 * build se da por fallido: así una actualización de casos no puede publicar
 * un contacto roto sin que nadie se entere.
 *
 * Uso: node scripts/verificar-contacto.mjs <carpeta de salida>
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const salida = process.argv[2] ?? 'dist';
const errores = [];

const archivos = [
  'api/contacto.php',
  'api/lib/Contacto.php',
  'api/lib/Prometheo.php',
  // Bloquea el acceso directo a las clases desde el navegador.
  'api/lib/.htaccess',
  'contacto/index.html',
  'muchas-gracias/index.html',
];
for (const archivo of archivos) {
  if (!existsSync(join(salida, archivo))) errores.push(`falta ${archivo}`);
}

const contacto = join(salida, 'contacto/index.html');
if (existsSync(contacto)) {
  const html = readFileSync(contacto, 'utf8');
  const form = html.match(/<form\b[^>]*class="formulario[^"]*"[^>]*>[\s\S]*?<\/form>/)?.[0];

  if (!form) {
    errores.push('contacto: no está el <form class="formulario">');
  } else {
    const apertura = form.slice(0, form.indexOf('>') + 1);
    if (!/action="\/api\/contacto\.php"/.test(apertura)) errores.push('contacto: el form no envía a /api/contacto.php');
    if (!/method="post"/i.test(apertura)) errores.push('contacto: el form no usa method="post"');

    const campos = ['nombre', 'email', 'whatsapp', 'servicios[]', 'novedades', 'acepta_whatsapp', 'sitio_web', 't'];
    for (const campo of campos) {
      if (!form.includes(`name="${campo}"`)) errores.push(`contacto: falta el campo name="${campo}"`);
    }
    for (const campo of ['nombre', 'email', 'whatsapp']) {
      const input = form.match(new RegExp(`<input\\b[^>]*name="${campo.replace(/[[\]]/g, '\\$&')}"[^>]*>`))?.[0] ?? '';
      if (input && !/\brequired\b/.test(input)) errores.push(`contacto: el campo ${campo} tiene que ser obligatorio`);
    }
    if (!/<button\b[^>]*type="submit"/.test(form)) errores.push('contacto: falta el botón de envío (type="submit")');
    if (!form.includes('estado-form')) errores.push('contacto: falta el aviso de envío (.estado-form)');
  }
}

if (errores.length) {
  console.error(`\n✗ Integración del contacto incompleta en ${salida}/:`);
  for (const e of errores) console.error(`  - ${e}`);
  console.error('\n  Ver "Formulario de contacto y Prometheo" en PROYECTO.md.\n');
  process.exit(1);
}
console.log(`✓ Integración del contacto verificada en ${salida}/`);
