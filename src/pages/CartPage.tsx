import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../lib/api';
import { formatPrice, sumBy } from '../lib/format';
import { useProducts } from '../lib/useProducts';

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart();
  const { products } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; msg?: string }>({ kind: 'idle' });

  const lines = useMemo(
    () =>
      items.flatMap((i) => {
        const p = products?.find((x) => x.id === i.product_id);
        return p ? [{ ...i, product: p }] : [];
      }),
    [items, products],
  );
  // Total SOLO informativo; el valor cobrado lo calcula create_order en el servidor.
  const estimated = sumBy(lines, (l) => l.product.price_cents * l.quantity);

  async function checkout() {
    if (!user) {
      navigate('/login?redirect=/carrito');
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const orderId = await createOrder(items);
      clear();
      setStatus({ kind: 'ok', msg: `Pedido ${orderId} creado correctamente.` });
    } catch (e) {
      setStatus({ kind: 'error', msg: e instanceof Error ? e.message : 'Error inesperado' });
    }
  }

  if (status.kind === 'ok')
    return (
      <div role="status" className="mx-auto max-w-md py-16 text-center">
        <p className="text-5xl" aria-hidden="true">🌱</p>
        <h1 className="mt-4 text-2xl font-bold">¡Gracias por tu compra!</h1>
        <p className="mt-2 text-stone-600">{status.msg}</p>
        <Link to="/cuenta" className="mt-6 inline-block font-semibold text-emerald-700 underline">Ver mis pedidos</Link>
      </div>
    );

  return (
    <section aria-labelledby="cart-title" className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 id="cart-title" className="mb-6 text-2xl font-bold">Tu carrito</h1>
        {lines.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-stone-300 p-10 text-center text-stone-500">
            Tu carrito está vacío. <Link to="/" className="font-semibold text-emerald-700 underline">Explorar productos</Link>
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {lines.map((l) => (
              <li key={l.product_id} className="flex items-center gap-4 p-4">
                <img src={l.product.image_url} alt="" width={64} height={48} className="h-12 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{l.product.name}</p>
                  <p className="text-sm text-stone-500">{formatPrice(l.product.price_cents)}</p>
                </div>
                <label className="text-sm">
                  <span className="sr-only">Cantidad de {l.product.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={l.quantity}
                    onChange={(e) => setQty(l.product_id, Number(e.target.value))}
                    className="w-16 rounded-lg border border-stone-300 px-2 py-1"
                  />
                </label>
                <button type="button" onClick={() => remove(l.product_id)} aria-label={`Quitar ${l.product.name}`} className="text-sm text-stone-400 hover:text-red-600">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold">Resumen</h2>
        <p className="mt-4 flex justify-between text-lg font-bold">
          <span>Total estimado</span>
          <span>{formatPrice(estimated)}</span>
        </p>
        <p className="mt-1 text-xs text-stone-500">El total final se confirma en el servidor.</p>
        {status.kind === 'error' && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{status.msg}</p>
        )}
        <button
          type="button"
          disabled={lines.length === 0 || status.kind === 'sending'}
          onClick={() => void checkout()}
          className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {status.kind === 'sending' ? 'Procesando…' : user ? 'Finalizar compra' : 'Ingresa para comprar'}
        </button>
      </aside>
    </section>
  );
}
