import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        expectedRole: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { clerkOrg: true },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        if (credentials.expectedRole && credentials.expectedRole !== user.role) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          clerkOrgId: user.clerkOrgId ?? null,
          clerkOrgDomain: user.clerkOrg?.domain ?? null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.clerkOrgId = (user as any).clerkOrgId ?? null;
        token.clerkOrgDomain = (user as any).clerkOrgDomain ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.sub;
      (session.user as any).role = token.role;
      (session.user as any).clerkOrgId = token.clerkOrgId ?? null;
      (session.user as any).clerkOrgDomain = token.clerkOrgDomain ?? null;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function domainFromEmail(email: string): string {
  const parts = email.toLowerCase().split("@");
  return parts[1] ?? "";
}
