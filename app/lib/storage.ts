import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

/* ── LOCAL ── */

export const saveToLocal = (key: string, data: unknown) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const loadFromLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

/* ── FIREBASE ── */

const getUserDocRef = () => {
  const user = auth.currentUser;
  if (!user) return null;
  return doc(db, "users", user.uid);
};

export const saveToFirebase = async (): Promise<void> => {
  try {
    const ref = getUserDocRef();
    if (!ref) return;

    const data = {
      subjects: loadFromLocal("subjects", []),
      attendance: loadFromLocal("attendance", {}),
      timetable: loadFromLocal("timetable", {}),
    };

    await setDoc(ref, { data });
  } catch (err) {
    console.error("Firebase save failed:", err);
  }
};

export const loadFromFirebase = async <T>(fallback: T): Promise<T> => {
  try {
    const ref = getUserDocRef();
    if (!ref) return fallback;

    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data().data as T;
    return fallback;
  } catch (err) {
    console.error("Firebase load failed:", err);
    return fallback;
  }
};

/* ── DIRTY FLAG & AUTO-SAVE ── */

let isDirty = false;
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
let onAutoSaveCallback: (() => void) | null = null;

export const registerAutoSaveCallback = (cb: () => void) => {
  onAutoSaveCallback = cb;
};

export const startAutoSave = () => {
  if (autoSaveTimer) return; // already running
  autoSaveTimer = setInterval(async () => {
    if (!isDirty) return;
    await saveToFirebase();
    isDirty = false;
    onAutoSaveCallback?.();
  }, 60_000); // every 60 seconds
};

export const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
};

/* ── HYBRID ── */

export const saveToStorage = (key: string, data: unknown) => {
  // Always save to local immediately
  saveToLocal(key, data);
  // Mark dirty for next Firebase auto-save
  isDirty = true;
};

export const forceSaveToFirebase = async (): Promise<void> => {
  await saveToFirebase();
  isDirty = false;
};

export const loadFromStorage = async <T>(
  key: string,
  fallback: T,
): Promise<T> => {
  const firebaseData = await loadFromFirebase<{
    subjects: unknown;
    attendance: unknown;
    timetable: unknown;
  } | null>(null);

  if (firebaseData && firebaseData[key as keyof typeof firebaseData]) {
    const value = firebaseData[key as keyof typeof firebaseData] as T;
    saveToLocal(key, value);
    return value;
  }

  return loadFromLocal(key, fallback);
};
