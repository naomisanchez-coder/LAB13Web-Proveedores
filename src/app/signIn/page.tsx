import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import AuthShell from "@/components/auth/AuthShell";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if ((await getServerSession(authOptions))?.user) redirect("/dashboard");
  const { error } = await searchParams;
  const initialError = error ? (error === "OAuthAccountNotLinked"
    ? "Inicia sesión con el método que utilizaste al crear tu cuenta."
    : "No se pudo completar el acceso. Puedes intentarlo de nuevo o elegir otro método.") : "";
  return <AuthShell><LoginForm githubEnabled={!!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)} initialError={initialError} /></AuthShell>;
}
