import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  contactName: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  email: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  website: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession("CLERK");
  if (!session?.user.clerkOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.company.findUnique({ where: { id: params.id } });
  if (!existing || existing.clerkOrgId !== session.user.clerkOrgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const company = await prisma.company.update({
      where: { id: params.id },
      data: Object.fromEntries(
        Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v])
      ),
    });
    return NextResponse.json({ company });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "A company with that name already exists." },
        { status: 409 }
      );
    }
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession("CLERK");
  if (!session?.user.clerkOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.company.findUnique({ where: { id: params.id } });
  if (!existing || existing.clerkOrgId !== session.user.clerkOrgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.company.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
