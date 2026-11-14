import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Provider from "@/components/SessionProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = { title: "MyAuthApp · Laboratorio 13", description: "Mi espacio personal. Autenticación y seguridad con NextAuth.js." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  return <html lang="es"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <a href="#main-content" className="skip-link">Saltar al contenido</a>
    <Navbar user={session?.user ? { name: session.user.name, image: session.user.image } : undefined} />
    <Provider><main id="main-content">{children}</main></Provider>
  </body></html>;
}
