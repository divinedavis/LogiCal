import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireSession("CLERK");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ slots: [] });

  const slots = await prisma.slot.findMany({
    where: {
      OR: [
        { label: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { startAt: "asc" },
    take: 50,
    select: {
      id: true,
      label: true,
      companyName: true,
      sizeSqft: true,
      startAt: true,
      endAt: true,
      clerkOrg: { select: { id: true, name: true, domain: true } },
    },
  });
  return NextResponse.json({ slots });
}
