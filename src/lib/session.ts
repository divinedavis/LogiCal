import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession(role?: "CUSTOMER" | "CLERK") {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (role && session.user.role !== role) return null;
  return session;
}
