"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import CalendarGrid, { CalendarHold, CalendarSlot } from "./CalendarGrid";

type View = "day" | "week" | "month";

interface Props {
  holds: CalendarHold[];
  slots: CalendarSlot[];
  onDayClick: (day: Date) => void;
}

const HOUR_START = 7;
const HOUR_END = 22;
const HOUR_VISIBLE_END = 17; // 5pm — scroll past this to see later hours
const HOUR_PX = 48;
const TOTAL_HEIGHT = (HOUR_END - HOUR_START) * HOUR_PX;
const VISIBLE_HEIGHT = (HOUR_VISIBLE_END - HOUR_START) * HOUR_PX;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => i + HOUR_START);

const VIEW_STORAGE_KEY = "logical:clerk:calendarView";

export default function CalendarView({ holds, slots, onDayClick }: Props) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "day" || stored === "week" || stored === "month") {
      setView(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  function goToday() {
    setCursor(startOfDay(new Date()));
  }
  function goPrev() {
    if (view === "day") setCursor(subDays(cursor, 1));
    else if (view === "week") setCursor(subWeeks(cursor, 1));
    else setCursor(subMonths(cursor, 1));
  }
  function goNext() {
    if (view === "day") setCursor(addDays(cursor, 1));
    else if (view === "week") setCursor(addWeeks(cursor, 1));
    else setCursor(addMonths(cursor, 1));
  }

  const title = useMemo(() => {
    if (view === "day") return format(cursor, "EEEE, MMM d, yyyy");
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 0 });
      const end = endOfWeek(cursor, { weekStartsOn: 0 });
      const sameMonth = format(start, "MMM") === format(end, "MMM");
      return sameMonth
        ? `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
        : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(cursor, "MMMM yyyy");
  }, [view, cursor]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 sm:p-5">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50"
            aria-label="Next"
          >
            →
          </button>
          <h2 className="ml-1 text-base font-semibold sm:text-lg">{title}</h2>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={[
                "px-3 py-1 capitalize",
                view === v ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {view === "month" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CalendarGrid
              holds={holds}
              slots={slots}
              selectedStart={null}
              selectedEnd={null}
              onSelect={() => {}}
              onDayClick={onDayClick}
              cursor={startOfMonth(cursor)}
              showHeader={false}
            />
          </div>
        )}
        {view === "week" && (
          <WeekDayGrid
            days={Array.from({ length: 7 }, (_, i) =>
              addDays(startOfWeek(cursor, { weekStartsOn: 0 }), i)
            )}
            slots={slots}
            holds={holds}
            onDayClick={onDayClick}
          />
        )}
        {view === "day" && (
          <WeekDayGrid days={[startOfDay(cursor)]} slots={slots} holds={holds} onDayClick={onDayClick} />
        )}
      </div>
    </div>
  );
}

function isAllDay(start: Date, end: Date) {
  if (!isSameDay(start, end)) return true;
  return start.getHours() <= HOUR_START && end.getHours() >= HOUR_END;
}

interface AllDayBar {
  slot: CalendarSlot;
  startCol: number;
  span: number;
}

function layoutAllDayBars(days: Date[], slots: CalendarSlot[]): AllDayBar[][] {
  const rangeStart = startOfDay(days[0]);
  const rangeEnd = addDays(startOfDay(days[days.length - 1]), 1);
  const sorted = [...slots]
    .map((s) => ({ s, start: new Date(s.startAt), end: new Date(s.endAt) }))
    .filter(({ start, end }) => isAllDay(start, end) && end > rangeStart && start < rangeEnd)
    .sort((a, b) => +a.start - +b.start);

  const rows: AllDayBar[][] = [];
  for (const { s, start, end } of sorted) {
    const startCol = Math.max(
      0,
      days.findIndex((d) => isSameDay(d, start) || d > start)
    );
    let endCol = -1;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i] < end || isSameDay(days[i], end)) {
        endCol = i;
        break;
      }
    }
    if (endCol < 0 || startCol > endCol) continue;
    const span = endCol - startCol + 1;

    let placedRow = rows.findIndex((row) =>
      row.every((b) => b.startCol + b.span - 1 < startCol || b.startCol > endCol)
    );
    if (placedRow === -1) {
      rows.push([{ slot: s, startCol, span }]);
    } else {
      rows[placedRow].push({ slot: s, startCol, span });
    }
  }
  return rows;
}

function WeekDayGrid({
  days,
  slots,
  holds,
  onDayClick,
}: {
  days: Date[];
  slots: CalendarSlot[];
  holds: CalendarHold[];
  onDayClick: (day: Date) => void;
}) {
  const allDayRows = useMemo(() => layoutAllDayBars(days, slots), [days, slots]);
  const timedSlots = useMemo(
    () =>
      slots.filter((s) => {
        const start = new Date(s.startAt);
        const end = new Date(s.endAt);
        return !isAllDay(start, end);
      }),
    [slots]
  );

  const colTemplate = `48px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
      <div className="flex min-h-0 flex-1 flex-col min-w-full">
        <div className="grid" style={{ gridTemplateColumns: colTemplate }}>
          <div />
          {days.map((d) => {
            const isToday = isSameDay(d, new Date());
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onDayClick(d)}
                className="border-b border-slate-200 pb-2 text-center text-xs"
              >
                <div className="text-slate-500 uppercase">{format(d, "EEE")}</div>
                <div
                  className={[
                    "mx-auto mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday ? "bg-slate-900 text-white" : "text-slate-800",
                  ].join(" ")}
                >
                  {format(d, "d")}
                </div>
              </button>
            );
          })}

          <div className="border-b border-slate-200 pr-1 pt-1 text-right text-[10px] text-slate-500">
            all-day
          </div>
          <div
            className="relative border-b border-slate-200"
            style={{ gridColumn: `2 / span ${days.length}` }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                gridAutoRows: "24px",
                gap: "2px",
                padding: "2px 0",
                minHeight: allDayRows.length === 0 ? "8px" : undefined,
              }}
            >
              {allDayRows.flatMap((row, ri) =>
                row.map((b) => {
                  const start = new Date(b.slot.startAt);
                  const end = new Date(b.slot.endAt);
                  return (
                    <button
                      key={`${b.slot.id}-${ri}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick(days[b.startCol]);
                      }}
                      className="overflow-hidden truncate rounded-md bg-sky-500 px-2 text-left text-[11px] font-medium text-white shadow-sm hover:bg-sky-600"
                      style={{
                        gridRow: ri + 1,
                        gridColumn: `${b.startCol + 1} / span ${b.span}`,
                      }}
                      title={`${b.slot.label}${b.slot.companyName ? ` — ${b.slot.companyName}` : ""} · ${format(start, "MMM d")} → ${format(end, "MMM d")}`}
                    >
                      {b.slot.label}
                      {b.slot.companyName ? ` · ${b.slot.companyName}` : ""}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <div className="grid" style={{ gridTemplateColumns: colTemplate }}>
            <div className="relative" style={{ height: TOTAL_HEIGHT }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-slate-100 pr-1 text-right text-[10px] text-slate-400"
                  style={{ top: (h - HOUR_START) * HOUR_PX }}
                >
                  {format(new Date(2000, 0, 1, h), "h a")}
                </div>
              ))}
            </div>

            {days.map((day) => (
              <DayColumn
                key={day.toISOString()}
                day={day}
                slots={timedSlots}
                holds={holds}
                onDayClick={onDayClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  slots,
  holds,
  onDayClick,
}: {
  day: Date;
  slots: CalendarSlot[];
  holds: CalendarHold[];
  onDayClick: (day: Date) => void;
}) {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  const placed = slots
    .map((s) => {
      const start = new Date(s.startAt);
      const end = new Date(s.endAt);
      if (end <= dayStart || start >= dayEnd) return null;
      const visibleStart = start < dayStart ? dayStart : start;
      const visibleEnd = end > dayEnd ? dayEnd : end;
      const startHour =
        visibleStart.getHours() + visibleStart.getMinutes() / 60;
      const endHour = visibleEnd.getHours() + visibleEnd.getMinutes() / 60;
      const top = Math.max(0, (Math.max(startHour, HOUR_START) - HOUR_START) * HOUR_PX);
      const bottom = Math.max(0, (Math.min(endHour || HOUR_END, HOUR_END) - HOUR_START) * HOUR_PX);
      const height = Math.max(18, bottom - top);
      return { slot: s, top, height, start, end };
    })
    .filter(Boolean) as { slot: CalendarSlot; top: number; height: number; start: Date; end: Date }[];

  const dayHolds = holds.filter((h) => {
    const s = new Date(h.startDate);
    const e = new Date(h.endDate);
    return s < dayEnd && e >= dayStart;
  });

  const isToday = isSameDay(day, new Date());
  const now = new Date();
  const nowOffset =
    isToday && now.getHours() >= HOUR_START && now.getHours() < HOUR_END
      ? (now.getHours() + now.getMinutes() / 60 - HOUR_START) * HOUR_PX
      : null;

  return (
    <div
      className="relative border-l border-slate-100"
      style={{ height: TOTAL_HEIGHT }}
      onClick={() => onDayClick(day)}
    >
      {HOURS.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-slate-100"
          style={{ top: (h - HOUR_START) * HOUR_PX }}
        />
      ))}
      {nowOffset !== null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-rose-500"
          style={{ top: nowOffset }}
        />
      )}
      {dayHolds.length > 0 && (
        <div className="absolute left-1 right-1 top-0 z-10 -translate-y-full pb-1 text-[10px] text-slate-500">
          {dayHolds.length} hold{dayHolds.length === 1 ? "" : "s"}
        </div>
      )}
      {placed.map(({ slot, top, height, start, end }) => (
        <button
          key={slot.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDayClick(day);
          }}
          className="absolute left-1 right-1 overflow-hidden rounded-md border border-sky-200 bg-sky-100 px-1.5 py-1 text-left text-[11px] text-sky-900 shadow-sm hover:bg-sky-200"
          style={{ top, height }}
          title={`${slot.label}${slot.companyName ? ` — ${slot.companyName}` : ""} · ${format(start, "MMM d h:mma")} → ${format(end, "MMM d h:mma")}`}
        >
          <div className="truncate font-medium">{slot.label}</div>
          {slot.companyName && height > 32 && (
            <div className="truncate text-sky-700">{slot.companyName}</div>
          )}
          {height > 48 && (
            <div className="truncate text-[10px] text-sky-700">
              {format(start, "h:mma").toLowerCase()}–{format(end, "h:mma").toLowerCase()}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
