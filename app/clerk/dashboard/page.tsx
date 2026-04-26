import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClerkDashboard from "./ClerkDashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireSession("CLERK");
  if (!session) redirect("/clerk/signin");
  if (!session.user.clerkOrgId) redirect("/");

  const [org, slots, holds] = await Promise.all([
    prisma.clerkOrg.findUnique({ where: { id: session.user.clerkOrgId } }),
    prisma.slot.findMany({
      where: { clerkOrgId: session.user.clerkOrgId },
      orderBy: { startAt: "asc" },
    }),
    prisma.hold.findMany({
      where: { clerkOrgId: session.user.clerkOrgId },
      include: {
        slot: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        messages: { select: { id: true } },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <ClerkDashboard
      org={{ id: org!.id, name: org!.name, domain: org!.domain }}
      initialSlots={slots.map((s) => ({
        id: s.id,
        label: s.label,
        companyName: s.companyName,
        sizeSqft: s.sizeSqft,
        notes: s.notes,
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
      }))}
      initialHolds={holds.map((h) => ({
        id: h.id,
        status: h.status,
        startDate: h.startDate.toISOString(),
        endDate: h.endDate.toISOString(),
        note: h.note,
        slot: { id: h.slot.id, label: h.slot.label },
        customer: h.customer,
        messageCount: h.messages.length,
      }))}
    />
  );
}
