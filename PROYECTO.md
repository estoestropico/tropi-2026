# Trópico T26 — web

Sitio del estudio. Astro 5 + Tailwind v4, salida estática.

## Fuente de verdad

**Para las páginas de caso, la referencia es el código, no el Figma.** Lo que
está montado en `src/pages/casos/` es el diseño aprobado. No hay que abrir el
Figma T26 para verificar ni para corregir un caso: los ajustes se piden acá y
se hacen sobre el código. La única excepción es que Fernando pase un Figma
nuevo y lo diga explícitamente; en ese caso ese archivo manda para lo que
indique, y de ahí en más vuelve a mandar el código.

Para el resto de las páginas (home, listado, contacto), Fernando indica la
referencia caso por caso.

El Figma histórico de los casos es **T26** (`u4QtvkyZsYmtUZiBwSVav6`), y queda
sólo como archivo de origen de los assets.

## Comandos

```bash
npm run dev      # servidor local en :4321
npm run build    # salida estática en dist/ + chequeo del contacto
npm run preview  # sirve dist/
npm run check    # chequeo de tipos de Astro
```

## Estructura

```
src/
  assets/
    brand/            logo y assets de marca Trópico
    casos/<slug>/     exports de Figma por caso
  components/
    layout/           Header, Footer
    ui/               Boton, Tags, Logo
    caso/             bloques reutilizables de página de caso
  content/casos/      metadata de cada caso (.yaml) — alimenta listados
  layouts/Base.astro  head, SEO, header y footer
  pages/
    index.astro
    casos/index.astro
    casos/<slug>.astro
  styles/global.css   tokens del sistema
```

## Formulario de contacto y Prometheo

El formulario de `/contacto/` verifica cada envío con reCAPTCHA v3, lo
registra como lead en Prometheo (CRM) con sus tags y la consulta en la
variable "Consulta", y le manda la plantilla de bienvenida por WhatsApp. El
consentimiento es el aviso "Al enviar, aceptás que Trópico te contacte por
WhatsApp…" debajo del botón. Desde ahí sigue el agente de IA de Prometheo.

El badge flotante de reCAPTCHA está oculto; por eso debajo del formulario va
la leyenda con los links a la Política de Privacidad y las Condiciones de
Google, que Google exige en ese caso.

**Está integrado en la fuente, no en el build.** Cada `npm run build` lo
regenera completo: no hay que retocar nada en `dist/` después de compilar.

| Pieza | Dónde vive |
|---|---|
| Formulario, campos y script de envío | `src/pages/contacto.astro` |
| Página de destino después de enviar | `src/pages/muchas-gracias.astro` |
| Envío, validación, anti-spam, alta en Prometheo y plantilla | `public/api/` (Astro lo copia tal cual a `dist/api/`) |
| API key, IDs de tags, plantilla, logs | carpeta privada `tropi-privado/`, **fuera** del sitio y del repo |
| Chequeo automático | `scripts/verificar-contacto.mjs` |

### Reglas

1. **Actualizar casos no toca nada de esto.** Un caso nuevo es el `.yaml`, la
   página en `src/pages/casos/` y sus imágenes: ninguno de esos archivos
   interviene en el contacto.
2. **No editar `public/api/`** ni los `name` de los campos, el `action` del
   formulario, el campo trampa `sitio_web`, el campo `t`, el token
   `recaptcha`, el campo `acepta_whatsapp`, el aviso de consentimiento ni la
   leyenda de reCAPTCHA. El resto del diseño del formulario (estilos, orden,
   textos de los campos) sí se puede cambiar.
3. **`npm run build` y `npm run build:previa` verifican la integración al
   final.** Si falta el PHP, su `.htaccess` o algún campo, el build sale con
   error y explica qué falta. Un build que falla así no se sube.
4. Si se agrega o renombra un servicio en `SERVICIOS` de `contacto.astro`,
   hay que sumarlo en `tags.servicios` del `config.php` privado; si no, el
   PHP lo descarta en silencio.
5. Los secretos nunca van en `public/`: todo lo que está ahí se publica.

### En el hosting

