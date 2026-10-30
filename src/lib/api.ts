import type { Order, OrderItemInput, Product, Profile, SalesPoint } from '../types';
import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_SALES } from './mockData';
import { supabase } from './supabase';

/**
 * Capa de datos. Principio de "superficie mínima":
 *  - select() con columnas explícitas (nunca '*'), para no filtrar columnas futuras sensibles.
 *  - Los precios y totales NUNCA se envían desde el cliente: create_order es una RPC
 *    que los calcula en Postgres (Hallazgo #2).
 *  - Mensajes de error genéricos hacia la UI (no revelar si un email existe).
 */
const PRODUCT_COLS = 'id, name, description_html, price_cents, image_url, category, eco_score, stock';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {}

function fail(publicMessage: string, cause?: unknown): never {
  if (import.meta.env.DEV && cause) console.warn('[api]', cause);
  throw new ApiError(publicMessage);
}

export async function listProducts(): Promise<Product[]> {
  if (!supabase) return wait(400).then(() => MOCK_PRODUCTS);
  const { data, error } = await supabase.from('products').select(PRODUCT_COLS).eq('is_active', true).order('name');
  if (error) fail('No pudimos cargar el catálogo.', error);
  return data as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!supabase) return wait(300).then(() => MOCK_PRODUCTS.find((p) => p.id === id) ?? null);
  const { data, error } = await supabase.from('products').select(PRODUCT_COLS).eq('id', id).maybeSingle();
  if (error) fail('No pudimos cargar el producto.', error);
  return data as Product | null;
}

export async function createOrder(items: readonly OrderItemInput[]): Promise<string> {
  if (!supabase) return wait(600).then(() => `ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  // Solo se envían IDs y cantidades. El servidor busca el precio real y valida stock.
  const { data, error } = await supabase.rpc('create_order', { p_items: items });
  if (error) fail('No pudimos procesar tu pedido. Intenta nuevamente.', error);
  return data as string;
}

export async function listMyOrders(): Promise<Order[]> {
  if (!supabase) return wait(400).then(() => MOCK_ORDERS);
  // RLS garantiza que solo vuelvan los pedidos del usuario autenticado.
  const { data, error } = await supabase
    .from('orders')
    .select('id, total_cents, status, created_at, item_count')
    .order('created_at', { ascending: false });
  if (error) fail('No pudimos cargar tus pedidos.', error);
  return data as Order[];
}

export async function getSalesSummary(): Promise<SalesPoint[]> {
  if (!supabase) return wait(500).then(() => MOCK_SALES);
  // RPC con verificación de rol admin en el servidor (is_admin()).
  const { data, error } = await supabase.rpc('admin_sales_last_7_days');
  if (error) fail('No autorizado o error al cargar métricas.', error);
  return data as SalesPoint[];
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle();
  if (error) fail('No pudimos cargar tu perfil.', error);
  return data as Profile | null;
}
