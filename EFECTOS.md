# Efectos y espacios

Cuatro efectos, y nada más. Todos se declaran **en la página del caso**
(`src/pages/casos/<slug>.astro`), nunca por defecto adentro de un componente:
si querés cambiar uno, tocás esa línea y no se mueve nada más.

Todos se apagan solos con `prefers-reduced-motion` y tienen respaldo en
`noscript`.

---

## 1 · Reveal

La imagen se descubre con un clip que se abre de abajo hacia arriba (1200 ms)
mientras el contenido baja de escala 1,14 a 1 (1600 ms).

```astro
<Media src={foto} alt="…" efecto="reveal" />
```

## 2 · Fade

Opacidad de 0 a 1 con una subida de 20 px (800 ms). Más discreto que la reveal.

```astro
<Media src={foto} alt="…" efecto="fade" />
```

## 3 · Parallax

La imagen ya está puesta —no entra— y se desplaza dentro de su marco al
scrollear. Recorre entre 65 y 100 px.

```astro
<Media src={foto} alt="…" efecto="parallax" />
```

Los tres son **excluyentes**: una imagen entra con reveal, o entra con fade, o
ya está puesta y se desplaza con parallax. No se combinan.

## 4 · Quieto

```astro
<Media src={foto} alt="…" efecto="ninguno" />
```

---

## Compuestos

Dos bloques con movimiento propio, ya armados:

| Componente | Dónde | Qué hace |
|---|---|---|
| `MosaicoFeed` | feed de redes | 4 columnas verticales trabadas; al scrollear, la 1 y la 3 suben, la 2 y la 4 bajan |
| `TiraDoble` | brandbook de houses | 2 filas horizontales trabadas; una se va a la izquierda, la otra a la derecha |

Las velocidades y el trabado se editan en el array que está arriba de cada uno
de esos componentes.

`MosaicoFeed` sirve para los dos casos: sin props arma los placeholders
numerados 01–16 (Washington, hasta que estén las piezas), y con `columnas`
toma las imágenes reales que le pasa la página. En Parisi el array
`columnasFeed` está arriba del `<Base>`, en `src/pages/casos/parisi.astro`.

| Prop | Para qué |
|---|---|
| `columnas` | las 4 columnas y sus piezas. Cada columna: `offset`, `velocidad` y `piezas` |
| `offset` | posición de reposo de la columna. En px para un marco de alto fijo, en % (del alto de la columna) para uno que escala con el ancho |
| `velocidad` | `-1` sube, `1` baja |
| `recorrido` | cuántos px recorre una columna de velocidad 1 de punta a punta del viewport |
| `proporcion` / `proporcionBase` | proporción del marco de lg en adelante / por debajo de lg |
| `altura` | alto fijo del marco, cuando no se declara proporción |
| `gap`, `relleno`, `fondo` | separación entre piezas, padding interno y color de fondo del marco |

La primera y la última pieza de cada columna quedan fuera del marco: son el
material que entra al scrollear. En reposo se ven las piezas del medio, que
son las del Figma.

---

## El recorte, que es lo que suele romperse

`recorte` decide de dónde sale el margen del parallax:

| | Cuándo | Qué pasa |
|---|---|---|
| `recorte` (default) | fotos | La imagen llena el marco al 112% y se recorta ~6% arriba y abajo. Ese sobrante es por donde se desplaza. |
| `recorte={false}` | placas gráficas, logos, líneas de tiempo | La imagen se ve **entera** y el marco lleva 9% de holgura. Nunca se corta un borde. |

**Si a una placa se le come el borde, es porque le falta `recorte={false}`.**

```astro
<Media src={placa} alt="…" efecto="parallax" recorte={false} />
```

---

## Textos

| Efecto | Cómo se pide | Qué hace |
|---|---|---|
| Líneas | `<BloqueTexto efecto="lineas">` (default) | El título se parte en líneas reales y cada una sube detrás de su máscara, escalonada 90 ms |
| Fade | `<BloqueTexto efecto="fade">` | Entra completo, sin partirse |
| Quieto | `<BloqueTexto efecto="ninguno">` | |

El cuerpo del bloque siempre entra con fade, 180 ms después del título.

---

## Hero

```astro
<CasoHero … velocidad={0.26} solape={64} />
```

`velocidad` es cuánto se adelanta la imagen al scroll: con 0,26 sube 156 px
extra cada 600 px. En 0 queda quieta.
`solape` es cuántos píxeles se monta la imagen sobre el bloque de texto; en 0
arranca justo debajo.

