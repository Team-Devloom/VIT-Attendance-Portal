export type AttendanceStatus = "present" | "absent" | "od" | "cancelled";

export interface Subject {
  id: string;
  name: string;
  type: "theory" | "lab";
}

export interface DailyCalendarEntry {
  date: string;
  dayName: string;
  type: DayType;
  title: string;
  dayOrder?: string;
}

export interface AttendanceRecord {
  [date: string]: {
    [subjectId: string]: AttendanceStatus;
  };
}

export type Weekday = 1 | 2 | 3 | 4 | 5;

export type Timetable = Record<Weekday, string[]>;

export type DayType =
  | "instructional"
  | "holiday"
  | "exam"
  | "vacation"
  | "festival"
  | "no_instruction"
  | "academic_process";
