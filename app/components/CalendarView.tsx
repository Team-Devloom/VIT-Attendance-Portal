"use client";

import { useState, useRef } from "react";
import {
  DailyCalendarEntry,
  Subject,
  AttendanceRecord,
  AttendanceStatus,
} from "@/app/types/attendance";
import { saveToStorage } from "@/app/lib/storage";
import { getEffectiveWeekday } from "@/app/lib/attendanceLogic";

import "./CalendarView.css";

const STATUS_CONFIG: Record<string, { label: string; activeClass: string }> = {
  present: { label: "Present", activeClass: "status-present-active" },
  absent: { label: "Absent", activeClass: "status-absent-active" },
  od: { label: "OD", activeClass: "status-od-active" },
  cancelled: { label: "Cancel", activeClass: "status-cancel-active" },
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleString("en-GB", { month: "short" }),
    year: d.getFullYear(),
    // 0=Sun … 6=Sat → Mon-first index
    weekdayIdx: (d.getDay() + 6) % 7,
  };
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return (
    d.toLocaleString("en-GB", { month: "long" }).toUpperCase() +
    " " +
    d.getFullYear()
  );
}
function getMonthShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return (
    d.toLocaleString("en-GB", { month: "short" }).toUpperCase() +
    " " +
    d.getFullYear().toString().slice(2)
  );
}
function getMonthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}
function jsToMonSun(jsDay: number) {
  return (jsDay + 6) % 7;
}