## Ojo con las bandas de color

Una banda tiene `espacio` (separación con el bloque anterior) **y** padding
interno propio. El aire que se ve es la suma de los dos. La banda de los diez
logos, por ejemplo, va con `espacio="nulo"` y 112 px de padding: el aire real
hasta el borde de color es 0, y hasta los logos, 112.

---

## Espacios

La separación entre bloques también se declara por línea, con la prop
`espacio`. Los valores están en `src/lib/espacios.ts`:

| Valor | Medida | Para qué |
|---|---|---|
| `nulo` | 0 | pegado al bloque anterior |
| `xs` | 12 px | piezas de una misma serie (las cuatro remeras, las mascotas) |
| `s` | 48 px | respiro corto |
| `m` | 112 px | **separación estándar entre secciones** |
| `l` | 150 px | respiro grande (apertura y cierre del caso) |

```astro
<Media src={foto} alt="…" efecto="reveal" espacio="m" />
<Grilla cols="1176fr 593fr" espacio="xs"> … </Grilla>
<Banda color={AZUL} espacio="m"> … </Banda>
<BloqueTexto etiqueta="…" espacio="m"> … </BloqueTexto>
```

Lo aceptan `Media`, `Video`, `BloqueTexto`, `Banda`, `Grilla`, `Composicion`,
`ColumnaDerecha`, `MosaicoFeed` y `TiraDoble`. En `BloqueTexto` el default ya
es `m`, así que todas las secciones de texto arrancan a la misma altura.

**La regla: ningún bloque lleva padding inferior estructural.** El hueco entre
dos bloques lo define siempre el `espacio` del de abajo, nunca la suma de un
padding de arriba más un margen de abajo. Si un bloque necesita relleno propio
—una banda de color, por ejemplo— ese padding es su relleno interno, no
separación entre secciones.

Para cambiar la escala entera —que todo el sitio respire más o menos— se tocan
los cinco valores de `src/lib/espacios.ts` y listo.

---

## Tipografía

Los tamaños van en `rem`, no en `px`: `rem` respeta el tamaño de fuente que la
persona configuró en su navegador, y `px` lo ignora. Para quien agrandó la letra
por accesibilidad, un sitio en px no cambia nada.

La equivalencia es directa con base 16: `1rem` = 16 px, `1.125rem` = 18 px,
`1.625rem` = 26 px, `5rem` = 80 px. Se piensa en px y se escribe en rem.

Los espacios y las medidas de layout sí van en px: ahí no hay razón de
accesibilidad y el control exacto vale más.

---

## Scroll suavizado

`src/components/ScrollSuave.astro`, incluido una vez en el layout base.

Interpola la posición del scroll **real** del documento: no mueve el body con
transform, así que las medidas siguen siendo correctas y el parallax, el
mosaico y las entradas funcionan sin tocarse.

- `SUAVIDAD = 0.12` — más bajo es más deslizamiento (0,08 muy suelto; 0,2 casi
  inmediato).
- No se activa con `prefers-reduced-motion` ni en pantallas táctiles, donde el
  sistema ya tiene su propia inercia.
- Teclado, barra de scroll y anclas siguen funcionando: si el scroll aparece en
  otro lado, el script se resincroniza en vez de pelearle.
- Para desactivarlo: sacar `<ScrollSuave />` de `src/layouts/Base.astro`.

---

## Dónde está cada cosa

| Archivo | Qué tiene |
|---|---|
| `src/pages/casos/<slug>.astro` | **Acá tocás.** Cada bloque con su `efecto`. |
| `src/components/caso/Pieza.astro` | Piezas del merch: `efecto="fade"` o `"ninguno"`. |
| `src/components/Animaciones.astro` | El motor. Observers, parallax, corte en líneas. |
| `src/styles/global.css` | Las transiciones y las curvas, bajo "Animaciones". |
| `src/components/caso/Media.astro` | Traduce `efecto` a los atributos del motor. |
| `src/components/caso/MosaicoFeed.astro` | Mosaico del feed. |
| `src/components/caso/TiraDoble.astro` | Tiras del brandbook. |
| `src/components/ScrollSuave.astro` | Scroll suavizado. |

Los atributos que el motor lee son `data-mascara`, `data-revelar`,
`data-lineas`, `data-parallax`, `data-parallax-in` y `data-parallax-doc`.
No hace falta escribirlos a mano: los pone el componente según el `efecto`.
