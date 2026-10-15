import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Colección `casos`
 * Metadata de cada caso: alimenta el listado de portfolio, las tarjetas de
 * "ver más proyectos" y el hero de la página de caso.
 * El cuerpo de cada caso se maqueta en src/pages/casos/<slug>.astro
 * componiendo los bloques de src/components/caso/.
 */
const casos = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/casos' }),
  schema: ({ image }) =>
    z.object({
      cliente: z.string(),
      titular: z.string(),
      bajada: z.string().optional(),
      /* Meta descripción de la ficha, cuando la bajada pasa de 160
         caracteres y Google la cortaría a la mitad. */
      metaDescripcion: z.string().optional(),
      rubro: z.string(),
      servicios: z.array(z.string()),
      anio: z.string().optional(),
      orden: z.number().default(99),
      publicado: z.boolean().default(true),
      destacado: z.boolean().default(false),
      portada: image(),
      portadaAlt: z.string(),
      heroAlt: z.string().optional(),
    }),
});

export const collections = { casos };
