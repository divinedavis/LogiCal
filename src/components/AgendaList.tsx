"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import type { CalendarHold, CalendarSlot } from "./CalendarGrid";

interface Props {
  holds: CalendarHold[];
  slots: CalendarSlot[];
  onDayClick?: (day: Date) => void;
  rangeDays?: number;
}

export default function AgendaList({ holds, slots, onDayClick, rangeDays = 14 }: Props) {
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));

  const days = useMemo(
    () => Array.from({ length: rangeDays }, (_, i) => addDays(anchor, i)),
    [anchor, rangeDays]
  );

  function slotsForDay(day: Date) {
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);
    return slots.filter((s) => {
      const start = new Date(s.startAt);
      const end = new Date(s.endAt);
      return start < dayEnd && end >= dayStart;
    });
  }

  function holdsForDay(day: Date) {
    return holds.filter((h) =>
      isWithinInterval(day, { start: new Date(h.startDate), end: new Date(h.endDate) })
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {isSameDay(anchor, startOfDay(new Date())) ? "Upcoming" : format(anchor, "MMM d")}
        </h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setAnchor(addDays(anchor, -rangeDays))}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setAnchor(startOfDay(new Date()))}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setAnchor(addDays(anchor, rangeDays))}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm"
          >
            →
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {days.map((day) => {
          const daySlots = slotsForDay(day);
          const dayHolds = holdsForDay(day);
          const isToday = isSameDay(day, new Date());
          const empty = daySlots.length === 0 && dayHolds.length === 0;
          if (empty && !isToday) return null;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick?.(day)}
              className="w-full rounded-xl border border-slate-200 p-3 text-left transition active:bg-slate-50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">
                  {format(day, "EEE, MMM d")}
                  {isToday && (
                    <span className="ml-2 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
                      Today
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500">
                  {daySlots.length} slot{daySlots.length === 1 ? "" : "s"}
                  {dayHolds.length > 0 && ` · ${dayHolds.length} hold${dayHolds.length === 1 ? "" : "s"}`}
                </span>
              </div>
              {empty ? (
                <p className="mt-1 text-xs text-slate-500">Nothing scheduled.</p>
              ) : (
                <div className="mt-2 space-y-1">
                  {daySlots.map((s) => {
                    const start = new Date(s.startAt);
                    const end = new Date(s.endAt);
                    const sameDay = isSameDay(start, end);
                    const timeLabel = sameDay
                      ? `${format(start, "h:mma")}–${format(end, "h:mma")}`
                      : isSameDay(day, start)
                      ? `${format(start, "h:mma")} →`
                      : isSameDay(day, end)
                      ? `→ ${format(end, "h:mma")}`
                      : "all day";
                    return (
                      <div
                        key={s.id}
                        className="flex items-baseline justify-between gap-2 rounded bg-sky-50 px-2 py-1 text-xs text-sky-900"
                      >
                        <span className="truncate font-medium">{s.label}</span>
                        <span className="shrink-0 text-sky-700">{timeLabel.toLowerCase()}</span>
                      </div>
                    );
                  })}
                  {dayHolds.map((h) => (
                    <div
                      key={h.id}
                      className={[
                        "truncate rounded px-2 py-1 text-xs",
                        h.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : h.status === "DECLINED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800",
                      ].join(" ")}
                    >
                      {h.label ?? h.status}
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
