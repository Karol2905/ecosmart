export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description_html: string;
  readonly price_cents: number;
  readonly image_url: string;
  readonly category: 'hogar' | 'moda' | 'alimentos' | 'cuidado-personal';
  readonly eco_score: number;
  readonly stock: number;
}

export interface Profile {
  readonly id: string;
  readonly full_name: string;
  readonly role: 'customer' | 'admin';
}

export interface OrderItemInput {
  readonly product_id: string;
  readonly quantity: number;
}

export interface Order {
  readonly id: string;
  readonly total_cents: number;
  readonly status: 'pending' | 'paid' | 'shipped';
  readonly created_at: string;
  readonly item_count: number;
}

export interface SalesPoint {
  readonly day: string;
  readonly total_cents: number;
}
