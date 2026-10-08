# Farmaexpert — assets del caso

La página (`src/pages/casos/farmaexpert.astro`) referencia estos archivos.
Exportá de Figma y dejalos acá con estos nombres exactos.

> **Formato:** ideal `.webp`. Si te resulta más fácil exportar `.png`/`.jpg`, dejalos igual
> con el número correcto y avisame: cambio las extensiones en la página con un find/replace.
> Las fotos/mockups → JPG o WEBP. Los gráficos con transparencia (logos, sistema) → PNG o WEBP.

## Imágenes → `/casos/farmaexpert/img/`

| Archivo | Qué es | Capa en Figma |
|---|---|---|
| `01.webp` | Hero épico (full width) | `farmaexpert_epica_v2` |
| `02.webp` | Banda de marca sobre azul (logo + claim) | frame azul `#003DA6` con el logo (nodo 40:1070) |
| `03.webp` | Banda de variaciones de logo (blanco / teal / blanco) | bandas con `Group 500/501` + logo (nodos 40:1105–40:1115) |
| `04.webp` | Manual/sistema de marca 1 | `manual-19` / `manual-22` |
| `05.webp` | Manual/sistema de marca 2 | `manual-17` / `farma-07` |
| `06.webp` | Manual/sistema de marca 3 | `manual-20` / `manual-26` |
| `07.webp` | Manual/sistema de marca 4 | `manual-21` / `farma-06` |
| `08.webp` | Arquigrafía — billboard (parallax, apaisado) | `Billboard` (nodo 40:832) |
| `09.webp` | Packaging / tote / composición azul | `Tote-Bag` + comp. azul (nodos 40:835 / 548:430) |
| `10.webp` | Fachada / mockup ambo | `farmacia_portfolio_mejorada` / `Farmaexpert_Ambo_Mockup` |
| `11.webp` | E-commerce — tablet (full width) | `image 50` (nodo 40:870) |
| `12.webp` | Placa social 1 (formato IG, vertical) | `Promos Nov-1` |
| `13.webp` | Placa social 2 | `Promos Oct-1` |
| `14.webp` | Placa social 3 | `Rutina.01` (547:355) |
| `15.webp` | Placa social 4 | `40 OFF` / Shampoo Dercos (547:311) |
| `16.webp` | BTL / cierre (full width) | `guderm_beauty_day_ventanal` / `image 51` |

## Videos → `/casos/farmaexpert/video/`

Los alojás vos. Cada video necesita su MP4 y un poster (un frame en webp/jpg, mismo nombre).

| Archivo | Qué es |
|---|---|
| `01.mp4` + `01.webp` | **Chica con lentes** (UGC / vidriera) — sección E-commerce |
| `02.mp4` + `02.webp` | **Fondo azul con contorno de celu** #1 — sección BTL |
| `03.mp4` + `03.webp` | **Fondo azul con contorno de celu** #2 — sección BTL |

> El poster (`.webp`) es lo que se ve antes de que cargue el video (lazy-load por `caso.js`).
> Si no tenés poster, sacá un screenshot del primer frame.
