import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateCredentials } from "@/lib/server/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Correo y contraseña",
      credentials: { email: { label: "Correo", type: "email" }, password: { label: "Contraseña", type: "password" } },
      authorize: (credentials, request) => authenticateCredentials(credentials, request.headers ?? {}),
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signIn", error: "/signIn" },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const provider = account.provider;
        if (provider === "google" || provider === "github" || provider === "credentials") {
          token.authProvider = provider;
          // Identidad ligada al proveedor, nunca al correo compartido entre cuentas.
          token.sub = provider === "credentials" ? user.id : `${provider}:${account.providerAccountId}`;
          token.accountCreatedAt = provider === "credentials" ? user.createdAt : undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub;
      session.authProvider = token.authProvider;
      session.accountCreatedAt = token.accountCreatedAt;
      return session;
    },
  },
};
