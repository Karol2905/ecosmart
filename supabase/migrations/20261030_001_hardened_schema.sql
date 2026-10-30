-- =====================================================================
-- ✅ DESPUÉS — EcoMart: esquema endurecido (Hardening Supabase)
-- Ejecutar en Supabase > SQL Editor (o `supabase db push`).
--
-- Principios aplicados:
--   1. Deny-by-default: RLS habilitado y FORZADO; privilegios revocados y
--      re-otorgados columna a columna.
--   2. El cliente nunca decide precios, estados ni roles: create_order (RPC)
--      calcula todo en el servidor.
--   3. Datos personales separados (private_profiles) y visibles solo por su dueño.
--   4. Funciones SECURITY DEFINER con search_path vacío y verificación explícita.
-- =====================================================================

-- ---------- Tablas ----------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 80),
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

-- PII aislada en su propia tabla (minimización de datos, Ley 1581 / GDPR)
create table if not exists public.private_profiles (
  id       uuid primary key references public.profiles(id) on delete cascade,
  phone    text check (phone ~ '^\+?[0-9 ]{7,20}$'),
  address  text check (char_length(address) <= 200)
);

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 2 and 120),
  description_html text not null default '' check (char_length(description_html) <= 5000),
  price_cents      integer not null check (price_cents > 0),
  image_url        text not null default '' check (image_url = '' or image_url ~ '^https://'),
  category         text not null check (category in ('hogar', 'moda', 'alimentos', 'cuidado-personal')),
  eco_score        smallint not null check (eco_score between 0 and 100),
  stock            integer not null default 0 check (stock >= 0),
  is_active        boolean not null default true
);

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  total_cents  bigint not null check (total_cents > 0),
  status       text not null default 'pending' check (status in ('pending', 'paid', 'shipped')),
  item_count   integer not null check (item_count > 0),
  created_at   timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid not null references public.products(id),
  quantity          integer not null check (quantity between 1 and 20),
  unit_price_cents  integer not null check (unit_price_cents > 0),
  primary key (order_id, product_id)
);

-- ---------- Privilegios: deny by default -----------------------------
revoke all on public.profiles, public.private_profiles, public.products, public.orders, public.order_items
  from anon, authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;       -- filtrado por la política de admin
grant select (id, full_name, role) on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;           -- la columna role NO es actualizable
grant select, insert, update on public.private_profiles to authenticated;
grant select on public.orders, public.order_items to authenticated;     -- sin insert/update/delete directo

-- ---------- RLS habilitado y forzado ----------------------------------
alter table public.profiles         enable row level security;
alter table public.private_profiles enable row level security;
alter table public.products         enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.profiles         force row level security;
alter table public.private_profiles force row level security;
alter table public.products         force row level security;
alter table public.orders           force row level security;
alter table public.order_items      force row level security;

-- ---------- Helper: ¿el usuario actual es admin? ----------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- ---------- Políticas -------------------------------------------------
-- profiles: cada usuario ve y edita solo su fila
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- (sin política INSERT: los perfiles los crea el trigger handle_new_user)

-- private_profiles: solo su dueño
create policy private_profiles_owner on public.private_profiles
  for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- products: lectura pública de productos activos; escritura solo admin
-- Políticas separadas por rol: anon no necesita (ni tiene) permiso para ejecutar is_admin().
create policy products_read_active_anon on public.products
  for select to anon using (is_active);
create policy products_read_authenticated on public.products
  for select to authenticated using (is_active or (select public.is_admin()));
create policy products_admin_insert on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy products_admin_update on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy products_admin_delete on public.products
  for delete to authenticated using ((select public.is_admin()));

-- orders / order_items: lectura solo del propietario (o admin)
create policy orders_select_own on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy order_items_select_own on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin())))
  );

-- ---------- Trigger: crear perfil al registrarse ----------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '[<>"]', '', 'g'), 80),
    'customer'   -- SIEMPRE customer: se ignora cualquier "role" enviado en la metadata
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RPC: crear pedido con precios del servidor ----------------
create or replace function public.create_order(p_items jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user   uuid := (select auth.uid());
  v_order  uuid;
  v_total  bigint := 0;
  v_count  integer := 0;
  v_item   record;
  v_price  integer;
  v_stock  integer;
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'invalid items' using errcode = '22023';
  end if;

  insert into public.orders (user_id, total_cents, item_count, status)
  values (v_user, 1, 1, 'pending')            -- valores provisionales, se recalculan abajo
  returning id into v_order;

  for v_item in
    select (e ->> 'product_id')::uuid as product_id, (e ->> 'quantity')::int as quantity
    from jsonb_array_elements(p_items) e
  loop
    if v_item.quantity is null or v_item.quantity not between 1 and 20 then
      raise exception 'invalid quantity' using errcode = '22023';
    end if;

    -- Precio y stock leídos (y bloqueados) desde la BD: el cliente no los controla
    select p.price_cents, p.stock into v_price, v_stock
    from public.products p
    where p.id = v_item.product_id and p.is_active
    for update;

    if not found then raise exception 'product not available' using errcode = 'P0002'; end if;
    if v_stock < v_item.quantity then raise exception 'insufficient stock' using errcode = 'P0001'; end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price_cents)
    values (v_order, v_item.product_id, v_item.quantity, v_price);

    update public.products set stock = stock - v_item.quantity where id = v_item.product_id;
    v_total := v_total + v_price::bigint * v_item.quantity;
    v_count := v_count + v_item.quantity;
  end loop;

  update public.orders set total_cents = v_total, item_count = v_count where id = v_order;
  return v_order;
end;
$$;

-- ---------- RPC: reporte de ventas (solo admin) -----------------------
create or replace function public.admin_sales_last_7_days()
returns table (day text, total_cents bigint)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select to_char(o.created_at::date, 'YYYY-MM-DD'), sum(o.total_cents)::bigint
    from public.orders o
    where o.created_at > now() - interval '7 days'
    group by 1 order by 1;
end;
$$;

-- ---------- Permisos de ejecución -------------------------------------
revoke execute on function public.create_order(jsonb), public.admin_sales_last_7_days(),
  public.is_admin(), public.handle_new_user() from public, anon;
grant execute on function public.create_order(jsonb), public.admin_sales_last_7_days(), public.is_admin()
  to authenticated;
