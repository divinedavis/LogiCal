import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import CustomerDashboard from "./CustomerDashboard";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireSession("CUSTOMER");
  if (!session) redirect("/customer/signin");

  const [orgs, holds] = await Promise.all([
    prisma.clerkOrg.findMany({
      include: { slots: true },
      orderBy: { name: "asc" },
    }),
    prisma.hold.findMany({
      where: { customerId: session.user.id },
      include: {
        slot: true,
        clerkOrg: { select: { id: true, name: true, domain: true } },
        messages: { select: { id: true } },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <>
      <TopBar />
      <CustomerDashboard
        orgs={orgs.map((o) => ({
          id: o.id,
          name: o.name,
          domain: o.domain,
          slots: o.slots.map((s) => ({ id: s.id, label: s.label, sizeSqft: s.sizeSqft })),
        }))}
        initialHolds={holds.map((h) => ({
          id: h.id,
          status: h.status,
          startDate: h.startDate.toISOString(),
          endDate: h.endDate.toISOString(),
          note: h.note,
          slot: { id: h.slot.id, label: h.slot.label },
          org: { id: h.clerkOrg.id, name: h.clerkOrg.name, domain: h.clerkOrg.domain },
          messageCount: h.messages.length,
        }))}
      />
    </>
  );
}
