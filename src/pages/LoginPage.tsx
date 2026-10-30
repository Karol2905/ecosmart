import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isDemoMode } from '../lib/supabase';
import { safeRedirect } from '../lib/security';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await signIn(email.trim().toLowerCase(), password);
      // safeRedirect bloquea ?redirect=https://phishing.com (open redirect)
      navigate(safeRedirect(params.get('redirect'), '/cuenta'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <p className="mt-1 text-sm text-stone-600">
        ¿Nuevo en EcoMart? <Link to="/registro" className="font-semibold text-emerald-700 underline">Crea una cuenta</Link>
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium">
          Correo
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </label>
        <label className="block text-sm font-medium">
          Contraseña
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={sending} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          {sending ? 'Ingresando…' : 'Ingresar'}
        </button>
        {isDemoMode && (
          <p className="text-xs text-stone-500">Demo: cualquier correo + contraseña de 6+ caracteres. Usa <b>admin@ecomart.demo</b> para ver el panel admin.</p>
        )}
      </form>
    </div>
  );
}
