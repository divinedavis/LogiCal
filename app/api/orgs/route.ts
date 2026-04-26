import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const orgs = await prisma.clerkOrg.findMany({
    select: { id: true, domain: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ orgs });
}
