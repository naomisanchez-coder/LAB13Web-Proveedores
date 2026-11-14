import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiKey, FiLock, FiMail, FiShield, FiUser } from "react-icons/fi";
import { authOptions } from "@/lib/auth";
import { authProviderLabel } from "@/lib/session-display";
import Avatar from "@/components/Avatar";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signIn");
  const name = session.user.name || 'Usuario';
  return <div className="workspace">
    <div className="page-heading"><div><span className="section-label">VISTA GENERAL</span><h1>Hola, {name.split(' ')[0]}<span className="greeting-dot">.</span></h1><p>Este es tu espacio. Aquí encontrarás la información de tu cuenta y tu acceso.</p></div><span className="status-pill"><span /> Sesión activa</span></div>
    <section className="welcome-card" aria-label="Bienvenida">
      <div><span className="welcome-eyebrow"><FiShield /> TU ACCESO PERSONAL</span><h2>Todo empieza con<br />una sesión segura.</h2><p>Tu cuenta está conectada. Consulta tus datos de perfil y mantén el control de tu acceso.</p><Link href="/profile" className="button button-primary">Ver mi perfil <FiArrowRight /></Link></div>
      <div className="welcome-identity"><span className="identity-decoration"><FiCheck /></span><Avatar name={name} image={session.user.image} large /><strong>{name}</strong><span>{session.user.email || 'Correo no disponible'}</span><small><FiLock /> Espacio privado</small></div>
    </section>
    <section className="info-grid" aria-label="Información de sesión">
      <article className="info-card"><span className="card-icon green"><FiShield /></span><p>Estado de la sesión</p><h3>Activa y protegida</h3><small>Tu acceso fue verificado en el servidor.</small></article>
      <article className="info-card"><span className="card-icon"><FiKey /></span><p>Método de acceso</p><h3>{authProviderLabel(session.authProvider)}</h3><small>{session.authProvider?'El método utilizado en este inicio de sesión.':'Vuelve a iniciar sesión para actualizar este dato.'}</small></article>
      <article className="info-card"><span className="card-icon blue"><FiMail /></span><p>Correo de la cuenta</p><h3 className="account-email">{session.user.email || 'No disponible'}</h3><small>Información asociada a tu sesión actual.</small></article>
    </section>
    <section className="dashboard-bottom"><article className="profile-shortcut"><span className="card-icon"><FiUser /></span><div><h3>Tu perfil, en un solo lugar</h3><p>Revisa tu nombre, correo y la información disponible de tu cuenta.</p></div><Link href="/profile" className="arrow-link" aria-label="Abrir mi perfil"><FiArrowRight /></Link></article><aside className="security-note"><FiLock /><div><strong>Cuando termines, cierra tu sesión</strong><p>Especialmente si estás utilizando un equipo compartido. Encontrarás la opción en el menú superior.</p></div></aside></section>
    <footer className="workspace-footer">MyAuthApp <span>Laboratorio 13 · Autenticación y seguridad</span></footer>
  </div>;
}
