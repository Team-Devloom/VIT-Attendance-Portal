"use client";

import { useState } from "react";
import { loadFromStorage } from "@/app/lib/storage";
import TimetableEditor from "@/app/components/TimetableEditor";
import CalendarView from "@/app/components/CalendarView";
import AttendanceModal from "@/app/components/AttendanceModal";
import { DAILY_CALENDAR } from "@/app/vit-winter-2025-26-complete";
import type { Timetable } from "@/app/types/attendance";

import type { Subject, AttendanceRecord } from "@/app/types/attendance";

const defaultTimetable: Timetable = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
};

export default function Page() {
  const [subjects, setSubjects] = useState<Subject[]>(
    loadFromStorage("subjects", []),
  );

  const [attendance, setAttendance] = useState<AttendanceRecord>(
    loadFromStorage("attendance", {}),
  );

  const [timetable, setTimetable] = useState<Timetable>(
    loadFromStorage("timetable", defaultTimetable),
  );

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  return (
    <div className="p-6 space-y-6">
      <TimetableEditor
        subjects={subjects}
        setSubjects={setSubjects}
        timetable={timetable}
        setTimetable={setTimetable}
      />

      <CalendarView
        calendar={DAILY_CALENDAR}
        subjects={subjects}
        timetable={timetable}
        attendance={attendance}
        setAttendance={setAttendance}
        openModal={setSelectedSubject}
      />

      <AttendanceModal
        subject={selectedSubject}
        calendar={DAILY_CALENDAR}
        attendance={attendance}
        timetable={timetable}
        onClose={() => setSelectedSubject(null)}
      />
    </div>
  );
}
