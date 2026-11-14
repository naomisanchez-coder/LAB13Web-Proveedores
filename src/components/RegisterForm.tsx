"use client";
import { useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiArrowRight, FiCheckCircle, FiMail, FiUser } from "react-icons/fi";
import { validateRegistration, type FieldErrors } from "@/lib/validation";
import { FormField, PasswordField } from "@/components/auth/FormFields";

export default function RegisterForm() {
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
    if (!validation.ok) { setErrors(validation.errors); setMessage("Revisa los campos indicados para continuar."); return; }
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
  if (complete) return <div className="registration-success" role="status">
    <span className="success-symbol"><FiCheckCircle /></span>
    <h3>Tu solicitud está procesada</h3><p>{message}</p>
    <Link href="/signIn" className="button button-primary button-full">Ir a iniciar sesión <FiArrowRight /></Link>
  </div>;
  return <>
    {message && <div role="alert" className="alert alert-error"><FiAlertCircle /><span>{message}</span></div>}
    <form onSubmit={submit} noValidate aria-busy={pending}>
      <fieldset disabled={pending} className="form-stack">
        <FormField label="Nombre completo" name="name" autoComplete="name" placeholder="Tu nombre y apellidos" maxLength={100} required error={errors.name} icon={<FiUser />} />
        <FormField label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="nombre@ejemplo.com" maxLength={254} required error={errors.email} icon={<FiMail />} />
        <PasswordField label="Contraseña" name="password" autoComplete="new-password" placeholder="Crea una contraseña segura" required error={errors.password} hint="Mínimo 8 caracteres, con mayúscula, minúscula y número. Máximo 72 bytes." />
        <PasswordField label="Confirmar contraseña" name="confirmPassword" autoComplete="new-password" placeholder="Repite tu contraseña" required error={errors.confirmPassword} />
        <button type="submit" className="button button-primary button-full">{pending?'Creando cuenta…':<>Crear cuenta <FiArrowRight /></>}</button>
      </fieldset>
    </form>
    <p className="form-switch">¿Ya tienes una cuenta? <Link href="/signIn">Iniciar sesión <FiArrowRight /></Link></p>
  </>;
}
