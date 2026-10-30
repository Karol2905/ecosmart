#!/usr/bin/env bash
# Levanta un PostgreSQL temporal, simula Supabase y ejecuta los ataques contra
# el esquema ANTES y DESPUÉS. Requiere PostgreSQL 15+ instalado localmente.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
TMP="$(mktemp -d)"; PORT=55432
trap '"$PGBIN/pg_ctl" -D "$TMP/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT

RUN_AS=""; if [ "$(id -u)" = "0" ]; then chown -R postgres "$TMP"; RUN_AS="runuser -u postgres --"; fi
$RUN_AS "$PGBIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
$RUN_AS "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" start >/dev/null

run() { # $1=db  $2..=archivos
  local db=$1; shift
  psql -h "$TMP" -p $PORT -U postgres -qtAX -c "create database $db" >/dev/null
  for f in "$@"; do psql -h "$TMP" -p $PORT -U postgres -d "$db" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null; done
}
run antes   "$ROOT/supabase/tests/00_supabase_stub.sql" "$ROOT/audit/antes/rls.before.sql" "$ROOT/supabase/tests/10_seed_before.sql"
run despues "$ROOT/supabase/tests/00_supabase_stub.sql" "$ROOT"/supabase/migrations/*.sql "$ROOT/supabase/tests/10_seed_after.sql"

psql -h "$TMP" -p $PORT -U postgres -q -d antes   -f "$ROOT/supabase/tests/20_attacks_before.sql"
psql -h "$TMP" -p $PORT -U postgres -q -d despues -f "$ROOT/supabase/tests/20_attacks_after.sql"
