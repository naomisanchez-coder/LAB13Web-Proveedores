"use client";
import { useState } from "react";
import Link from "next/link";
import { validateRegistration, type FieldErrors } from "@/lib/validation";

export default function RegisterPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const validation = validateRegistration(data);
    setErrors({}); setMessage("");
    if (!validation.ok) { setErrors(validation.errors); return; }
    setPending(true);
    try {
      const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      setMessage(result.message);
      if (response.ok) { setComplete(true); form.reset(); }
      else setErrors(result.errors ?? {});
    } catch { setMessage("No pudimos conectar. Inténtalo de nuevo."); }
    finally { setPending(false); }
  }
  return <div className="min-h-screen bg-gray-100 p-8"><div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
    <h1 className="text-2xl font-bold mb-6">Crear cuenta</h1>
    {message && <p role="status" className="mb-4">{message}</p>}
    {!complete && <form onSubmit={submit} noValidate className="space-y-4">
      {([['name','Nombre completo','text'],['email','Correo electrónico','email'],['password','Contraseña','password'],['confirmPassword','Confirmar contraseña','password']] as const).map(([name,label,type])=><div key={name}>
        <label htmlFor={name} className="block mb-1">{label}</label>
        <input id={name} name={name} type={type} autoComplete={name==='name'?'name':name==='email'?'email':'new-password'} required className="border rounded w-full p-2" aria-invalid={!!errors[name]} aria-describedby={errors[name]?`${name}-error`:undefined}/>
        {errors[name] && <p id={`${name}-error`} className="text-red-700 text-sm">{errors[name]}</p>}
      </div>)}
      <p className="text-sm text-gray-600">Mínimo 8 caracteres: mayúscula, minúscula y número. Máximo 72 bytes.</p>
      <button disabled={pending} className="w-full rounded bg-gray-700 text-white p-2 disabled:opacity-50">{pending?'Creando cuenta…':'Crear cuenta'}</button>
    </form>}
    <Link href="/signIn" className="block mt-6 underline">{complete?'Ir a iniciar sesión':'Volver al inicio de sesión'}</Link>
  </div></div>;
}
