import {
  Subject,
  AttendanceRecord,
  DailyCalendarEntry,
  AttendanceStatus,
} from "@/app/types/attendance";

export const isInstructional = (day: DailyCalendarEntry) =>
  day.type === "instructional";

export const getSubjectClassWeight = (subject: Subject) =>
  subject.type === "lab" ? 2 : 1;

const weekdayMap: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

export function getEffectiveWeekday(day: DailyCalendarEntry): number {
  const order = day.dayOrder as string | undefined;

  if (order) {
    const keys = Object.keys(weekdayMap) as (keyof typeof weekdayMap)[];

    for (const key of keys) {
      if (order.includes(key)) {
        return weekdayMap[key];
      }
    }
  }

  const jsDay = new Date(day.date).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function calculateSubjectStats(
  subject: Subject,
  calendar: DailyCalendarEntry[],
  attendance: AttendanceRecord,
  timetable: Record<number, string[]>,
  untilDate?: string,
) {
  let total = 0;
  let present = 0;
  let absent = 0;
  let od = 0;
  let cancelled = 0;

  calendar.forEach((day) => {
    if (day.type !== "instructional") return;
    if (untilDate && day.date > untilDate) return;

    const effectiveWeekday = getEffectiveWeekday(day);
    const subjectIds = timetable[effectiveWeekday] || [];

    // 🔥 Only count if subject exists in that weekday timetable
    if (!subjectIds.includes(subject.id)) return;

    const weight = subject.type === "lab" ? 2 : 1;

    const status = attendance[day.date]?.[subject.id] ?? "present";

    if (status === "cancelled") {
      cancelled += weight;
      return;
    }

    total += weight;

    if (status === "present") present += weight;
    if (status === "absent") absent += weight;
    if (status === "od") {
      present += weight;
      od += weight;
    }
  });

  const percentage = total === 0 ? 100 : (present / total) * 100;

  return {
    total,
    present,
    absent,
    od,
    cancelled,
    percentage: Number(percentage.toFixed(2)),
  };
}

export function safeAbsences(total: number, currentAbsent: number) {
  const allowed = Math.floor(total * 0.25);
  return allowed - currentAbsent;
}

export const EXAM_DATES = {
  CAT1_START: "2026-01-27",
  CAT2_START: "2026-03-15",
  LAB_FAT_START: "2026-04-11",
};

function getTodayISO() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function getAttendanceSnapshot(
  subject: Subject,
  calendar: DailyCalendarEntry[],
  attendance: AttendanceRecord,
  timetable: Record<number, string[]>,
  untilDate?: string,
) {
  return calculateSubjectStats(
    subject,
    calendar,
    attendance,
    timetable,
    untilDate,
  );
}

export function getAttendanceHistory(
  subject: Subject,
  calendar: DailyCalendarEntry[],
  attendance: AttendanceRecord,
  timetable: Record<number, string[]>,
  untilDate?: string,
  startDate?: string,
): { date: string; status: AttendanceStatus }[] {
  const history: { date: string; status: AttendanceStatus }[] = [];

  calendar.forEach((day) => {
    if (day.type !== "instructional") return;
    if (untilDate && day.date > untilDate) return;
    if (startDate && day.date < startDate) return;

    const effectiveWeekday = getEffectiveWeekday(day);
    const subjectIds = timetable[effectiveWeekday] || [];

    if (!subjectIds.includes(subject.id)) return;

    const status = attendance[day.date]?.[subject.id];

    // Narrowing ensures proper union type
    if (status === "absent" || status === "od") {
      history.push({
        date: day.date,
        status, // now correctly inferred as AttendanceStatus
      });
    }
  });

  return history;
}
