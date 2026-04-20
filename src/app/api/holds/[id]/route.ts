import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const patchSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  note: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hold = await prisma.hold.findUnique({ where: { id: params.id } });
  if (!hold) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "CLERK" && hold.clerkOrgId !== session.user.clerkOrgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "CUSTOMER" && hold.customerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (session.user.role === "CUSTOMER" && parsed.data.status) {
    return NextResponse.json({ error: "Customers cannot change status" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.startDate) data.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) data.endDate = new Date(parsed.data.endDate);
  if (parsed.data.note !== undefined) data.note = parsed.data.note || null;

  const updated = await prisma.hold.update({
    where: { id: hold.id },
    data,
    include: {
      slot: true,
      customer: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  return NextResponse.json({ hold: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hold = await prisma.hold.findUnique({ where: { id: params.id } });
  if (!hold) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerCustomer = session.user.role === "CUSTOMER" && hold.customerId === session.user.id;
  const isOrgClerk = session.user.role === "CLERK" && hold.clerkOrgId === session.user.clerkOrgId;
  if (!isOwnerCustomer && !isOrgClerk) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.hold.delete({ where: { id: hold.id } });
  return NextResponse.json({ ok: true });
}
