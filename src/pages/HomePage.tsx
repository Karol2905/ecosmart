import { useCallback, useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { debounce } from '../lib/format';
import { useProducts } from '../lib/useProducts';
import type { Product } from '../types';

const CATEGORIES: { value: Product['category'] | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todo' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'moda', label: 'Moda' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'cuidado-personal', label: 'Cuidado personal' },
];

export default function HomePage() {
  const { products, loading, error, retry } = useProducts();
  const { add } = useCart();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('todas');
  const [toast, setToast] = useState('');

  // debounce nativo (antes: lodash completo, ~25 kB gzip)
  const onSearch = useMemo(() => debounce((v: string) => setQuery(v.trim().toLowerCase()), 200), []);

  const visible = useMemo(
    () =>
      (products ?? []).filter(
        (p) => (category === 'todas' || p.category === category) && p.name.toLowerCase().includes(query),
      ),
    [products, category, query],
  );

  const handleAdd = useCallback(
    (id: string) => {
      add(id);
      setToast('Producto agregado al carrito');
      setTimeout(() => setToast(''), 1800);
    },
    [add],
  );

  return (
    <>
      <section className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-800 px-6 py-12 text-white sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-200">Compra consciente</p>
        <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Productos sostenibles para tu día a día
        </h1>
        <p className="mt-3 max-w-lg text-emerald-100">Cada producto tiene un eco-score verificado y envío carbono neutral.</p>
      </section>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={category === c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                category === c.value ? 'bg-stone-900 text-white' : 'bg-white ring-1 ring-inset ring-stone-300 hover:bg-stone-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-64">
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            maxLength={60}
            placeholder="Buscar…"
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </label>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}{' '}
          <button type="button" onClick={retry} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <ul aria-busy="true" aria-label="Cargando productos" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="h-72 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </ul>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={handleAdd} />
          ))}
        </ul>
      )}

      <p aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2">
        {toast && <span className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">✓ {toast}</span>}
      </p>
    </>
  );
}
