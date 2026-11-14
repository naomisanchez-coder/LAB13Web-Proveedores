"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { FiAlertCircle, FiArrowRight, FiMail } from "react-icons/fi";
import { normalizeEmail, validEmail } from "@/lib/validation";
import { FormField, PasswordField } from "@/components/auth/FormFields";

export default function LoginForm({ githubEnabled, initialError = "" }: { githubEnabled: boolean; initialError?: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(initialError);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    if (!validEmail(email) || !password) { setError("Introduce un correo válido y tu contraseña."); return; }
    setPending("credentials");
    try {
      const result = await signIn("credentials", { email, password, callbackUrl: "/dashboard", redirect: false });
      if (result?.ok && !result.error) window.location.assign("/dashboard");
      else setError("No pudimos iniciar sesión. Revisa tus datos o inténtalo más tarde.");
    } catch { setError("No pudimos conectar. Inténtalo de nuevo."); }
    finally { setPending(null); }
  }
  async function oauth(provider: "google" | "github") {
    setError(""); setPending(provider);
    try { await signIn(provider, { callbackUrl: "/dashboard" }); }
    catch { setError("No pudimos abrir este método de acceso. Inténtalo de nuevo."); setPending(null); }
  }
  return <>
    {error && <div role="alert" className="alert alert-error"><FiAlertCircle /><span>{error}</span></div>}
    <form onSubmit={submit} noValidate aria-busy={pending === 'credentials'}>
      <fieldset disabled={!!pending} className="form-stack">
        <FormField label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="nombre@ejemplo.com" maxLength={254} required icon={<FiMail />} />
        <PasswordField label="Contraseña" name="password" autoComplete="current-password" placeholder="Tu contraseña" required />
        <button className="button button-primary button-full" type="submit">{pending==='credentials'?'Iniciando sesión…':<>Iniciar sesión <FiArrowRight /></>}</button>
      </fieldset>
    </form>
    <div className="form-divider"><span>o continúa con</span></div>
    <div className="social-buttons">
      <button disabled={!!pending} className="button button-social" onClick={()=>oauth('google')}><FaGoogle className="google-icon" />{pending==='google'?'Conectando…':'Google'}</button>
      <button disabled={!!pending || !githubEnabled} className="button button-social" onClick={()=>oauth('github')} aria-describedby={!githubEnabled?'github-status':undefined}><FaGithub />{pending==='github'?'Conectando…':'GitHub'}</button>
    </div>
    {!githubEnabled && <p className="field-hint text-center" id="github-status">El acceso con GitHub aún no está habilitado.</p>}
    <p className="form-switch">¿Aún no tienes una cuenta? <Link href="/register">Crear cuenta <FiArrowRight /></Link></p>
  </>;
}
