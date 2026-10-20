# Sitio de Trópico (tropico.ar)

Astro, salida estática. Documentación técnica: `PROYECTO.md` (estructura,
casos, imágenes) y `EFECTOS.md` (bloques y animaciones).

## Regla del formulario de contacto — no romper

El formulario está integrado con Prometheo (CRM + WhatsApp). Está en la
fuente, así que cada build lo regenera entero; no se retoca nada en `dist/`.

- Al sumar o editar casos de portfolio no hay que tocar nada del contacto.
- No modificar `public/api/`, ni el `action`, los `name` de los campos, el
  campo trampa `sitio_web`, el campo `t`, el token `recaptcha`, el campo
  `acepta_whatsapp`, el aviso de consentimiento de WhatsApp ni la leyenda de
  reCAPTCHA de `src/pages/contacto.astro`, salvo que el pedido sea
  explícitamente sobre la integración con Prometheo.
- `npm run build` termina con `scripts/verificar-contacto.mjs`. Si falla, se
  corrige la causa en `src/` o `public/`; nunca se saltea el chequeo ni se
  parchea el `dist/`.
- Nunca poner API keys ni configuración privada en `public/`: va en la
  carpeta privada `tropi-privado/`, fuera del sitio.

Detalle completo en la sección "Formulario de contacto y Prometheo" de
`PROYECTO.md`.

## Imágenes (`src/assets/`)

La fuente única del sitio, imágenes incluidas, es el repo
`estoestropico/tropi-2026` en GitHub. Las imágenes originales se versionan
en `src/assets/`: en cualquier máquina alcanza con clonar, `npm install` y
`npm run build`. Ya no se copian desde zips de la carpeta de la Mac.

Prueba local: `npm run build` y servir `dist/` en la raíz de un puerto con el
PHP de XAMPP (`/opt/lampp/bin/php -S 127.0.0.1:8080 -t dist`). Las rutas son
absolutas, así que no funciona en `localhost/tropi-2026/dist/`. Ese servidor
usa la configuración real de Prometheo: cada envío crea un lead real.
