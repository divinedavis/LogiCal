import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const patchSchema = z
  .object({
    label: z.string().min(1).optional(),
    companyName: z.string().trim().min(1).nullable().optional(),
    sizeSqft: z.number().int().positive().nullable().optional(),
    notes: z.string().nullable().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
  })
  .refine(
    (d) => !d.startAt || !d.endAt || new Date(d.endAt) > new Date(d.startAt),
    { message: "endAt must be after startAt", path: ["endAt"] }
  );

async function authorizeSlot(id: string) {
  const session = await requireSession("CLERK");
  if (!session?.user.clerkOrgId) return { error: "Unauthorized" as const, status: 401 };
  const slot = await prisma.slot.findUnique({ where: { id } });
  if (!slot) return { error: "Not found" as const, status: 404 };
  if (slot.clerkOrgId !== session.user.clerkOrgId) {
    return { error: "Forbidden" as const, status: 403 };
  }
  return { slot };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeSlot(params.id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startAt, endAt, ...rest } = parsed.data;
  const slot = await prisma.slot.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(startAt ? { startAt: new Date(startAt) } : {}),
      ...(endAt ? { endAt: new Date(endAt) } : {}),
    },
  });
  return NextResponse.json({ slot });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeSlot(params.id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await prisma.slot.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
