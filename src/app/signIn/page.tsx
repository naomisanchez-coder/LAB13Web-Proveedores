"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { normalizeEmail, validEmail } from "@/lib/validation";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    if (!validEmail(email) || !password) { setError("Introduce un correo válido y tu contraseña."); return; }
    setPending(true);
    try {
      const result = await signIn("credentials", { email, password, callbackUrl: "/dashboard", redirect: false });
      if (result?.ok && !result.error) window.location.assign("/dashboard");
      else setError("No pudimos iniciar sesión. Revisa tus datos o inténtalo más tarde.");
    } catch { setError("No pudimos conectar. Inténtalo de nuevo."); }
    finally { setPending(false); }
  }
  return <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6"><div className="bg-white p-8 rounded-lg shadow-md w-96">
    <h1 className="text-2xl text-gray-800 font-bold mb-6 text-center">Sign In</h1>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block">Correo electrónico<input name="email" type="email" autoComplete="email" required className="border p-2 rounded w-full" /></label>
      <label className="block">Contraseña<input name="password" type="password" autoComplete="current-password" required className="border p-2 rounded w-full" /></label>
      <button disabled={pending} className="w-full bg-gray-700 text-white p-2 rounded disabled:opacity-50">{pending?'Iniciando sesión…':'Iniciar sesión'}</button>
    </form>
    <button onClick={()=>signIn('google',{callbackUrl:'/dashboard'})} className="w-full mt-6 bg-gray-500 text-white py-2 px-4 rounded hover:bg-black transition flex items-center justify-center gap-2"><FaGoogle />Continue with Google</button>
    <Link href="/register" className="block mt-6 text-center underline">Crear una cuenta</Link>
  </div></div>;
}
