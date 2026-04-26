import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { domainFromEmail } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER", "CLERK"]),
  orgName: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, firstName, lastName, phone, role, orgName } = parsed.data;
  const emailLower = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let clerkOrgId: string | null = null;
  if (role === "CLERK") {
    const domain = domainFromEmail(emailLower);
    if (!domain) {
      return NextResponse.json({ error: "Invalid email domain" }, { status: 400 });
    }
    const org = await prisma.clerkOrg.upsert({
      where: { domain },
      update: {},
      create: { domain, name: orgName?.trim() || domain },
    });
    clerkOrgId = org.id;
  }

  const user = await prisma.user.create({
    data: {
      email: emailLower,
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      role,
      clerkOrgId,
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
