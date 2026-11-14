import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/RegisterForm";
export default async function RegisterPage() {
  if ((await getServerSession(authOptions))?.user) redirect("/dashboard");
  return <AuthShell register><RegisterForm /></AuthShell>;
}
