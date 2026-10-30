-- =====================================================================
-- ❌ ANTES — Esquema y políticas RLS originales de EcoMart (enviadas a la IA)
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  address text,
  role text default 'customer'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description_html text,
  price_cents int,
  image_url text,
  category text,
  eco_score int,
  stock int,
  is_active boolean default true
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  total_cents int,
  status text default 'pending',
  items jsonb,
  item_count int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- [R1] Cualquiera (incluso anónimo) lee TODOS los perfiles: email, teléfono, dirección.
create policy "Perfiles públicos" on public.profiles for select using (true);

-- [R2] El usuario puede actualizar su perfil… incluida la columna role → se vuelve admin.
create policy "Editar perfil" on public.profiles for update using (auth.uid() = id);

-- [R3] Insertar perfil sin restricción: se puede crear un perfil para otro id.
create policy "Crear perfil" on public.profiles for insert with check (true);

-- [R4] Productos: cualquier autenticado puede modificar precios.
create policy "Productos lectura" on public.products for select using (true);
create policy "Productos escritura" on public.products for all to authenticated using (true);

-- [R5] Pedidos: lectura global y escritura con datos (precio, estado, user_id) del cliente.
create policy "Ver pedidos" on public.orders for select using (auth.role() = 'authenticated');
create policy "Crear pedidos" on public.orders for insert with check (true);
create policy "Actualizar pedidos" on public.orders for update using (true);

-- [R6] Función de reporte SECURITY DEFINER sin validar rol y sin search_path fijo.
create function public.admin_sales_last_7_days()
returns table(day text, total_cents bigint)
language sql security definer as $$
  select to_char(created_at::date, 'YYYY-MM-DD'), sum(total_cents)::bigint
  from public.orders where created_at > now() - interval '7 days'
  group by 1 order by 1;
$$;
