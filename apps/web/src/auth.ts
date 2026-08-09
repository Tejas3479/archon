import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Google Workspace / Okta",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "admin@company.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock authorization for Phase 6 enterprise sign-in
        if (credentials?.email && credentials?.email.includes("@")) {
          return {
            id: "user_admin",
            name: "Enterprise Admin",
            email: credentials.email,
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  }
};
