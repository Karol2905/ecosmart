import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listMyOrders } from '../lib/api';
import { formatDate, formatPrice, fromNow } from '../lib/format';
import type { Order } from '../types';

const STATUS: Record<Order['status'], string> = { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado' };

export default function AccountPage() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listMyOrders().then(setOrders).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-bold">Hola, {profile?.full_name ?? user?.email}</h1>
      <p className="text-sm text-stone-600">{user?.email}</p>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Mis pedidos</h2>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!orders && !error && <p className="text-stone-500">Cargando…</p>}
      {orders && (
        <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-medium">{o.id}</p>
                <p className="text-sm text-stone-500">
                  <time dateTime={o.created_at}>{formatDate(o.created_at)}</time> · {fromNow(o.created_at)} · {o.item_count} artículos
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{STATUS[o.status]}</span>
              <span className="font-bold">{formatPrice(o.total_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
