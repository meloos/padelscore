import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  pages: { signIn: "/auth/login" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const protectedPaths = ["/dashboard", "/tournaments", "/players"];
      if (protectedPaths.some((p) => pathname.startsWith(p))) return !!auth;
      if (pathname.startsWith("/admin")) {
        return !!(auth as { user?: { isAdmin?: boolean } })?.user?.isAdmin;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.isAdmin !== undefined)
        session.user.isAdmin = token.isAdmin as boolean;
      return session;
    },
  },
} satisfies NextAuthConfig;
