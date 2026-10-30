\pset footer off
create temp table r (n serial, prueba text, rol text, resultado text);
\echo '=== ATAQUES CONTRA EL ESQUEMA ORIGINAL (ANTES) ==='
insert into r (prueba, rol, resultado) select * from tests.attack('A1 Anónimo lee PII de todos los perfiles', 'anon', null,
  $q$ select count(*) || ' perfiles; ej: ' || min(email) || ' / ' || min(phone) || ' / ' || min(address) from public.profiles $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A2 Alice se auto-asigna rol admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with u as (update public.profiles set role = 'admin' where id = auth.uid() returning role) select 'role=' || role from u $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A3 Alice cambia el precio de un producto a $1', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with u as (update public.products set price_cents = 100 returning price_cents) select 'price_cents=' || price_cents from u $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A4 Alice inserta pedido "pagado" por $1', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with i as (insert into public.orders (user_id, total_cents, status, item_count) values (auth.uid(), 100, 'paid', 5) returning status, total_cents) select status || ' total=' || total_cents from i $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A5 Alice lee pedidos de otros usuarios', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select count(*) || ' pedidos ajenos visibles' from public.orders where user_id <> auth.uid() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A6 Alice consulta el reporte de ventas admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ select count(*) || ' filas de ventas' from public.admin_sales_last_7_days() $q$);
insert into r (prueba, rol, resultado) select * from tests.attack('A7 Alice marca como enviado el pedido de Bob', 'authenticated', '11111111-1111-1111-1111-111111111111',
  $q$ with u as (update public.orders set status = 'shipped' where user_id <> auth.uid() returning id) select count(*) || ' pedidos modificados' from u $q$);
select prueba, rol, resultado from r order by n;
