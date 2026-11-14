import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiKey, FiLock, FiMail, FiShield, FiUser } from "react-icons/fi";
import { authOptions } from "@/lib/auth";
import { authProviderLabel } from "@/lib/session-display";
import Avatar from "@/components/Avatar";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signIn");
  const created = session.accountCreatedAt ? new Date(session.accountCreatedAt) : null;
  const createdLabel = created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString('es-PE', {day:'numeric',month:'long',year:'numeric', timeZone:'America/Lima'}) : null;
  return <div className="workspace">
    <Link href="/dashboard" className="back-link"><FiArrowLeft /> Volver al dashboard</Link>
    <div className="page-heading"><div><span className="section-label">MI CUENTA</span><h1>Tu perfil</h1><p>Tu información personal y los detalles de tu acceso actual.</p></div><span className="status-pill"><span /> Sesión activa</span></div>
    <div className="profile-layout">
      <section className="profile-identity"><div className="profile-cover" /><div className="profile-identity-body"><Avatar name={session.user.name} image={session.user.image} large /><h2>{session.user.name || 'Usuario'}</h2><p>{session.user.email || 'Correo no disponible'}</p><span className="profile-badge"><FiCheck /> Cuenta conectada</span><div className="profile-identity-footer"><FiShield /><span>Información de tu sesión actual</span></div></div></section>
      <section className="profile-details" aria-labelledby="profile-details-title"><div className="card-heading"><span className="card-icon"><FiUser /></span><div><h2 id="profile-details-title">Información de la cuenta</h2><p>Los datos disponibles de tu perfil.</p></div></div>
        <dl className="details-list"><div><dt><FiUser /> Nombre completo</dt><dd>{session.user.name || 'No disponible'}</dd></div><div><dt><FiMail /> Correo electrónico</dt><dd>{session.user.email || 'No disponible'}</dd></div><div><dt><FiKey /> Método de acceso</dt><dd>{authProviderLabel(session.authProvider)}</dd></div>{createdLabel && <div><dt><FiCheck /> Fecha de registro</dt><dd>{createdLabel}</dd></div>}<div><dt><FiShield /> Estado de sesión</dt><dd><span className="inline-status">Activa</span></dd></div></dl>
        <div className="profile-details-note"><FiLock /><p>Estos datos corresponden a la cuenta con la que accediste. Tu contraseña nunca se muestra.</p></div>
      </section>
    </div>
    <footer className="workspace-footer">MyAuthApp <span>Laboratorio 13 · Autenticación y seguridad</span></footer>
  </div>;
}
