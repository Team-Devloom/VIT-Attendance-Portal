"use client";

import { useState, useEffect, useCallback } from "react";
import {
  loadFromStorage,
  startAutoSave,
  stopAutoSave,
  registerAutoSaveCallback,
  forceSaveToFirebase,
} from "@/app/lib/storage";

import TimetableEditor from "@/app/components/TimetableEditor";
import CalendarView from "@/app/components/CalendarView";
import AttendanceModal from "@/app/components/AttendanceModal";
import Footer from "./components/Footer";
import Toast from "./components/Toast";

import { DAILY_CALENDAR } from "@/app/vit-winter-2025-26-complete";
import type { Timetable } from "@/app/types/attendance";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import { signOut, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import type { Subject, AttendanceRecord } from "@/app/types/attendance";

const defaultTimetable: Timetable = { 1: [], 2: [], 3: [], 4: [], 5: [] };

export default function Page() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [timetable, setTimetable] = useState<Timetable>(defaultTimetable);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("Data auto-saved");
  const router = useRouter();

  const showToast = useCallback((msg = "Data auto-saved") => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        const subjects = await loadFromStorage("subjects", []);
        const attendance = await loadFromStorage("attendance", {});
        const timetable = await loadFromStorage("timetable", defaultTimetable);

        setSubjects(subjects);
        setAttendance(attendance);
        setTimetable(timetable);

        // Register toast callback and start auto-save
        registerAutoSaveCallback(() => showToast("Data auto-saved"));
        startAutoSave();
      }

      setAuthChecked(true);
    });

    return () => {
      unsubscribe();
      stopAutoSave();
    };
  }, [router, showToast]);

  const handleForceSave = async () => {
    await forceSaveToFirebase();
    showToast("Saved to cloud ☁️");
  };

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

  if (!authChecked) return null;

  return (
    <div className="p-6 space-y-6">
      <TimetableEditor
        subjects={subjects}
        setSubjects={setSubjects}
        timetable={timetable}
        setTimetable={setTimetable}
        onForceSave={handleForceSave}
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

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
