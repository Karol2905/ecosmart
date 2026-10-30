import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLoader } from '../components/PageLoader';
import { useCart } from '../context/CartContext';
import { getProduct } from '../lib/api';
import { formatPrice } from '../lib/format';
import { sanitizeHtml } from '../lib/sanitize';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const { id = '' } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    getProduct(id)
      .then((p) => alive && setProduct(p))
      .catch(() => alive && setProduct(null));
    return () => {
      alive = false;
    };
  }, [id]);

  // HTML enriquecido saneado con lista blanca (DOMPurify viaja solo en este chunk).
  const safeDescription = useMemo(() => (product ? sanitizeHtml(product.description_html) : ''), [product]);

  if (product === undefined) return <PageLoader />;
  if (product === null)
    return (
      <p className="py-20 text-center">
        Producto no encontrado. <Link to="/" className="font-semibold text-emerald-700 underline">Volver</Link>
      </p>
    );

  return (
    <article className="grid gap-8 md:grid-cols-2">
      <img src={product.image_url} alt="" width={400} height={300} className="w-full rounded-3xl" />
      <div>
        <Link to="/" className="text-sm text-emerald-700 hover:underline">← Catálogo</Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-2 text-2xl font-bold text-emerald-800">{formatPrice(product.price_cents)}</p>
        <div className="prose mt-4 space-y-2 text-stone-700 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: safeDescription }} />
        <p className="mt-4 text-sm text-stone-500">Stock disponible: {product.stock}</p>
        <button
          type="button"
          onClick={() => {
            add(product.id);
            setAdded(true);
          }}
          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
        >
          Agregar al carrito
        </button>
        <p aria-live="polite" className="mt-2 text-sm text-emerald-700">{added ? '✓ Agregado' : ''}</p>
      </div>
    </article>
  );
}
