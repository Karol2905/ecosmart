// ❌ ANTES — HALLAZGO CRÍTICO #1
// Se usaba la service_role key "para evitar errores de permisos" al crear pedidos.
// Al tener prefijo VITE_, Vite la incrusta en el JavaScript público: cualquier visitante
// podía copiarla desde DevTools y leer/modificar/borrar TODA la base de datos (salta RLS).
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY, // ⛔ secreto expuesto al navegador
);

export const isDemoMode = false;
