// ❌ ANTES — HALLAZGO CRÍTICO #2 (lógica de negocio en el cliente)
// El carrito guardaba el producto completo (con precio) en localStorage y el total
// calculado en el navegador se insertaba directamente en la tabla orders.
// Ataque: en DevTools → localStorage.cart[0].price_cents = 100 → compra por $1.
import { supabase } from '../lib/supabase';

export async function checkout(cart: { id: string; price_cents: number; qty: number }[], userId: string) {
  const total = cart.reduce((a, i) => a + i.price_cents * i.qty, 0);
  return supabase.from('orders').insert({
    user_id: userId,        // también manipulable: pedidos a nombre de otro usuario
    total_cents: total,     // ⛔ precio decidido por el cliente
    status: 'paid',         // ⛔ el cliente marcaba el pedido como pagado
    items: cart,
  });
}
