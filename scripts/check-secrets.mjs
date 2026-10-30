#!/usr/bin/env node
/**
 * HARDENING: bloquea el build/CI si una clave privilegiada de Supabase termina en
 * el código fuente, en un .env con prefijo VITE_ o en el bundle compilado (dist/).
 *
 * Detecta:
 *   - JWT cuyo payload tenga "role":"service_role"
 *   - Claves nuevas con prefijo sb_secret_
 *   - Variables VITE_* cuyo nombre sugiera un secreto (SERVICE_ROLE, SECRET, PRIVATE)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src', 'dist', 'index.html', '.env', '.env.local', '.env.production', '.env.production.local'];
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
const SB_SECRET = /sb_secret_[A-Za-z0-9_-]{10,}/g;
const BAD_VITE_NAME = /^\s*VITE_[A-Z0-9_]*(SERVICE_ROLE|SECRET|PRIVATE)[A-Z0-9_]*\s*=/m;

const problems = [];

function walk(p) {
  if (!existsSync(p)) return;
  const st = statSync(p);
  if (st.isDirectory()) return readdirSync(p).forEach((f) => walk(join(p, f)));
  if (st.size > 5_000_000) return;
  const text = readFileSync(p, 'utf8');
  for (const m of text.matchAll(JWT)) {
    try {
      const payload = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8'));
      if (payload.role && payload.role !== 'anon') problems.push(`${p}: JWT con rol "${payload.role}"`);
    } catch { /* no es un JWT válido */ }
  }
  if (SB_SECRET.test(text)) problems.push(`${p}: clave sb_secret_ detectada`);
  if (p.includes('.env') && BAD_VITE_NAME.test(text)) problems.push(`${p}: variable VITE_ con nombre de secreto (se expondría al navegador)`);
}

ROOTS.forEach(walk);

if (problems.length) {
  console.error('\n⛔ check-secrets: se detectaron secretos expuestos al cliente:\n  - ' + problems.join('\n  - '));
  console.error('\nMueve la service_role a una Edge Function / backend. Build abortado.\n');
  process.exit(1);
}
console.log('✅ check-secrets: no se detectaron claves privilegiadas en src/, dist/ ni .env*');
