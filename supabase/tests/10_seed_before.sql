insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@mail.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@mail.com'),
  ('33333333-3333-3333-3333-333333333333', 'carol@ecomart.co');
insert into public.profiles (id, full_name, email, phone, address, role) values
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'alice@mail.com', '+57 3001112233', 'Cra 7 #12-34, Chía', 'customer'),
  ('22222222-2222-2222-2222-222222222222', 'Bob',   'bob@mail.com',   '+57 3104445566', 'Cl 100 #15-20, Bogotá', 'customer'),
  ('33333333-3333-3333-3333-333333333333', 'Carol', 'carol@ecomart.co', null, null, 'admin');
insert into public.products (id, name, price_cents, category, eco_score, stock) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Botella térmica', 8900000, 'hogar', 88, 45);
insert into public.orders (user_id, total_cents, status, item_count) values
  ('22222222-2222-2222-2222-222222222222', 17800000, 'paid', 2);
