import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireSession("CLERK");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ orgs: [] });

  const orgs = await prisma.clerkOrg.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { domain: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      domain: true,
      slots: {
        where: { endAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        select: { id: true, label: true, sizeSqft: true, startAt: true, endAt: true },
      },
    },
    orderBy: { name: "asc" },
    take: 25,
  });
  return NextResponse.json({ orgs });
}
