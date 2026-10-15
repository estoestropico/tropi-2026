/**
 * Escala de espacios verticales del caso.
 * Se declara por bloque con la prop `espacio`, igual que el efecto.
 *
 *   nulo  0      pegado al bloque anterior
 *   xs    12px   piezas de una misma serie
 *   s     48px   respiro corto
 *   m     112px  separación estándar entre secciones  ← default
 *   l     150px  respiro grande (apertura y cierre de caso)
 */
export type Espacio = 'nulo' | 'xs' | 's' | 'm' | 'l';

export const ESPACIOS: Record<Espacio, string> = {
  nulo: '0px',
  xs: '12px',
  s: '48px',
  m: '112px',
  l: '150px',
};

/** Devuelve el style inline para el margen superior de un bloque. */
export function margenArriba(espacio?: Espacio): string | undefined {
  if (!espacio) return undefined;
  return `margin-top:${ESPACIOS[espacio]}`;
}
