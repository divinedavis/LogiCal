"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import CalendarGrid, { CalendarHold, CalendarSlot } from "@/components/CalendarGrid";
import AgendaList from "@/components/AgendaList";
import MessageThread from "@/components/MessageThread";

interface Slot {
  id: string;
  label: string;
  companyName: string | null;
  sizeSqft: number | null;
  notes: string | null;
  startAt: string;
  endAt: string;
}

interface SearchResultSlot {
  id: string;
  label: string;
  companyName: string | null;
  sizeSqft: number | null;
  startAt: string;
  endAt: string;
  clerkOrg: { id: string; name: string; domain: string };
}

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
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
  const [slotCompany, setSlotCompany] = useState("");
  const [slotSize, setSlotSize] = useState("");
  const [slotStartDate, setSlotStartDate] = useState(defaultDate);
  const [slotStartTime, setSlotStartTime] = useState("09:00");
  const [slotEndDate, setSlotEndDate] = useState(defaultDate);
  const [slotEndTime, setSlotEndTime] = useState("17:00");
  const [slotErr, setSlotErr] = useState<string | null>(null);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultSlot[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [popupDay, setPopupDay] = useState<Date | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editSlotState, setEditSlotState] = useState<{
    label: string;
    companyName: string;
    sizeSqft: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  } | null>(null);
  const [editSlotErr, setEditSlotErr] = useState<string | null>(null);

  useEffect(() => {
    void loadSuggestions();
  }, []);

  async function loadSuggestions() {
    const res = await fetch("/api/slots/suggestions");
    if (res.ok) {
      const { labels, companies } = await res.json();
      setLabelOptions(labels ?? []);
      setCompanyOptions(companies ?? []);
    }
  }
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);
  const [editingHoldId, setEditingHoldId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const calSlots = useMemo<CalendarSlot[]>(
    () =>
      slots.map((s) => ({
        id: s.id,
        startAt: s.startAt,
        endAt: s.endAt,
        label: s.label,
        companyName: s.companyName,
        sizeSqft: s.sizeSqft,
      })),
    [slots]
  );

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
    setSlotErr(null);
    if (!slotLabel.trim()) {
      setSlotErr("Slot label is required.");
      return;
    }
    const startAt = new Date(`${slotStartDate}T${slotStartTime}`);
    const endAt = new Date(`${slotEndDate}T${slotEndTime}`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setSlotErr("Pick a valid start and end.");
      return;
    }
    if (endAt <= startAt) {
      setSlotErr("End must be after start.");
      return;
    }
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: slotLabel.trim(),
        companyName: slotCompany.trim() || undefined,
        sizeSqft: slotSize ? Number(slotSize) : undefined,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      }),
    });
    if (res.ok) {
      const { slot } = await res.json();
      setSlots((prev) => [...prev, slot]);
      setSlotLabel("");
      setSlotCompany("");
      setSlotSize("");
      void loadSuggestions();
    } else {
      const j = await res.json().catch(() => ({}));
      setSlotErr(typeof j.error === "string" ? j.error : "Could not add slot.");
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

  const slotsForPopup = useMemo(() => {
    if (!popupDay) return [];
    const dayStart = new Date(popupDay);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(popupDay);
    dayEnd.setHours(23, 59, 59, 999);
    return slots.filter((s) => {
      const start = new Date(s.startAt);
      const end = new Date(s.endAt);
      return start <= dayEnd && end >= dayStart;
    });
  }, [popupDay, slots]);

  function startEditSlot(s: Slot) {
    const start = new Date(s.startAt);
    const end = new Date(s.endAt);
    setEditingSlotId(s.id);
    setEditSlotErr(null);
    setEditSlotState({
      label: s.label,
      companyName: s.companyName ?? "",
      sizeSqft: s.sizeSqft ? String(s.sizeSqft) : "",
      startDate: format(start, "yyyy-MM-dd"),
      startTime: format(start, "HH:mm"),
      endDate: format(end, "yyyy-MM-dd"),
      endTime: format(end, "HH:mm"),
    });
  }

  async function saveSlotEdit(id: string) {
    if (!editSlotState) return;
    setEditSlotErr(null);
    if (!editSlotState.label.trim()) {
      setEditSlotErr("Slot label is required.");
      return;
    }
    const startAt = new Date(`${editSlotState.startDate}T${editSlotState.startTime}`);
    const endAt = new Date(`${editSlotState.endDate}T${editSlotState.endTime}`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setEditSlotErr("Pick a valid start and end.");
      return;
    }
    if (endAt <= startAt) {
      setEditSlotErr("End must be after start.");
      return;
    }
    const res = await fetch(`/api/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: editSlotState.label.trim(),
        companyName: editSlotState.companyName.trim() || null,
        sizeSqft: editSlotState.sizeSqft ? Number(editSlotState.sizeSqft) : null,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      }),
    });
    if (res.ok) {
      const { slot } = await res.json();
      setSlots((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                label: slot.label,
                companyName: slot.companyName,
                sizeSqft: slot.sizeSqft,
                startAt: slot.startAt,
                endAt: slot.endAt,
              }
            : s
        )
      );
      setEditingSlotId(null);
      setEditSlotState(null);
      void loadSuggestions();
    } else {
      const j = await res.json().catch(() => ({}));
      setEditSlotErr(typeof j.error === "string" ? j.error : "Could not save.");
    }
  }

  async function deleteSlot(id: string) {
    if (!confirm("Delete this slot?")) return;
    const res = await fetch(`/api/slots/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSlots((prev) => prev.filter((s) => s.id !== id));
      if (editingSlotId === id) {
        setEditingSlotId(null);
        setEditSlotState(null);
      }
    }
  }

  async function runSearch() {
    const q = searchQ.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/slots/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const { slots } = await res.json();
        setSearchResults(slots);
      } else {
        setSearchResults([]);
      }
    } finally {
      setSearching(false);
    }
  }

  async function saveEdit(id: string) {
    await updateHold(id, {
      startDate: new Date(editStart).toISOString(),
      endDate: new Date(editEnd).toISOString(),
    });
    setEditingHoldId(null);
  }

  const onPickDay = (day: Date) => {
    setPopupDay(day);
    setEditingSlotId(null);
    setEditSlotState(null);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="hidden md:block">
          <CalendarGrid
            holds={calHolds}
            slots={calSlots}
            selectedStart={null}
            selectedEnd={null}
            onSelect={() => {}}
            onDayClick={onPickDay}
          />
        </div>
        <div className="md:hidden">
          <AgendaList holds={calHolds} slots={calSlots} onDayClick={onPickDay} />
        </div>

        <div className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Create Slot</h2>
          <div className="space-y-2">
            <input
              type="text"
              list="slot-label-options"
              value={slotLabel}
              onChange={(e) => setSlotLabel(e.target.value)}
              placeholder="Slot label (e.g. Bay A-12)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <datalist id="slot-label-options">
              {labelOptions.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <input
              type="text"
              list="slot-company-options"
              value={slotCompany}
              onChange={(e) => setSlotCompany(e.target.value)}
              placeholder="Company name (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <datalist id="slot-company-options">
              {companyOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input
              type="number"
              value={slotSize}
              onChange={(e) => setSlotSize(e.target.value)}
              placeholder="Size (sqft, optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Start</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={slotStartDate}
                  onChange={(e) => setSlotStartDate(e.target.value)}
                  className="min-w-[10rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">End</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={slotEndDate}
                  onChange={(e) => setSlotEndDate(e.target.value)}
                  className="min-w-[10rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {slotErr && <p className="text-xs text-rose-600">{slotErr}</p>}
            <button
              type="button"
              onClick={addSlot}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Add slot
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Find slots</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder="Slot label or company name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={searching}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {searching ? "…" : "Search"}
            </button>
          </div>
          {searchResults !== null && (
            <div className="space-y-2">
              {searchResults.length === 0 && (
                <p className="text-sm text-slate-500">No slots matched.</p>
              )}
              {searchResults.map((s) => {
                const start = new Date(s.startAt);
                const end = new Date(s.endAt);
                const sameDay = start.toDateString() === end.toDateString();
                return (
                  <div key={s.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{s.label}</span>
                      {s.sizeSqft && (
                        <span className="text-xs text-slate-500">{s.sizeSqft} sqft</span>
                      )}
                    </div>
                    {s.companyName && (
                      <div className="text-xs text-slate-700">{s.companyName}</div>
                    )}
                    <div className="text-xs text-slate-600">
                      {sameDay
                        ? `${format(start, "MMM d")} · ${format(start, "h:mma")}–${format(end, "h:mma")}`
                        : `${format(start, "MMM d, h:mma")} → ${format(end, "MMM d, h:mma")}`}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {s.clerkOrg.name} · <span className="font-mono">{s.clerkOrg.domain}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      {popupDay && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => {
            setPopupDay(null);
            setEditingSlotId(null);
            setEditSlotState(null);
          }}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">
                {format(popupDay, "EEEE, MMM d, yyyy")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPopupDay(null);
                  setEditingSlotId(null);
                  setEditSlotState(null);
                }}
                className="rounded-lg border border-slate-300 px-2 py-0.5 text-xs"
              >
                Close
              </button>
            </div>
            {slotsForPopup.length === 0 ? (
              <p className="text-sm text-slate-500">No slots on this day.</p>
            ) : (
              <ul className="space-y-3">
                {slotsForPopup.map((s) => {
                  const start = new Date(s.startAt);
                  const end = new Date(s.endAt);
                  const sameDay = start.toDateString() === end.toDateString();
                  const isEditing = editingSlotId === s.id && editSlotState !== null;
                  return (
                    <li key={s.id} className="rounded-xl border border-slate-200 p-3">
                      {!isEditing ? (
                        <>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium">{s.label}</span>
                            {s.sizeSqft && (
                              <span className="text-xs text-slate-500">{s.sizeSqft} sqft</span>
                            )}
                          </div>
                          {s.companyName && (
                            <div className="text-xs text-slate-700">{s.companyName}</div>
                          )}
                          <div className="text-xs text-slate-600">
                            {sameDay
                              ? `${format(start, "MMM d")} · ${format(start, "h:mma")}–${format(end, "h:mma")}`
                              : `${format(start, "MMM d, h:mma")} → ${format(end, "MMM d, h:mma")}`}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEditSlot(s)}
                              className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSlot(s.id)}
                              className="rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            list="slot-label-options"
                            value={editSlotState!.label}
                            onChange={(e) =>
                              setEditSlotState({ ...editSlotState!, label: e.target.value })
                            }
                            placeholder="Slot label"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            list="slot-company-options"
                            value={editSlotState!.companyName}
                            onChange={(e) =>
                              setEditSlotState({ ...editSlotState!, companyName: e.target.value })
                            }
                            placeholder="Company name (optional)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            type="number"
                            value={editSlotState!.sizeSqft}
                            onChange={(e) =>
                              setEditSlotState({ ...editSlotState!, sizeSqft: e.target.value })
                            }
                            placeholder="Size (sqft, optional)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="date"
                              value={editSlotState!.startDate}
                              onChange={(e) =>
                                setEditSlotState({ ...editSlotState!, startDate: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              type="time"
                              value={editSlotState!.startTime}
                              onChange={(e) =>
                                setEditSlotState({ ...editSlotState!, startTime: e.target.value })
                              }
                              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editSlotState!.endDate}
                              onChange={(e) =>
                                setEditSlotState({ ...editSlotState!, endDate: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              type="time"
                              value={editSlotState!.endTime}
                              onChange={(e) =>
                                setEditSlotState({ ...editSlotState!, endTime: e.target.value })
                              }
                              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          {editSlotErr && (
                            <p className="text-xs text-rose-600">{editSlotErr}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveSlotEdit(s.id)}
                              className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSlotId(null);
                                setEditSlotState(null);
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

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
