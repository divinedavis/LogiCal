"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export interface CalendarHold {
  id: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  label?: string;
}

export interface CalendarSlot {
  id: string;
  startAt: string;
  endAt: string;
  label: string;
  companyName?: string | null;
  sizeSqft?: number | null;
}

interface Props {
  holds: CalendarHold[];
  slots?: CalendarSlot[];
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSelect: (start: Date | null, end: Date | null) => void;
  onDayClick?: (day: Date) => void;
  cursor?: Date;
  showHeader?: boolean;
}

export default function CalendarGrid({
  holds,
  slots = [],
  selectedStart,
  selectedEnd,
  onSelect,
  onDayClick,
  cursor: cursorProp,
  showHeader = true,
}: Props) {
  const [internalCursor, setInternalCursor] = useState(() => startOfMonth(new Date()));
  const cursor = cursorProp ?? internalCursor;
  const setCursor = (d: Date) => setInternalCursor(d);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  function handleClick(day: Date) {
    if (onDayClick) {
      onDayClick(day);
      return;
    }
    if (!selectedStart || (selectedStart && selectedEnd)) {
      onSelect(day, null);
      return;
    }
    if (day < selectedStart) {
      onSelect(day, selectedStart);
    } else {
      onSelect(selectedStart, day);
    }
  }

  function holdsForDay(day: Date) {
    return holds.filter((h) => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      return isWithinInterval(day, { start, end });
    });
  }

  function slotsForDay(day: Date) {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return slots.filter((s) => {
      const start = new Date(s.startAt);
      const end = new Date(s.endAt);
      return start <= dayEnd && end >= dayStart;
    });
  }

  const wrapperClass = showHeader
    ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    : "";

  return (
    <div className={wrapperClass}>
      {showHeader && (
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(cursor, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            onClick={() => setCursor(subMonths(cursor, 1))}
          >
            ←
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            onClick={() => setCursor(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            →
          </button>
        </div>
      </div>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const dayHolds = holdsForDay(day);
          const daySlots = slotsForDay(day);
          const isStart = selectedStart && isSameDay(day, selectedStart);
          const isEnd = selectedEnd && isSameDay(day, selectedEnd);
          const inRange =
            selectedStart && selectedEnd && isWithinInterval(day, { start: selectedStart, end: selectedEnd });

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => handleClick(day)}
              className={[
                "flex min-h-[70px] flex-col items-start rounded-lg border p-1.5 text-left text-xs transition",
                inMonth ? "bg-white" : "bg-slate-50 text-slate-400",
                isStart || isEnd ? "border-brand-500 ring-2 ring-brand-500" : "border-slate-200 hover:border-brand-500",
                inRange && !isStart && !isEnd ? "bg-brand-50" : "",
              ].join(" ")}
            >
              <span className="text-[11px] font-semibold">{format(day, "d")}</span>
              <div className="mt-0.5 flex w-full flex-col gap-0.5">
                {daySlots.length > 2 ? (
                  <span className="block w-full rounded bg-sky-100 px-1 py-0.5 text-center text-[11px] font-semibold text-sky-800">
                    {daySlots.length} slots
                  </span>
                ) : (
                  daySlots.map((s) => {
                    const start = new Date(s.startAt);
                    const end = new Date(s.endAt);
                    const isStart = isSameDay(day, start);
                    const isEnd = isSameDay(day, end);
                    const multiDay = !isSameDay(start, end);
                    const radius = !multiDay
                      ? "rounded"
                      : isStart && isEnd
                      ? "rounded"
                      : isStart
                      ? "rounded-l"
                      : isEnd
                      ? "rounded-r"
                      : "";
                    const tone = multiDay
                      ? "bg-sky-500 text-white"
                      : "bg-sky-100 text-sky-800";
                    const subTone = multiDay ? "text-sky-100" : "text-sky-700";
                    return (
                      <span
                        key={s.id}
                        className={`block w-full overflow-hidden px-1 py-0.5 text-[10px] ${tone} ${radius}`}
                        title={`${s.label}${s.companyName ? ` — ${s.companyName}` : ""} · ${format(start, "MMM d h:mma")} → ${format(end, "MMM d h:mma")}`}
                      >
                        <span className="block truncate font-medium">{s.label}</span>
                        {s.companyName && (
                          <span className={`block truncate ${subTone}`}>{s.companyName}</span>
                        )}
                      </span>
                    );
                  })
                )}
                {dayHolds.slice(0, 2).map((h) => (
                  <span
                    key={h.id}
                    className={[
                      "truncate rounded px-1 py-0.5 text-[10px]",
                      h.status === "ACCEPTED"
                        ? "bg-emerald-100 text-emerald-800"
                        : h.status === "DECLINED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800",
                    ].join(" ")}
                  >
                    {h.label ?? h.status}
                  </span>
                ))}
                {dayHolds.length > 2 && (
                  <span className="text-[10px] text-slate-500">+{dayHolds.length - 2} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
