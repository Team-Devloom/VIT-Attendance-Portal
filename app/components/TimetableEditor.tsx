"use client";

import { useState } from "react";
import { Subject } from "@/app/types/attendance";
import { saveToStorage } from "@/app/lib/storage";
import { v4 as uuid } from "uuid";
import type { Timetable, Weekday } from "@/app/types/attendance";

import "./TimetableEditor.css";

const weekdays: { label: string; value: Weekday }[] = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
];

interface TimetableEditorProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  timetable: Timetable;
  setTimetable: React.Dispatch<React.SetStateAction<Timetable>>;
}

export default function TimetableEditor({
  subjects,
  setSubjects,
  timetable,
  setTimetable,
}: TimetableEditorProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"theory" | "lab">("theory");

  const addSubject = () => {
    if (!name.trim()) return;
    const newSub: Subject = { id: uuid(), name, type };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    saveToStorage("subjects", updated);
    setName("");
  };

  const onDrop = (day: Weekday, subjectId: string) => {
    const updated = {
      ...timetable,
      [day]: [...(timetable[day] || []), subjectId],
    };
    setTimetable(updated);
    saveToStorage("timetable", updated);
  };

  return (
    <>
      <div className="tt-root">
        <div className="tt-creator">
          <span className="tt-section-label">Create Subject</span>
          <div className="tt-creator-row">
            <input
              className="tt-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
              placeholder="Subject name"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
            />
            <div className="tt-type-group">
              <button
                className={`tt-type-btn ${type === "theory" ? "active-theory" : ""}`}
                onClick={() => setType("theory")}
              >
                Theory
              </button>
              <button
                className={`tt-type-btn ${type === "lab" ? "active-lab" : ""}`}
                onClick={() => setType("lab")}
              >
                Lab
              </button>
            </div>
            <button onClick={addSubject} className="tt-add-btn">
              + Add Subject
            </button>
          </div>
        </div>

        <div className="tt-pool">
          <span className="tt-section-label">Subject Pool</span>
          <div className="tt-pool-chips">
            {subjects.length === 0 && (
              <span
                style={{
                  color: "#374151",
                  fontSize: "0.8rem",
                  fontFamily: "'Geist Mono', monospace",
                }}
              >
                No subjects yet — create one above
              </span>
            )}
            {subjects.map((sub: Subject) => (
              <div
                key={sub.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("subjectId", sub.id)}
                className={`tt-chip ${sub.type === "lab" ? "tt-chip-lab" : "tt-chip-theory"}`}
              >
                <span>{sub.name}</span>
                <span className="tt-chip-badge">{sub.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tt-grid">
          {weekdays.map((day) => {
            const daySubjects = (timetable[day.value] || []) as string[];
            return (
              <div
                key={day.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).classList.add("drag-over");
                }}
                onDragLeave={(e) => {
                  (e.currentTarget as HTMLElement).classList.remove(
                    "drag-over",
                  );
                }}
                onDrop={(e) => {
                  (e.currentTarget as HTMLElement).classList.remove(
                    "drag-over",
                  );
                  const subjectId = e.dataTransfer.getData("subjectId");
                  onDrop(day.value, subjectId);
                }}
                className="tt-day-col"
              >
                <div className="tt-day-header">
                  <span className="tt-day-name">{day.label}</span>
                  <span className="tt-day-count">{daySubjects.length}</span>
                </div>

                <div className="tt-day-subjects-scroll">
                  {daySubjects.map((id: string) => {
                    const sub = subjects.find((s: Subject) => s.id === id);
                    if (!sub) return null;
                    return (
                      <div
                        key={id}
                        className={`tt-subject-pill ${sub.type === "lab" ? "tt-subject-pill-lab" : "tt-subject-pill-theory"}`}
                      >
                        <span className="tt-pill-name">{sub.name}</span>
                        <span className="tt-pill-badge">{sub.type}</span>
                      </div>
                    );
                  })}
                </div>

                {daySubjects.length === 0 && (
                  <span className="tt-drop-hint">drop here</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
