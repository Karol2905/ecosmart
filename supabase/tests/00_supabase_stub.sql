-- Simula lo mínimo de Supabase para probar RLS en un PostgreSQL local:
-- roles anon/authenticated/service_role, esquema auth, auth.uid() y los
-- privilegios por defecto que Supabase otorga en el esquema public.
create extension if not exists pgcrypto;
do $$ begin
  create role anon nologin;          exception when duplicate_object then null; end $$;
do $$ begin
  create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin
  create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant references on auth.users to anon, authenticated;
-- Igual que Supabase: todo objeto nuevo en public queda con GRANT ALL para estos roles.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- Ejecuta una sentencia como un rol/usuario concreto y reporta si se ejecutó o fue bloqueada.
create schema if not exists tests;
create or replace function tests.attack(p_name text, p_role text, p_uid uuid, p_sql text)
returns table (prueba text, rol text, resultado text)
language plpgsql as $$
declare v text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  perform set_config('request.jwt.claim.role', p_role, true);
  execute format('set local role %I', p_role);
  begin
    execute p_sql into v;
    resultado := 'EJECUTADO → ' || coalesce(v, '(sin resultado)');
  exception when others then
    resultado := 'BLOQUEADO → ' || sqlerrm;
  end;
  execute 'reset role';
  prueba := p_name; rol := p_role;
  return next;
end $$;
