import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Next Auth App", description: "My Next Auth App" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className="antialiased">{children}</body></html>;
}
