import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  const session = await requireSession();

  let targetOrgId = orgId;
  if (!targetOrgId && session?.user.role === "CLERK") {
    targetOrgId = session.user.clerkOrgId;
  }
  if (!targetOrgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const slots = await prisma.slot.findMany({
    where: { clerkOrgId: targetOrgId },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json({ slots });
}

const createSchema = z
  .object({
    label: z.string().min(1),
    sizeSqft: z.number().int().positive().optional(),
    notes: z.string().optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });

export async function POST(req: Request) {
  const session = await requireSession("CLERK");
  if (!session || !session.user.clerkOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slot = await prisma.slot.create({
    data: {
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      clerkOrgId: session.user.clerkOrgId,
    },
  });
  return NextResponse.json({ slot });
}
