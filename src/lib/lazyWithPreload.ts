import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export type PreloadableComponent<T extends ComponentType> = LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>;
};

/**
 * React.lazy + método preload(). Permite descargar el chunk de una ruta cuando el
 * usuario pasa el mouse/enfoca el enlace, antes del clic → navegación instantánea
 * sin cargarlo en el bundle inicial.
 */
export function lazyWithPreload<T extends ComponentType>(factory: () => Promise<{ default: T }>): PreloadableComponent<T> {
  let promise: Promise<{ default: T }> | null = null;
  const load = () => (promise ??= factory());
  const Component = lazy(load) as PreloadableComponent<T>;
  Component.preload = load;
  return Component;
}
