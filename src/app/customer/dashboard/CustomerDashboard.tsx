"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import CalendarGrid, { CalendarHold } from "@/components/CalendarGrid";
import MessageThread from "@/components/MessageThread";

interface Slot {
  id: string;
  label: string;
  sizeSqft: number | null;
}

interface Org {
  id: string;
  name: string;
  domain: string;
  slots: Slot[];
}

interface Hold {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  startDate: string;
  endDate: string;
  note: string | null;
  slot: { id: string; label: string };
  org: { id: string; name: string; domain: string };
  messageCount: number;
}

interface Props {
  orgs: Org[];
  initialHolds: Hold[];
}

export default function CustomerDashboard({ orgs, initialHolds }: Props) {
  const [holds, setHolds] = useState<Hold[]>(initialHolds);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(orgs[0]?.id ?? "");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);

  const selectedOrg = useMemo(() => orgs.find((o) => o.id === selectedOrgId), [orgs, selectedOrgId]);
  const filteredHolds = useMemo<CalendarHold[]>(
    () =>
      holds
        .filter((h) => !selectedOrgId || h.org.id === selectedOrgId)
        .map((h) => ({
          id: h.id,
          startDate: h.startDate,
          endDate: h.endDate,
          status: h.status,
          label: h.slot.label,
        })),
    [holds, selectedOrgId]
  );

  async function placeHold() {
    setErr(null);
    if (!selectedSlotId) return setErr("Pick a slot.");
    if (!start || !end) return setErr("Pick a date range on the calendar.");
    const res = await fetch("/api/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: selectedSlotId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        note: note || undefined,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error?.toString() ?? "Failed to place hold");
      return;
    }
    const { hold } = await res.json();
    const org = orgs.find((o) => o.slots.some((s) => s.id === hold.slotId));
    setHolds((prev) => [
      ...prev,
      {
        id: hold.id,
        status: hold.status,
        startDate: hold.startDate,
        endDate: hold.endDate,
        note: hold.note,
        slot: { id: hold.slot.id, label: hold.slot.label },
        org: { id: org?.id ?? "", name: org?.name ?? "", domain: org?.domain ?? "" },
        messageCount: 0,
      },
    ]);
    setStart(null);
    setEnd(null);
    setNote("");
  }

  async function cancelHold(id: string) {
    if (!confirm("Cancel this hold?")) return;
    const res = await fetch(`/api/holds/${id}`, { method: "DELETE" });
    if (res.ok) setHolds((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">Book a storage slot</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <CalendarGrid
          holds={filteredHolds}
          selectedStart={start}
          selectedEnd={end}
          onSelect={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
        />

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="text-sm font-medium">Facility</label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setSelectedSlotId("");
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— select —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.domain})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Slot</label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              disabled={!selectedOrg}
            >
              <option value="">— select —</option>
              {selectedOrg?.slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} {s.sizeSqft ? `(${s.sizeSqft} sqft)` : ""}
                </option>
              ))}
            </select>
            {selectedOrg && selectedOrg.slots.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">This facility has no slots yet.</p>
            )}
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="text-slate-500">Selected range</div>
            <div className="font-medium">
              {start ? format(start, "MMM d, yyyy") : "—"} →{" "}
              {end ? format(end, "MMM d, yyyy") : "—"}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="What are you storing?"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="button"
            onClick={placeHold}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 font-medium text-white"
          >
            Place hold
          </button>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Your holds</h2>
        <div className="mt-4 space-y-3">
          {holds.length === 0 && (
            <p className="text-sm text-slate-500">No holds yet. Pick a range above.</p>
          )}
          {holds.map((h) => (
            <div
              key={h.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {h.org.name} · {h.slot.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(h.startDate), "MMM d")} →{" "}
                    {format(new Date(h.endDate), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} />
                  <button
                    type="button"
                    onClick={() => setActiveHoldId(activeHoldId === h.id ? null : h.id)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                  >
                    {activeHoldId === h.id ? "Hide chat" : "Message"}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelHold(h.id)}
                    className="rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-700"
                  >
                    Cancel
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
