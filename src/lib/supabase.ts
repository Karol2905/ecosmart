import { GoTrueClient } from '@supabase/auth-js';
import { PostgrestClient } from '@supabase/postgrest-js';

/**
 * OPTIMIZACIÓN (bundle): en lugar de @supabase/supabase-js (≈58 kB gzip, incluye
 * Realtime/WebSockets, Storage y Functions que EcoMart no usa) componemos solo los
 * dos módulos necesarios: auth-js + postgrest-js (≈30 kB gzip). Misma API: .auth, .from(), .rpc().
 */
export interface EcoMartClient {
  readonly auth: GoTrueClient;
  readonly from: PostgrestClient['from'];
  readonly rpc: PostgrestClient['rpc'];
}

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * HARDENING (Hallazgo #1): defensa en profundidad contra la exposición de la
 * service_role key. Decodificamos el payload del JWT y abortamos si el rol no es "anon".
 * (El build también falla gracias a scripts/check-secrets.mjs).
 */
function decodeJwtRole(key: string): string | null {
  const payload = key.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

export function assertPublicKey(key: string): void {
  if (key.startsWith('sb_secret_')) throw new Error('Clave secreta de Supabase detectada en el cliente.');
  const role = decodeJwtRole(key);
  if (role !== null && role !== 'anon') {
    throw new Error(`Clave de Supabase con rol "${role}" en el cliente. Solo se permite la anon key.`);
  }
}

function build(): EcoMartClient | null {
  if (!url || !anonKey || url.includes('tu-proyecto')) return null;
  assertPublicKey(anonKey);

  const base = url.replace(/\/$/, '');
  const projectRef = new URL(base).hostname.split('.')[0] ?? 'ecomart';

  const auth = new GoTrueClient({
    url: `${base}/auth/v1`,
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    storageKey: `sb-${projectRef}-auth-token`,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // PKCE: el token no viaja en el fragmento de la URL
  });

  // Igual que supabase-js: cada petición REST lleva el JWT del usuario si hay sesión,
  // de lo contrario la anon key. Así RLS evalúa auth.uid() correctamente.
  const fetchWithAuth: typeof fetch = async (input, init) => {
    const { data } = await auth.getSession();
    const headers = new Headers(init?.headers);
    if (!headers.has('apikey')) headers.set('apikey', anonKey);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? anonKey}`);
    return fetch(input, { ...init, headers });
  };

  const rest = new PostgrestClient(`${base}/rest/v1`, { headers: { apikey: anonKey }, fetch: fetchWithAuth });

  return {
    auth,
    from: rest.from.bind(rest),
    rpc: rest.rpc.bind(rest),
  };
}

export const supabase = build();
export const isDemoMode = supabase === null;
