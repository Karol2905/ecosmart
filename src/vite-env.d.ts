/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública del proyecto Supabase */
  readonly VITE_SUPABASE_URL?: string;
  /** anon / publishable key (pública). NUNCA la service_role. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
