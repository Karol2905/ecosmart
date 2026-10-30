import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { listProducts } from './api';

let cache: Promise<Product[]> | null = null;

/** Catálogo compartido entre páginas con una sola petición por sesión. */
export function useProducts() {
  const [state, setState] = useState<{ data: Product[] | null; error: string | null }>({ data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    cache ??= listProducts();
    cache
      .then((data) => alive && setState({ data, error: null }))
      .catch((e: unknown) => {
        cache = null;
        if (alive) setState({ data: null, error: e instanceof Error ? e.message : 'Error inesperado' });
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  return { products: state.data, error: state.error, loading: !state.data && !state.error, retry: () => setAttempt((n) => n + 1) };
}
