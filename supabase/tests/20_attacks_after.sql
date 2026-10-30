\pset footer off
create temp table r (n serial, prueba text, rol text, resultado text);
\echo '=== ATAQUES CONTRA EL ESQUEMA ENDURECIDO (DESPUÉS) ==='
insert into r (prueba, rol, resultado) select * from tests.attack('A1 Anónimo lee PII de todos los perfiles', 'anon', null,
  $q$ select count(*) || ' perfiles' from public.profiles $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A1b Alice lee PII de Bob', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select count(*) || ' filas privadas ajenas' from public.private_profiles where id <> auth.uid() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A2 Alice se auto-asigna rol admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with u as (update public.profiles set role = 'admin' where id = auth.uid() returning role) select 'role=' || role from u $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A2b Rol de Alice tras enviar role=admin en metadata', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select 'role=' || role || ', nombre="' || full_name || '"' from public.profiles where id = auth.uid() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A3 Alice cambia el precio de un producto a $1', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with u as (update public.products set price_cents = 100 returning price_cents) select count(*) || ' filas modificadas' from u $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A4 Alice inserta pedido "pagado" por $1', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with i as (insert into public.orders (user_id, total_cents, status, item_count) values (auth.uid(), 100, 'paid', 5) returning status) select status from i $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A5 Alice lee pedidos de otros usuarios', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select count(*) || ' pedidos ajenos visibles' from public.orders where user_id <> auth.uid() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A6 Alice consulta el reporte de ventas admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select count(*) || ' filas de ventas' from public.admin_sales_last_7_days() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A7 Alice marca como enviado el pedido de Bob', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with u as (update public.orders set status = 'shipped' where user_id <> auth.uid() returning id) select count(*) || ' pedidos modificados' from u $q$);
select prueba, rol, resultado from r order by n;
truncate r;

\echo '=== FLUJOS LEGÍTIMOS (deben funcionar) ==='
insert into r (prueba, rol, resultado) select * from tests.attack('L1 Anónimo ve el catálogo', 'anon', null,
  $q$ select count(*) || ' productos' from public.products $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('L2 Alice crea pedido vía RPC enviando "price_cents":1 (ignorado)', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select 'pedido ' || public.create_order('[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":2}]') $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('L2b Total cobrado = 2 × precio real (8.900.000)', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select 'total_cents=' || total_cents || ' status=' || status || ' items=' || item_count from public.orders where user_id = auth.uid() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('L3 Alice ve solo sus pedidos', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select count(*) || ' pedidos propios' from public.orders $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('L4 Alice actualiza su nombre', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with u as (update public.profiles set full_name = 'Alice G.' where id = auth.uid() returning full_name) select full_name from u $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('L5 Carol (admin) consulta reporte de ventas', 'authenticated', '33333333-3333-3333-3333-333333333333',
  $q$ select count(*) || ' filas de ventas' from public.admin_sales_last_7_days() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('L6 Carol (admin) actualiza un precio', 'authenticated', '33333333-3333-3333-3333-333333333333',
  $q$ with u as (update public.products set price_cents = 8500000 returning price_cents) select 'price_cents=' || price_cents from u $q$);
select prueba, rol, resultado from r order by n;
