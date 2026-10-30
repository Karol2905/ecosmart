import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkPassword, cleanText, EMAIL_RE } from '../lib/security';

/**
 * Formulario de registro REFACTORIZADO tras la auditoría.
 * Ver la versión vulnerable en audit/antes/RegisterForm.before.tsx.
 *
 *  ✔ Sin dangerouslySetInnerHTML: el nombre se renderiza como texto (React escapa).
 *  ✔ Política de contraseñas fuerte (también configurada en Supabase Auth).
 *  ✔ Sin console.log de credenciales, sin guardar password/sesión en localStorage.
 *  ✔ Mensaje de éxito genérico: no revela si el correo ya existía (anti-enumeración).
 *  ✔ No se envía "role" desde el cliente: lo asigna el trigger en Postgres.
 *  ✔ Doble envío bloqueado + rate limit del lado de Supabase Auth.
 */
interface Errors {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

const STRENGTH = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'] as const;
const BAR = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-600'] as const;

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const id = useId();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const pw = checkPassword(password, email);

  function validate(): Errors {
    const e: Errors = {};
    const name = cleanText(fullName, 80);
    if (name.length < 2) e.fullName = 'Ingresa tu nombre.';
    else if (!/^[\p{L}\p{M}' .-]+$/u.test(name)) e.fullName = 'Solo letras, espacios, apóstrofes y guiones.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Ingresa un correo válido.';
    if (!pw.ok) e.password = `La contraseña no cumple: ${pw.issues.join(', ').toLowerCase()}.`;
    if (confirm !== password) e.confirm = 'Las contraseñas no coinciden.';
    if (!accept) e.form = 'Debes aceptar la política de tratamiento de datos.';
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (sending) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setSending(true);
    try {
      await signUp(cleanText(fullName, 80), email.trim().toLowerCase(), password);
      setPassword('');
      setConfirm('');
      setDone(true);
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'No pudimos completar el registro.' });
    } finally {
      setSending(false);
    }
  }

  if (done)
    return (
      <div role="status" className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden="true">📬</p>
        {/* Texto plano: React escapa automáticamente cualquier HTML del nombre */}
        <h1 className="mt-3 text-xl font-bold">Revisa tu correo, {cleanText(fullName, 80)}</h1>
        <p className="mt-2 text-sm text-stone-600">
          Si la dirección es válida, recibirás un enlace para confirmar tu cuenta.
        </p>
        <button type="button" onClick={() => navigate('/login')} className="mt-6 font-semibold text-emerald-700 underline">
          Ir a ingresar
        </button>
      </div>
    );

  const input = (bad?: string) =>
    `mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
      bad ? 'border-red-400 focus:ring-red-500/30' : 'border-stone-300 focus:border-emerald-500 focus:ring-emerald-500/30'
    }`;
  const err = (key: keyof Errors) =>
    errors[key] ? (
      <p id={`${id}-${key}-err`} className="mt-1 text-xs text-red-600">{errors[key]}</p>
    ) : null;
  const a11y = (key: keyof Errors) => ({
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${id}-${key}-err` : undefined,
  });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-stone-600">
        ¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-emerald-700 underline">Ingresa</Link>
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium">
          Nombre completo
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} autoComplete="name" className={input(errors.fullName)} {...a11y('fullName')} />
        </label>
        {err('fullName')}
        <label className="block text-sm font-medium">
          Correo electrónico
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="email" className={input(errors.email)} {...a11y('email')} />
        </label>
        {err('email')}
        <label className="block text-sm font-medium">
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} autoComplete="new-password" className={input(errors.password)} {...a11y('password')} />
        </label>
        {password && (
          <div aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < pw.score ? BAR[pw.score] : 'bg-stone-200'}`} />
              ))}
            </div>
            <p className="mt-1 text-xs text-stone-600">Seguridad: {STRENGTH[pw.score]}</p>
          </div>
        )}
        {err('password')}
        <label className="block text-sm font-medium">
          Confirmar contraseña
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={72} autoComplete="new-password" className={input(errors.confirm)} {...a11y('confirm')} />
        </label>
        {err('confirm')}
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1" />
          Acepto la política de tratamiento de datos personales (Ley 1581 de 2012).
        </label>
        {errors.form && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{errors.form}</p>}
        <button type="submit" disabled={sending} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          {sending ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
