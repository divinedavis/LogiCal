import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession("CLERK");
  if (!session?.user.clerkOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.slot.findMany({
    where: { clerkOrgId: session.user.clerkOrgId },
    select: { label: true, companyName: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const labels = Array.from(new Set(rows.map((r) => r.label).filter(Boolean))).sort();
  const companies = Array.from(
    new Set(rows.map((r) => r.companyName ?? "").filter(Boolean))
  ).sort();

  return NextResponse.json({ labels, companies });
}
