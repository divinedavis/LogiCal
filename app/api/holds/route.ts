import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");

  if (session.user.role === "CUSTOMER") {
    const holds = await prisma.hold.findMany({
      where: { customerId: session.user.id },
      include: { slot: true, clerkOrg: { select: { name: true, domain: true } } },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ holds });
  }

  const targetOrg = session.user.clerkOrgId;
  if (!targetOrg) return NextResponse.json({ error: "Clerk has no org" }, { status: 400 });
  if (orgId && orgId !== targetOrg) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const holds = await prisma.hold.findMany({
    where: { clerkOrgId: targetOrg },
    include: {
      slot: true,
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json({ holds });
}

const createSchema = z.object({
  slotId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession("CUSTOMER");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slot = await prisma.slot.findUnique({ where: { id: parsed.data.slotId } });
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (isNaN(+start) || isNaN(+end) || end < start) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const hold = await prisma.hold.create({
    data: {
      slotId: slot.id,
      clerkOrgId: slot.clerkOrgId,
      customerId: session.user.id,
      startDate: start,
      endDate: end,
      note: parsed.data.note || null,
    },
    include: { slot: true },
  });
  return NextResponse.json({ hold });
}