`public/api/contacto.php` busca `config.php` en este orden: la variable de
entorno `TROPI_PRIVADO`, una carpeta `tropi-privado/` **al lado** de la raíz
pública (en Hostinger, junto a `public_html/`) y la ruta local de XAMPP. Con
la carpeta privada subida una vez junto a `public_html/`, los builds siguientes
no requieren tocar nada. Requiere PHP 8.1 o superior con cURL.

## Design tokens

Definidos en `src/styles/global.css`, tomados de las variables del Figma.

| Token | Valor | Uso |
|---|---|---|
| `--color-arena` | `#f5f4eb` | fondo general |
| `--color-oscuro` | `#050515` | texto y fondos oscuros |
| `--color-amarillo` | `#ddfd30` | CTA |
| `--color-verde` | `#b4e600` | links del footer |

Tipografía: **Onest** (self-hosted, `@fontsource-variable/onest`), peso 700 para
titulares. Los tamaños van en `rem` — ver la sección de tipografía en
`EFECTOS.md`.

Escala: titular 5rem (80px) / intro 2rem (32px) / subtítulo 1.625rem (26px) /
cuerpo 1.125rem (18px, interlineado 1,4) / etiqueta 0.8125rem (13px) /
nav 0.875rem (14px).

El bloque de texto de caso usa la proporción 42,5% / 57,5% del Figma.

## Cómo se suma un caso nuevo

1. Exportar los assets desde Figma a `src/assets/casos/<slug>/`.
   Nombres en minúscula, sin espacios ni acentos, que digan qué es la pieza
   (`escudo-1990.svg`, `remera-1.png`, `ico-termometro.svg`). Nada de
   `Group 1846 1.png` ni `rectangle-5892.png`: el nombre del archivo es lo que
   se sirve y es lo que lee un buscador. La convención completa y la tabla de
   renombres ya aplicados están en `_ref/nombres-assets.md`.
2. Crear `src/content/casos/<slug>.yaml` con la metadata (ver
   `washington-school.yaml`). El schema está en `src/content.config.ts`.
3. Crear `src/pages/casos/<slug>.astro` componiendo los bloques de
   `src/components/caso/`. Tomar `washington-school.astro` como referencia.

El listado de portfolio y el bloque "ver más proyectos" se arman solos con la
metadata del paso 2.

## Dónde tocar cada cosa

No hay archivos `.html`: las páginas son `.astro`, que es HTML con un bloque de
JavaScript arriba entre `---` (ahí van los imports y los datos) y estilos abajo
entre `<style>`. Todo lo del medio es HTML común.

Con `npm run dev` corriendo en `:4321`, cualquier archivo que guardes se
recarga solo.

| Qué querés cambiar | Archivo |
|---|---|
| Texto, orden de los bloques, espaciado entre bloques, color de una banda, posición de una pieza | `src/pages/casos/<caso>.astro` |
| Cliente, titular, industria, servicios, portada, orden en el portfolio | `src/content/casos/<caso>.yaml` |
| Algo que se repite en todos los casos (el hero, los tags, la escala del bloque de texto) | `src/components/caso/` y `src/components/ui/` |
| Colores, anchos y la escala de espacios | `src/styles/global.css` y `src/lib/espacios.ts` |
| Header, footer | `src/components/layout/` |

### Vocabulario que vas a ver en una página de caso

- `espacio="xs \| s \| m \| l"` — separación con el bloque de arriba: 12, 48,
  112 y 150 px. `nulo` los pega.
- `efecto="reveal \| fade \| parallax"` — cómo entra: máscara que se abre,
  aparición con subida, o desplazamiento dentro del marco al scrollear.
- `ancho="contenido \| completo"` — columna de texto de 1410, o todo el ancho.
- `class="full-width"` — el bloque rompe el tope de 1780 y va al ancho de la
  pantalla. Es lo que usan las imágenes a sangre.
- `class="contenido \| franja \| ancho"` — contenedores de 1410, 1530 o a
  medida (`style="--ancho:885px"`).
- `proporcion="1780/836"` — la proporción del marco, no el tamaño del archivo.

### Antes de dar algo por bueno

```bash
npm run build   # falla si rompiste algo
npm run check   # tipos y props mal pasadas
```

## Bloques de caso disponibles

