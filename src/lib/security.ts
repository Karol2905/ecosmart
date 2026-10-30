/**
 * Utilidades de seguridad del cliente (Hallazgo #3: XSS y open redirect).
 * IMPORTANTE: la validación del cliente es UX; la autoridad final es Supabase
 * (Auth + CHECK constraints + RLS).
 */

/** Evita open redirect: solo rutas internas relativas ("/cuenta"), nunca "//evil.com" ni "https://…". */
export function safeRedirect(target: string | null, fallback = '/'): string {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;
  try {
    const u = new URL(target, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search : fallback;
  } catch {
    return fallback;
  }
}

export interface PasswordCheck {
  readonly ok: boolean;
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly issues: readonly string[];
}

export function checkPassword(pw: string, email = ''): PasswordCheck {
  const issues: string[] = [];
  if (pw.length < 10) issues.push('Mínimo 10 caracteres');
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) issues.push('Mayúsculas y minúsculas');
  if (!/\d/.test(pw)) issues.push('Al menos un número');
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push('Al menos un símbolo');
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  if (local.length >= 3 && pw.toLowerCase().includes(local)) issues.push('No debe contener tu correo');
  const score = Math.max(0, 4 - issues.length) as PasswordCheck['score'];
  return { ok: issues.length === 0, score, issues };
}

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/** Normaliza texto libre: quita caracteres de control y limita longitud. Se renderiza SIEMPRE como texto. */
export const cleanText = (value: string, max: number): string =>
  value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
