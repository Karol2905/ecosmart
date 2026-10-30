import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { OrderItemInput } from '../types';

interface CartState {
  readonly items: readonly OrderItemInput[];
  readonly count: number;
  readonly add: (productId: string, qty?: number) => void;
  readonly setQty: (productId: string, qty: number) => void;
  readonly remove: (productId: string) => void;
  readonly clear: () => void;
}

const KEY = 'ecomart:cart:v2';
const MAX_QTY = 20;
const CartContext = createContext<CartState | null>(null);

/**
 * El carrito persiste SOLO {product_id, quantity}. Antes guardaba el objeto producto
 * con su precio, y ese precio (manipulable desde DevTools) se enviaba al checkout.
 * Lo leído de localStorage se valida porque es entrada no confiable.
 */
function load(): OrderItemInput[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (i): i is OrderItemInput =>
          typeof i === 'object' && i !== null &&
          typeof (i as OrderItemInput).product_id === 'string' &&
          Number.isInteger((i as OrderItemInput).quantity),
      )
      .map((i) => ({ product_id: i.product_id.slice(0, 64), quantity: Math.min(MAX_QTY, Math.max(1, i.quantity)) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItemInput[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [items]);

  const setQty = useCallback((productId: string, qty: number) => {
    const q = Math.min(MAX_QTY, Math.max(0, Math.floor(qty)));
    setItems((prev) =>
      q === 0
        ? prev.filter((i) => i.product_id !== productId)
        : prev.map((i) => (i.product_id === productId ? { ...i, quantity: q } : i)),
    );
  }, []);

  const add = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product_id === productId);
      if (found) {
        return prev.map((i) =>
          i.product_id === productId ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + qty) } : i,
        );
      }
      return [...prev, { product_id: productId, quantity: Math.min(MAX_QTY, qty) }];
    });
  }, []);

  const remove = useCallback((productId: string) => setItems((p) => p.filter((i) => i.product_id !== productId)), []);
  const clear = useCallback(() => setItems([]), []);
  const count = useMemo(() => items.reduce((a, i) => a + i.quantity, 0), [items]);

  const value = useMemo(() => ({ items, count, add, setQty, remove, clear }), [items, count, add, setQty, remove, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