| Componente | Para qué |
|---|---|
| `CasoHero` | Cliente, titular, tags y foto de apertura |
| `Intro` | Párrafo de contexto |
| `BloqueTexto` | Etiqueta a la izquierda, título y cuerpo a la derecha |
| `ColumnaDerecha` | Piezas alineadas con la columna del texto |
| `Media` | Una imagen, a sangre o dentro de la grilla |
| `Video` | Video en loop, o su poster si el archivo todavía no está |
| `Grilla` | Dos medios en fila con la proporción del Figma (`"1176fr 593fr"`) |
| `Composicion` + `Pieza` | Composición con posiciones tomadas del Figma |
| `Banda` | Franja de color a sangre |
| `MosaicoFeed` | Mosaico de 4 columnas trabadas, con parallax |
| `TiraDoble` | Dos filas horizontales que se cruzan al scrollear |
| `Falta` | Placeholder rojo para un asset que todavía no está |
| `OtrosProyectos` | Grilla de casos relacionados |

Cada bloque declara su `efecto` y su `espacio` en la página del caso.
**Todo eso está documentado en `EFECTOS.md`** — leerlo antes de maquetar un
caso nuevo.

## Anchos

| Utilidad | Medida | Para qué |
|---|---|---|
| `marco` | 1680px | header y footer |
| `contenido` | 1410px | columna de contenido del caso |
| `franja` | 1530px | contenido dentro de una banda de color |
| `ancho` | a medida | pieza suelta: `class="ancho" style="--ancho:1182px"` |

Los cuatro usan `min(100% - 2.5rem, X)`: mantienen 20px de margen lateral cuando
no hay espacio y el ancho exacto cuando sí lo hay.

Los anchos van siempre por estas utilidades, nunca como clase arbitraria de
Tailwind. `w-[min(100%-2.5rem,1182px)]` parece equivalente pero es **CSS
inválido**: dentro de `min()` el `-` necesita espacios a los lados, y sin ellos
el navegador descarta la declaración entera y el bloque se va a sangre
completa.

## Imágenes

Lo que se sube no es lo que se sirve: Astro re-encodea cada PNG/JPG a WebP y
genera las variantes del `srcset`. Comprimir antes de subir hace que se
comprima dos veces y aparezcan artefactos. Va el mejor original posible.

Las excepciones son **SVG y MP4**: se sirven tal cual, ahí el peso importa.

### Formato

| Contenido | Formato | Ajuste |
|---|---|---|
| Fotos | JPG calidad 90–95, sRGB, croma 4:4:4, sin metadatos | nunca PNG: una foto en PNG pesa 10 veces más para nada |
| Placas gráficas, mockups con texto, cualquier cosa con transparencia | PNG-24 | |
| Logos, íconos, tramas, tiras de color | SVG | pasarlo por SVGO antes de subir |

### Tamaño

El doble del ancho al que se renderiza, con techo en 2560.

| Dónde va | Ancho de render | Exportar |
|---|---|---|
| A sangre | 1780 | 2560 |
| `contenido` completo | 1410 | 2560 |
| Mitad a sangre | 890 | 1780 |
| Mitad de contenido | 690 | 1400 |
| Tercio a sangre | 586 | 1200 |
| Tercio de contenido | 470 | 960 |
| Piezas de feed y stories | 281 | 600 |
| Portadas del listado | 454 | 900 |

Nunca agrandar: si el original tiene 1800px de ancho, se exporta 1800. Una foto
interpolada pesa más y se ve peor.

El `srcset` sale del array `widths` de `Media.astro` y `CasoHero.astro`, hoy en
`[640, 960, 1280, 1600, 2048, 2560]`. Astro no agranda: de una fuente de 1780
genera hasta 1780 y descarta los dos escalones de arriba. Los escalones grandes
recién entran en juego cuando la fuente los tiene.

Los bloques chicos tienen su propio array, más corto: `MosaicoFeed`,
`OtrosProyectos`, `Pieza` y `Video`.

## Restricción conocida

El proxy de red bloquea `figma.com`, así que los assets **no** se pueden bajar
por MCP: se exportan a mano desde Figma a la carpeta del caso.
El MCP sí sirve para leer el diseño (medidas, tipografías, colores, textos).
