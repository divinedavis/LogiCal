import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession("CLERK");
  if (!session?.user.clerkOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const companies = await prisma.company.findMany({
    where: { clerkOrgId: session.user.clerkOrgId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ companies });
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  contactName: z.string().trim().optional(),
  pointOfContact: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
  website: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession("CLERK");
  if (!session?.user.clerkOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const company = await prisma.company.create({
      data: {
        ...parsed.data,
        contactName: parsed.data.contactName || null,
        pointOfContact: parsed.data.pointOfContact || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        website: parsed.data.website || null,
        notes: parsed.data.notes || null,
        clerkOrgId: session.user.clerkOrgId,
      },
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
