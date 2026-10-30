import { useEffect, useState } from 'react';
// recharts (+ d3) solo se descarga cuando un administrador abre esta ruta.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getSalesSummary } from '../lib/api';
import { formatPrice, sumBy } from '../lib/format';
import type { SalesPoint } from '../types';

export default function AdminPage() {
  const [data, setData] = useState<SalesPoint[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSalesSummary().then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  const chart = (data ?? []).map((d) => ({ day: d.day.slice(5), ventas: d.total_cents / 100 }));

  return (
    <section>
      <h1 className="text-2xl font-bold">Panel administrativo</h1>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {data && (
        <>
          <p className="mt-1 text-stone-600">Ventas últimos 7 días: <b>{formatPrice(sumBy(data, (d) => d.total_cents))}</b></p>
          <div className="mt-6 h-80 rounded-2xl border border-stone-200 bg-white p-4" role="img" aria-label="Gráfico de barras de ventas diarias de los últimos 7 días">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`} />
                <Tooltip formatter={(v) => formatPrice(Number(v) * 100)} />
                <Bar dataKey="ventas" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
