-- Usuarios (el trigger handle_new_user crea los perfiles). Alice intenta auto-asignarse admin vía metadata.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@mail.com',   '{"full_name":"Alice <script>","role":"admin"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@mail.com',     '{"full_name":"Bob"}'),
  ('33333333-3333-3333-3333-333333333333', 'carol@ecomart.co', '{"full_name":"Carol"}');
update public.profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333'; -- vía service_role/dashboard
insert into public.private_profiles (id, phone, address) values
  ('11111111-1111-1111-1111-111111111111', '+57 3001112233', 'Cra 7 #12-34, Chía'),
  ('22222222-2222-2222-2222-222222222222', '+57 3104445566', 'Cl 100 #15-20, Bogotá');
insert into public.products (id, name, price_cents, category, eco_score, stock) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Botella térmica', 8900000, 'hogar', 88, 45);
insert into public.orders (user_id, total_cents, status, item_count) values
  ('22222222-2222-2222-2222-222222222222', 17800000, 'paid', 2);
