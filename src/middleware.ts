import { withAuth } from "next-auth/middleware";

// La misma página pública configurada en authOptions evita bucles de login.
export default withAuth({ pages: { signIn: "/signIn" } });

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
