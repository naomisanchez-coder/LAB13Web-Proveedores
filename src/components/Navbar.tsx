"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiCommand, FiGrid, FiLock, FiMenu, FiUser, FiX } from "react-icons/fi";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/LogoutButton";

type NavbarUser = { name?: string | null; image?: string | null };
export default function Navbar({ user }: { user?: NavbarUser }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><nav className="navbar" aria-label="Navegación principal">
    <Link href="/" className="brand" onClick={()=>setOpen(false)}><span className="brand-mark"><FiCommand /></span><span>MyAuthApp<span className="brand-subtitle">TU ESPACIO PERSONAL</span></span></Link>
    {user ? <>
      <button className="mobile-toggle" aria-label={open?'Cerrar menú':'Abrir menú'} aria-expanded={open} aria-controls="main-menu" onClick={()=>setOpen(!open)}>{open?<FiX />:<FiMenu />}</button>
      <div className="nav-content" id="main-menu" data-open={open}>
        <div className="nav-links">
          <Link href="/dashboard" className={`nav-link${path==='/dashboard'?' active':''}`} aria-current={path==='/dashboard'?'page':undefined} onClick={()=>setOpen(false)}><FiGrid />Dashboard</Link>
          <Link href="/profile" className={`nav-link${path==='/profile'?' active':''}`} aria-current={path==='/profile'?'page':undefined} onClick={()=>setOpen(false)}><FiUser />Mi perfil</Link>
        </div>
        <div className="nav-account"><span className="nav-name">{user.name || 'Mi cuenta'}</span><Avatar name={user.name} image={user.image} /><span className="nav-separator" /><LogoutButton /></div>
      </div>
    </> : <span className="public-nav-caption"><FiLock /> Acceso seguro <span>· Laboratorio 13</span></span>}
  </nav></header>;
}
