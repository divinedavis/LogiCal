import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: "CUSTOMER" | "CLERK";
      clerkOrgId: string | null;
      clerkOrgDomain: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "CUSTOMER" | "CLERK";
    clerkOrgId?: string | null;
    clerkOrgDomain?: string | null;
  }
}
