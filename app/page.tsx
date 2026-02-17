"use client";

import { useState, useEffect } from "react";
import { loadFromStorage } from "@/app/lib/storage";

import TimetableEditor from "@/app/components/TimetableEditor";
import CalendarView from "@/app/components/CalendarView";
import AttendanceModal from "@/app/components/AttendanceModal";
import Footer from "./components/Footer";

import { DAILY_CALENDAR } from "@/app/vit-winter-2025-26-complete";
import type { Timetable } from "@/app/types/attendance";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import { signOut, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import type { Subject, AttendanceRecord } from "@/app/types/attendance";

const defaultTimetable: Timetable = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
};

export default function Page() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [timetable, setTimetable] = useState<Timetable>(defaultTimetable);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const subjects = await loadFromStorage("subjects", []);
      const attendance = await loadFromStorage("attendance", {});
      const timetable = await loadFromStorage("timetable", defaultTimetable);

      setSubjects(subjects);
      setAttendance(attendance);
      setTimetable(timetable);
    });

    return () => unsub();
  }, []);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);

      localStorage.clear();

      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "This will permanently delete your account and all attendance data. Continue?",
    );

    if (!confirmDelete) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, "users", user.uid));

      await deleteUser(user);

      localStorage.clear();

      router.push("/login");
    } catch (error: any) {
      console.error("Delete failed:", error);

      if (error.code === "auth/requires-recent-login") {
        alert("Please log out and log in again before deleting your account.");
      }
    }
  };

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

      <Footer onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />
    </div>
  );
}
