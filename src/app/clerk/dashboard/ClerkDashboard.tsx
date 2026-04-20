"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import CalendarGrid, { CalendarHold } from "@/components/CalendarGrid";
import MessageThread from "@/components/MessageThread";

interface Slot {
  id: string;
  label: string;
  sizeSqft: number | null;
  notes: string | null;
}

interface Hold {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  startDate: string;
  endDate: string;
  note: string | null;
  slot: { id: string; label: string };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  messageCount: number;
}

interface Props {
  org: { id: string; name: string; domain: string };
  initialSlots: Slot[];
  initialHolds: Hold[];
}

export default function ClerkDashboard({ org, initialSlots, initialHolds }: Props) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [holds, setHolds] = useState<Hold[]>(initialHolds);
  const [slotLabel, setSlotLabel] = useState("");
  const [slotSize, setSlotSize] = useState("");
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);
  const [editingHoldId, setEditingHoldId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const calHolds = useMemo<CalendarHold[]>(
    () =>
      holds.map((h) => ({
        id: h.id,
        startDate: h.startDate,
        endDate: h.endDate,
        status: h.status,
        label: `${h.customer.firstName} · ${h.slot.label}`,
      })),
    [holds]
  );

  async function addSlot() {
    if (!slotLabel.trim()) return;
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: slotLabel,
        sizeSqft: slotSize ? Number(slotSize) : undefined,
      }),
    });
    if (res.ok) {
      const { slot } = await res.json();
      setSlots((prev) => [...prev, slot]);
      setSlotLabel("");
      setSlotSize("");
    }
  }

  async function updateHold(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/holds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const { hold } = await res.json();
      setHolds((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                status: hold.status,
                startDate: hold.startDate,
                endDate: hold.endDate,
                note: hold.note,
              }
            : h
        )
      );
    }
  }

  function startEdit(h: Hold) {
    setEditingHoldId(h.id);
    setEditStart(h.startDate.slice(0, 10));
    setEditEnd(h.endDate.slice(0, 10));
  }

  async function saveEdit(id: string) {
    await updateHold(id, {
      startDate: new Date(editStart).toISOString(),
      endDate: new Date(editEnd).toISOString(),
    });
    setEditingHoldId(null);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold">{org.name} calendar</h1>
        <p className="text-sm text-slate-600">
          Org domain: <span className="font-mono">{org.domain}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <CalendarGrid
          holds={calHolds}
          selectedStart={null}
          selectedEnd={null}
          onSelect={() => {}}
        />

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Slots</h2>
          <div className="space-y-2">
            {slots.length === 0 && <p className="text-sm text-slate-500">No slots yet.</p>}
            {slots.map((s) => (
              <div key={s.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                <span className="font-medium">{s.label}</span>
                {s.sizeSqft && <span className="ml-2 text-slate-500">{s.sizeSqft} sqft</span>}
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <input
              type="text"
              value={slotLabel}
              onChange={(e) => setSlotLabel(e.target.value)}
              placeholder="Slot label (e.g. Bay A-12)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={slotSize}
              onChange={(e) => setSlotSize(e.target.value)}
              placeholder="Size (sqft, optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addSlot}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Add slot
            </button>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Holds</h2>
        <div className="mt-4 space-y-3">
          {holds.length === 0 && (
            <p className="text-sm text-slate-500">No customer holds yet.</p>
          )}
          {holds.map((h) => (
            <div key={h.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {h.customer.firstName} {h.customer.lastName} · {h.slot.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {h.customer.email}
                    {h.customer.phone && ` · ${h.customer.phone}`}
                  </div>
                  {editingHoldId === h.id ? (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <input
                        type="date"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        className="rounded border border-slate-300 px-2 py-1"
                      />
                      →
                      <input
                        type="date"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        className="rounded border border-slate-300 px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(h.id)}
                        className="rounded bg-slate-900 px-3 py-1 text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingHoldId(null)}
                        className="rounded border border-slate-300 px-3 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      {format(new Date(h.startDate), "MMM d")} →{" "}
                      {format(new Date(h.endDate), "MMM d, yyyy")}
                    </div>
                  )}
                  {h.note && <p className="mt-1 text-xs italic text-slate-600">"{h.note}"</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={h.status} />
                  <button
                    type="button"
                    onClick={() => updateHold(h.id, { status: "ACCEPTED" })}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => updateHold(h.id, { status: "DECLINED" })}
                    className="rounded-lg bg-rose-600 px-3 py-1 text-xs text-white"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(h)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHoldId(activeHoldId === h.id ? null : h.id)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                  >
                    {activeHoldId === h.id ? "Hide chat" : "Message"}
                  </button>
                </div>
              </div>
              {activeHoldId === h.id && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <MessageThread holdId={h.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "ACCEPTED" | "DECLINED" }) {
  const styles =
    status === "ACCEPTED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "DECLINED"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}