function buildWeeks(
  days: DailyCalendarEntry[],
): (DailyCalendarEntry | null)[][] {
  if (!days.length) return [];
  const startOffset = jsToMonSun(new Date(days[0].date + "T00:00:00").getDay());
  const cells: (DailyCalendarEntry | null)[] = [
    ...Array(startOffset).fill(null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DailyCalendarEntry | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

interface CalendarViewProps {
  calendar: DailyCalendarEntry[];
  subjects: Subject[];
  timetable: Record<number, string[]>;
  attendance: AttendanceRecord;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord>>;
  openModal: (subject: Subject) => void;
}

export default function CalendarView({
  calendar,
  subjects,
  timetable,
  attendance,
  setAttendance,
  openModal,
}: CalendarViewProps) {
  const todayISO = new Date().toISOString().split("T")[0];

  const monthMap: Record<string, DailyCalendarEntry[]> = {};
  for (const day of calendar) {
    const key = getMonthKey(day.date);
    if (!monthMap[key]) monthMap[key] = [];
    monthMap[key].push(day);
  }
  const months = Object.entries(monthMap);
  const monthKeys = months.map(([k]) => k);

  const todayMonthKey =
    monthKeys.find((k) => todayISO.startsWith(k)) ?? monthKeys[0];
  const [activeMonth, setActiveMonth] = useState<string>(
    todayMonthKey ?? monthKeys[0],
  );
  const todayRef = useRef<HTMLDivElement | null>(null);

  const jumpToNow = () => {
    if (todayMonthKey) setActiveMonth(todayMonthKey);
    setTimeout(
      () =>
        todayRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      80,
    );
  };

  const toggleStatus = (
    date: string,
    subjectId: string,
    status: AttendanceStatus,
  ) => {
    const updated: AttendanceRecord = {
      ...attendance,
      [date]: {
        ...(attendance[date] ?? {}),
        [subjectId]: status,
      },
    };

    setAttendance(updated);
    saveToStorage("attendance", updated);
  };

  const activeDays = monthMap[activeMonth] ?? [];
  const weeks = buildWeeks(activeDays);
  const monthLabel = activeDays.length ? getMonthLabel(activeDays[0].date) : "";

  const STATUS_OPTIONS: AttendanceStatus[] = [
    "present",
    "absent",
    "od",
    "cancelled",
  ];

  return (
    <>
      <div className="cal-root">
        <div className="cal-nav">
          <div className="cal-nav-scroll">
            {months.map(([key, days]) => (
              <button
                key={key}
                className={`cal-month-btn ${activeMonth === key ? "active" : ""}`}
                onClick={() => setActiveMonth(key)}
              >
                {getMonthShort(days[0].date)}
              </button>
            ))}
          </div>
          {todayMonthKey && (
            <button className="cal-now-btn" onClick={jumpToNow}>
              ⟳ Now
            </button>
          )}
        </div>

        {activeDays.length > 0 && (
          <div className="cal-month-block">
            <div className="cal-month-header">
              <span className="cal-month-title">{monthLabel}</span>
            </div>

            <div className="cal-weekday-row">
              {WEEKDAY_LABELS.map((lbl, i) => (
                <div
                  key={lbl}
                  className={`cal-weekday-label ${i >= 5 ? "is-weekend" : ""}`}
                >
                  {lbl}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="cal-week-row">
                {week.map((day, di) => {
                  if (!day)
                    return (
                      <div
                        key={`empty-${wi}-${di}`}
                        className="cal-cell is-empty"
                      />
                    );
                  const isToday = day.date === todayISO;
                  const isWeekend = di >= 5;
                  const subjectIds: string[] =
                    timetable[getEffectiveWeekday(day)] || [];
                  const isInstructional = day.type === "instructional";
                  const { day: dayNum, month, year } = formatDate(day.date);
                  return (
                    <div
                      key={day.date}
                      ref={isToday ? todayRef : null}
                      className={`cal-cell${!isInstructional ? " non-instructional" : ""}${isWeekend ? " is-weekend" : ""}${isToday ? " is-today" : ""}`}
                    >
                      {isToday && (
                        <span className="cal-today-badge">Today</span>
                      )}
                      <div className="cal-date-block">
                        <div className="cal-date-main">
                          <span
                            className={`cal-day-num${isToday ? " is-today" : ""}`}
                          >
                            {dayNum}
                          </span>
                          <div className="cal-month-year">
                            <span className="cal-month-sm">{month}</span>
                            <span className="cal-year-sm">{year}</span>
                          </div>
                        </div>
                        <span className="cal-day-type">
                          {day.title
                            ?.replace(" Day Order", "\nOrder")
                            .replace("Instructional", "Inst.")}
                        </span>
                      </div>
                      <div className="cal-subjects">
                        {!isInstructional && (
                          <span className="cal-no-class">—</span>
                        )}
                        {isInstructional &&
                          subjectIds.map((subjectId: string) => {
                            const sub = subjects.find(
                              (s: Subject) => s.id === subjectId,
                            );
                            if (!sub) return null;
                            const currentStatus: string | undefined =
                              attendance?.[day.date]?.[sub.id];
                            return (
                              <div
                                key={sub.id}
                                className={`cal-subject-card${currentStatus ? ` dot-${currentStatus}` : ""}`}
                              >
                                <div className="cal-subject-header">
                                  <span
                                    className="cal-subject-name"
                                    onClick={() => openModal(sub)}
                                    title={sub.name}
                                  >
                                    {sub.name}
                                  </span>
                                  <span
                                    className={`cal-subject-type ${sub.type === "lab" ? "type-lab" : "type-theory"}`}
                                  >
                                    {sub.type === "lab" ? "Lab" : "Th"}
                                  </span>
                                </div>
                                <div className="cal-status-row">
                                  {STATUS_OPTIONS.map((status) => (
                                    <button
                                      key={status}
                                      onClick={() =>
                                        toggleStatus(day.date, sub.id, status)
                                      }
                                      className={`status-btn ${currentStatus === status ? STATUS_CONFIG[status].activeClass : ""}`}
                                      title={STATUS_CONFIG[status].label}
                                    >
                                      {status === "cancelled"
                                        ? "cncl"
                                        : status === "present"
                                          ? "pres"
                                          : status}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="cal-mobile-list">
              {weeks.map((week, wi) => (
                <div key={wi} className="cal-mob-week">
                  {week.map((day, di) => {
                    if (!day) return null; // skip empty padding cells entirely on mobile
                    const isToday = day.date === todayISO;
                    const isWeekend = di >= 5;
                    const subjectIds: string[] =
                      timetable[getEffectiveWeekday(day)] || [];
                    const isInstructional = day.type === "instructional";
                    const { day: dayNum, weekdayIdx } = formatDate(day.date);

                    return (
                      <div
                        key={day.date}
                        ref={isToday ? todayRef : null}
                        className={`cal-mob-day${!isInstructional ? " non-instructional" : ""}${isWeekend ? " is-weekend" : ""}${isToday ? " is-today" : ""}`}
                      >
                        <div className="cal-mob-date-col">
                          <span
                            className={`cal-mob-day-num${isToday ? " is-today" : ""}`}
                          >
                            {dayNum}
                          </span>
                          <span
                            className={`cal-mob-day-name${isWeekend ? " is-weekend" : ""}`}
                          >
                            {WEEKDAY_LABELS[weekdayIdx]}
                          </span>
                          {isToday && <span className="cal-mob-today-dot" />}
                          {isInstructional && (
                            <span className="cal-mob-day-type">
                              {day.title
                                ?.replace("Instructional Day", "Inst.")
                                .replace(" Day Order", "\nOrd.")
                                .replace("First ", "")}
                            </span>
                          )}
                        </div>

                        <div className="cal-mob-subjects-col">
                          {!isInstructional && (
                            <span className="cal-mob-no-class">— no class</span>
                          )}
                          {isInstructional && subjectIds.length === 0 && (
                            <span className="cal-mob-no-class">
                              — no subjects
                            </span>
                          )}
                          {isInstructional &&
                            subjectIds.map((subjectId: string) => {
                              const sub = subjects.find(
                                (s: Subject) => s.id === subjectId,
                              );
                              if (!sub) return null;
                              const currentStatus: string | undefined =
                                attendance?.[day.date]?.[sub.id];
                              return (
                                <div
                                  key={sub.id}
                                  className={`cal-mob-subject-card${currentStatus ? ` dot-${currentStatus}` : ""}`}
                                >
                                  <div className="cal-mob-subject-top">
                                    <span
                                      className="cal-mob-subject-name"
                                      onClick={() => openModal(sub)}
                                      title={sub.name}
                                    >
                                      {sub.name}
                                    </span>
                                    <span
                                      className={`cal-mob-subject-type ${sub.type === "lab" ? "type-lab" : "type-theory"}`}
                                    >
                                      {sub.type === "lab" ? "Lab" : "Th"}
                                    </span>
                                  </div>
                                  <div className="cal-mob-status-row">
                                    {STATUS_OPTIONS.map((status) => (
                                      <button
                                        key={status}
                                        onClick={() =>
                                          toggleStatus(day.date, sub.id, status)
                                        }
                                        className={`cal-mob-status-btn ${currentStatus === status ? STATUS_CONFIG[status].activeClass : ""}`}
                                        title={STATUS_CONFIG[status].label}
                                      >
                                        {status === "cancelled"
                                          ? "cncl"
                                          : status === "present"
                                            ? "pres"
                                            : status}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
