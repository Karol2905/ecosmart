import type { Order, Product, SalesPoint } from '../types';

const img = (emoji: string, from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><text x='200' y='185' font-size='110' text-anchor='middle'>${emoji}</text></svg>`,
  )}`;

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Cepillo de bambú (pack x4)', category: 'cuidado-personal', price_cents: 2890000, eco_score: 92, stock: 120, image_url: img('🪥', '#d9f99d', '#86efac'), description_html: '<p>Mango de <strong>bambú certificado FSC</strong> y cerdas libres de BPA.</p><ul><li>100% compostable</li><li>Empaque de cartón reciclado</li></ul>' },
  { id: 'p2', name: 'Botella térmica de acero 750 ml', category: 'hogar', price_cents: 8900000, eco_score: 88, stock: 45, image_url: img('🧴', '#bae6fd', '#7dd3fc'), description_html: '<p>Mantiene el frío 24 h y el calor 12 h. Reemplaza más de <b>300 botellas plásticas</b> al año.</p>' },
  { id: 'p3', name: 'Camiseta de algodón orgánico', category: 'moda', price_cents: 6500000, eco_score: 81, stock: 60, image_url: img('👕', '#fde68a', '#fdba74'), description_html: '<p>Algodón <em>GOTS</em> teñido con pigmentos de bajo impacto.</p>' },
  { id: 'p4', name: 'Bolsas de tela para mercado (x3)', category: 'hogar', price_cents: 3500000, eco_score: 95, stock: 200, image_url: img('🛍️', '#e9d5ff', '#c4b5fd'), description_html: '<p>Lavables y resistentes hasta 15 kg.</p>' },
  { id: 'p5', name: 'Café de origen campesino 500 g', category: 'alimentos', price_cents: 4200000, eco_score: 86, stock: 80, image_url: img('☕', '#fed7aa', '#d6a77a'), description_html: '<p>Comercio justo directo con productores del Huila.</p>' },
  { id: 'p6', name: 'Jabón sólido de avena', category: 'cuidado-personal', price_cents: 1800000, eco_score: 90, stock: 150, image_url: img('🧼', '#fbcfe8', '#f9a8d4'), description_html: '<p>Sin empaque plástico, ingredientes 100% naturales.</p>' },
  { id: 'p7', name: 'Kit de cubiertos reutilizables', category: 'hogar', price_cents: 3900000, eco_score: 89, stock: 70, image_url: img('🍴', '#ccfbf1', '#5eead4'), description_html: '<p>Acero inoxidable con estuche de lona.</p>' },
  { id: 'p8', name: 'Tenis de caucho reciclado', category: 'moda', price_cents: 21900000, eco_score: 78, stock: 25, image_url: img('👟', '#e7e5e4', '#a8a29e'), description_html: '<p>Suela fabricada con llantas recuperadas.</p>' },
];

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-1042', total_cents: 15800000, status: 'shipped', created_at: '2026-10-21T15:00:00Z', item_count: 3 },
  { id: 'ORD-1077', total_cents: 4200000, status: 'paid', created_at: '2026-10-28T10:30:00Z', item_count: 1 },
];

export const MOCK_SALES: SalesPoint[] = [
  ['2026-10-24', 820], ['2026-10-25', 1130], ['2026-10-26', 970], ['2026-10-27', 1460],
  ['2026-10-28', 1320], ['2026-10-29', 1780], ['2026-10-30', 1610],
].map(([day, k]) => ({ day: day as string, total_cents: (k as number) * 100000 }));
