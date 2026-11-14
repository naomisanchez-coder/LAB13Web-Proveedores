import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Compartido por el Route Handler y los componentes de servidor.
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signIn" },
};
