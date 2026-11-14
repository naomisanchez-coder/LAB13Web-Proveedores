"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";
export default function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function logout() {
    setPending(true); setError(false);
    try { await signOut({ callbackUrl: "/signIn" }); }
    catch { setPending(false); setError(true); }
  }
  return <div className="logout-wrap"><button onClick={logout} className="nav-logout" disabled={pending}><FiLogOut />{pending?'Cerrando sesión…':'Cerrar sesión'}</button>{error && <span role="alert" className="field-error">No se pudo cerrar. Inténtalo de nuevo.</span>}</div>;
}
