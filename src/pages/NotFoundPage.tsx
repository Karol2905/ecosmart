import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="text-5xl font-bold text-emerald-700">404</p>
      <p className="mt-2 text-stone-600">Esta página no existe.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-emerald-700 underline">Volver al inicio</Link>
    </div>
  );
}
