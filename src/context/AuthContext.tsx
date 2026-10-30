import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchProfile } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthUser {
  readonly id: string;
  readonly email: string;
}

interface AuthState {
  readonly user: AuthUser | null;
  readonly profile: Profile | null;
  readonly ready: boolean;
  readonly signIn: (email: string, password: string) => Promise<void>;
  readonly signUp: (fullName: string, email: string, password: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Mensaje genérico: evita enumeración de usuarios (no revela si el correo existe). */
const GENERIC_LOGIN_ERROR = 'Correo o contraseña incorrectos.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    // La sesión la gestiona el SDK (no la copiamos manualmente a localStorage ni la logueamos).
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? '' } : null);
      if (u) {
        // El rol se lee de la tabla profiles (protegida por RLS), nunca de user_metadata,
        // que el propio usuario puede modificar.
        void fetchProfile(u.id).then(setProfile).catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      await new Promise((r) => setTimeout(r, 500));
      if (password.length < 6) throw new Error(GENERIC_LOGIN_ERROR);
      const isAdmin = email.toLowerCase() === 'admin@ecomart.demo';
      setUser({ id: 'demo-user', email });
      setProfile({ id: 'demo-user', full_name: isAdmin ? 'Admin Demo' : 'Cliente Demo', role: isAdmin ? 'admin' : 'customer' });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(GENERIC_LOGIN_ERROR);
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    if (!supabase) {
      await new Promise((r) => setTimeout(r, 700));
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      // full_name va como metadata; el trigger handle_new_user crea el perfil y FUERZA role='customer'.
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
    });
    // Respuesta idéntica exista o no el correo (anti-enumeración). Supabase ya lo hace si
    // "Confirm email" está activo; aquí solo propagamos errores de validación genéricos.
    if (error && error.status !== 422) throw new Error('No pudimos completar el registro. Revisa los datos.');
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ user, profile, ready, signIn, signUp, signOut }),
    [user, profile, ready, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
