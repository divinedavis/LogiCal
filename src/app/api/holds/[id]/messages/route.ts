import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

async function authorizeHold(session: any, holdId: string) {
  const hold = await prisma.hold.findUnique({ where: { id: holdId } });
  if (!hold) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (session.user.role === "CUSTOMER" && hold.customerId !== session.user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (session.user.role === "CLERK" && hold.clerkOrgId !== session.user.clerkOrgId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { hold };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const check = await authorizeHold(session, params.id);
  if ("error" in check) return check.error;

  const messages = await prisma.message.findMany({
    where: { holdId: params.id },
    include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages });
}

const postSchema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const check = await authorizeHold(session, params.id);
  if ("error" in check) return check.error;

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      holdId: params.id,
      senderId: session.user.id,
      body: parsed.data.body,
    },
    include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });
  return NextResponse.json({ message });
}
