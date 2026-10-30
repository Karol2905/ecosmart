import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { isDemoMode } from '../lib/supabase';
import { PRELOAD } from '../routes';

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
    isActive ? 'bg-emerald-50 text-emerald-800' : 'text-stone-600 hover:bg-stone-100'
  }`;

const preload = (path: string) => () => void PRELOAD[path]?.();

export function Layout() {
  const { user, profile, signOut } = useAuth();
  const { count } = useCart();

  return (
    <div className="flex min-h-screen flex-col">
      {isDemoMode && (
        <p className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
          Modo demo: datos simulados (configura .env.local para conectar Supabase)
        </p>
      )}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-auto flex items-center gap-2 text-lg font-bold text-emerald-800">
            <span aria-hidden="true">🛒</span> EcoMart
          </Link>
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={navCls} onMouseEnter={preload('/admin')} onFocus={preload('/admin')}>
              Admin
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/cuenta" className={navCls} onMouseEnter={preload('/cuenta')} onFocus={preload('/cuenta')}>
                Mi cuenta
              </NavLink>
              <button type="button" onClick={() => void signOut()} className={navCls({ isActive: false })}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navCls} onMouseEnter={preload('/login')} onFocus={preload('/login')}>
                Ingresar
              </NavLink>
              <NavLink to="/registro" className={navCls} onMouseEnter={preload('/registro')} onFocus={preload('/registro')}>
                Crear cuenta
              </NavLink>
            </>
          )}
          <NavLink
            to="/carrito"
            className={navCls}
            onMouseEnter={preload('/carrito')}
            onFocus={preload('/carrito')}
            aria-label={`Carrito, ${count} productos`}
          >
            🧺 <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{count}</span>
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        EcoMart © 2026 · Comercio sostenible
      </footer>
    </div>
  );
}
