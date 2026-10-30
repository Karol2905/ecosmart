/**
 * OPTIMIZACIÓN: reemplaza moment.js (~72 kB gzip con locales) y lodash (~25 kB gzip)
 * por APIs nativas del navegador (Intl) → 0 kB añadidos al bundle.
 */
const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });
const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export const formatPrice = (cents: number): string => money.format(cents / 100);

export const formatDate = (iso: string): string => dateFmt.format(new Date(iso));

/** Equivalente a moment(date).fromNow() */
export function fromNow(iso: string): string {
  const diffDays = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return Math.abs(diffDays) < 1 ? 'hoy' : relative.format(diffDays, 'day');
}

/** Equivalente a _.debounce */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Equivalente a _.sumBy */
export const sumBy = <T,>(items: readonly T[], pick: (item: T) => number): number =>
  items.reduce((acc, i) => acc + pick(i), 0);
