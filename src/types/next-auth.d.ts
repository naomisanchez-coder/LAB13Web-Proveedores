import type { DefaultSession } from "next-auth";
export type AuthProvider = "google" | "github" | "credentials";

declare module "next-auth" {
  interface Session {
    user: { id?: string } & DefaultSession["user"];
    authProvider?: AuthProvider;
    accountCreatedAt?: string;
  }
  interface User { createdAt?: string; }
}
declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: AuthProvider;
    accountCreatedAt?: string;
  }
}
