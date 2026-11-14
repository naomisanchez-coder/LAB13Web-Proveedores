"use client";
import Image from "next/image";
import { useState } from "react";

export default function Avatar({ name, image, large = false }: { name?: string | null; image?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  let safeImage = false;
  try { const url = new URL(image ?? ""); safeImage = url.protocol === "https:" && ['lh3.googleusercontent.com','avatars.githubusercontent.com'].includes(url.hostname); } catch { /* avatar de iniciales */ }
  const initials = (name ?? "Usuario").trim().split(/\s+/).slice(0, 2).map(part=>part[0]).join('').toUpperCase();
  return <span className={`avatar${large?' avatar-large':''}`}>
    {safeImage && image && !failed ? <Image src={image} alt={`Foto de ${name || 'perfil'}`} width={large?96:40} height={large?96:40} onError={()=>setFailed(true)} /> : <span aria-label={`Avatar de ${name || 'usuario'}`}>{initials || 'U'}</span>}
  </span>;
}
