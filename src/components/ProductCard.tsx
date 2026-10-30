import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';
import { ProductDetailPage } from '../routes';
import type { Product } from '../types';

function ProductCardBase({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        to={`/producto/${product.id}`}
        onMouseEnter={() => void ProductDetailPage.preload()}
        onFocus={() => void ProductDetailPage.preload()}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        <img
          src={product.image_url}
          alt=""
          width={400}
          height={300}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
        />
        <div className="p-4 pb-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            🌿 Eco-score {product.eco_score}
          </span>
          <h3 className="mt-2 font-semibold leading-snug text-stone-900">{product.name}</h3>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between p-4 pt-2">
        <span className="text-lg font-bold">{formatPrice(product.price_cents)}</span>
        <button
          type="button"
          onClick={() => onAdd(product.id)}
          aria-label={`Agregar ${product.name} al carrito`}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Agregar
        </button>
      </div>
    </li>
  );
}

export const ProductCard = memo(ProductCardBase);
