import { FiArrowUpRight, FiCheck, FiLayers, FiLock, FiShield } from "react-icons/fi";

export default function AuthShell({ children, register = false }: { children: React.ReactNode; register?: boolean }) {
  return <div className="auth-layout">
    <aside className="auth-story" aria-label="Acerca de la aplicación">
      <div className="eyebrow"><FiLayers /> LABORATORIO 13 · TECSUP</div>
      <div className="story-main">
        <span className="story-tag"><span className="status-dot" /> Un espacio, distintas formas de entrar</span>
        <h1>Tu espacio.<br /><span>Tu forma de acceder.</span></h1>
        <p>Una experiencia de acceso sencilla, con tu información y tu sesión siempre a mano.</p>
        <div className="story-features">
          <div><span className="story-icon"><FiShield /></span><span><strong>Acceso protegido</strong><small>Solo tú puedes ver tu espacio personal.</small></span></div>
          <div><span className="story-icon"><FiLock /></span><span><strong>Elige cómo entrar</strong><small>Tu correo o una cuenta que ya utilizas.</small></span></div>
        </div>
      </div>
      <div className="story-footer"><span><FiCheck /> Diseñado para un acceso simple</span><FiArrowUpRight /></div>
    </aside>
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-card">
        <span className="section-label">{register ? 'EMPIEZA AQUÍ' : 'TU ESPACIO PERSONAL'}</span>
        <h2 id="auth-title">{register ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h2>
        <p className="auth-intro">{register ? 'Completa tus datos para acceder con tu correo y contraseña.' : 'Accede a tu dashboard con el método que prefieras.'}</p>
        {children}
        <p className="auth-footnote"><FiLock /> Tu contraseña y tu sesión se gestionan de forma segura.</p>
      </div>
      <p className="academic-caption">Desarrollo de Aplicaciones Web Avanzado · Autenticación y seguridad</p>
    </section>
  </div>;
}
