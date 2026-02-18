import {
  calculateSubjectStats,
  EXAM_DATES,
  getAttendanceHistory,
} from "@/app/lib/attendanceLogic";
import {
  Subject,
  DailyCalendarEntry,
  AttendanceRecord,
  AttendanceStatus,
} from "../types/attendance";

import "./AttendanceModal.css";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
  return `${day} ${month}`;
}

interface AttendanceModalProps {
  subject: Subject | null;
  calendar: DailyCalendarEntry[];
  attendance: AttendanceRecord;
  timetable: Record<number, string[]>;
  onClose: () => void;
}

export default function AttendanceModal({
  subject,
  calendar,
  attendance,
  timetable,
  onClose,
}: AttendanceModalProps) {
  if (!subject) return null;

  const todayISO = new Date().toISOString().split("T")[0];

  const overallStats = calculateSubjectStats(
    subject,
    calendar,
    attendance,
    timetable,
  );
  const presentStats = calculateSubjectStats(
    subject,
    calendar,
    attendance,
    timetable,
    todayISO,
  );
  const cat1Stats = calculateSubjectStats(
    subject,
    calendar,
    attendance,
    timetable,
    EXAM_DATES.CAT1_START,
  );
  const cat2Stats = calculateSubjectStats(
    subject,
    calendar,
    attendance,
    timetable,
    EXAM_DATES.CAT2_START,
  );

  const overallHistory = getAttendanceHistory(
    subject,
    calendar,
    attendance,
    timetable,
  );
  const presentHistory = getAttendanceHistory(
    subject,
    calendar,
    attendance,
    timetable,
    todayISO,
  );
  const cat1History = getAttendanceHistory(
    subject,
    calendar,
    attendance,
    timetable,
    EXAM_DATES.CAT1_START,
  );
  const cat2History = getAttendanceHistory(
    subject,
    calendar,
    attendance,
    timetable,
    EXAM_DATES.CAT2_START,
    EXAM_DATES.CAT1_START,
  );

  const cat1Allowed = Math.floor(cat1Stats.total * 0.25);
  const cat1Safe = cat1Allowed - cat1Stats.absent;
  const cat1Unused = Math.max(cat1Safe, 0);

  const cat2Allowed = Math.floor(cat2Stats.total * 0.25);
  const cat2BaseSafe = cat2Allowed - cat2Stats.absent;
  const cat2Safe = cat2BaseSafe + cat1Unused;

  const getPctColor = (p: number) =>
    p >= 85 ? "#2dd4bf" : p >= 75 ? "#fbbf24" : "#f87171";
  const getPctBg = (p: number) =>
    p >= 85 ? "#0d2926" : p >= 75 ? "#2d2208" : "#2d1515";
  const getPctBorder = (p: number) =>
    p >= 85 ? "#134e4a" : p >= 75 ? "#7c2d12" : "#7f1d1d";

  const statBlocks = [
    {
      label: "Before CAT 1",
      stats: cat1Stats,
      extra: { label: "Safe absences left", value: cat1Safe },
    },
    {
      label: "Before CAT 2",
      stats: cat2Stats,
      extra: { label: "Safe absences left", value: cat2Safe },
    },
    { label: "Till Today", stats: presentStats, extra: null },
    { label: "Overall Semester", stats: overallStats, extra: null },
  ];

  const examSequence = [
    { name: "CAT 1", date: EXAM_DATES.CAT1_START },
    { name: "CAT 2", date: EXAM_DATES.CAT2_START },
    { name: "LAB FAT", date: EXAM_DATES.LAB_FAT_START },
  ];
  const today = new Date().toISOString().split("T")[0];
  const activeExam =
    examSequence.find((exam) => exam.date > today) ||
    examSequence[examSequence.length - 1];

  const cat1StatsHeader = calculateSubjectStats(
    subject,
    calendar,
    attendance,
    timetable,
    EXAM_DATES.CAT1_START,
  );
  const cat1AllowedHeader = Math.floor(cat1StatsHeader.total * 0.25);
  const cat1UnusedHeader = Math.max(cat1Allowed - cat1StatsHeader.absent, 0);

  const nextExamStats = calculateSubjectStats(
    subject,
    calendar,
    attendance,
    timetable,
    activeExam.date,
  );
  const nextAllowed = Math.floor(nextExamStats.total * 0.25);
  let safeTillNext = nextAllowed - nextExamStats.absent;
  if (activeExam.name !== "CAT 1") safeTillNext += cat1Unused;
  safeTillNext = Math.max(safeTillNext, 0);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.2rem",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span className="modal-subject-name">{subject.name}</span>
                <span
                  className={`modal-subject-badge ${subject.type === "lab" ? "badge-lab" : "badge-theory"}`}
                >
                  {subject.type}
                </span>
              </div>

              <div className="modal-missable">
                You can miss another{" "}
                <span style={{ color: "#818cf8", fontWeight: 700 }}>
                  {safeTillNext}
                </span>{" "}
                classes until {activeExam.name} to maintain 75%
              </div>
            </div>

            <button className="modal-close-btn" onClick={onClose}>
              ✕ Close
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-stats-col">
              <span className="modal-section-label">Attendance Breakdown</span>

              {statBlocks.map(({ label, stats, extra }) => {
                const pct = stats.percentage;
                const color = getPctColor(pct);
                const bg = getPctBg(pct);
                const border = getPctBorder(pct);
                return (
                  <div
                    key={label}
                    className="stat-block"
                    style={{ borderColor: border + "40" }}
                  >
                    <span className="stat-block-title">{label}</span>
                    <div className="stat-pct-row">
                      <span className="stat-pct-pill" style={{ color }}>
                        {pct}%
                      </span>
                      <div className="stat-pct-bar-wrap">
                        <div
                          className="stat-pct-bar-fill"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                    <div className="stat-pills-row">
                      <span className="stat-mini-pill pill-total">
                        {stats.total} total
                      </span>
                      <span className="stat-mini-pill pill-present">
                        {stats.present} present
                      </span>
                      <span className="stat-mini-pill pill-absent">
                        {stats.absent} absent
                      </span>
                      {stats.od > 0 && (
                        <span className="stat-mini-pill pill-od">
                          {stats.od} OD
                        </span>
                      )}
                      {extra && (
                        <span className="stat-mini-pill pill-safe">
                          {extra.value} safe left
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-history-col">
              <span className="modal-section-label">Absence / OD Log</span>
              {[
                { title: "Before CAT 1", history: cat1History },
                { title: "Before CAT 2", history: cat2History },
                { title: "Till Today", history: presentHistory },
                { title: "Overall Semester", history: overallHistory },
              ].map(({ title, history }) => (
                <HistoryBlock key={title} title={title} history={history} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface HistoryItem {
  date: string;
  status: AttendanceStatus;
}

interface HistoryBlockProps {
  title: string;
  history: HistoryItem[];
}

function HistoryBlock({ title, history }: HistoryBlockProps) {
  return (
    <div className="history-block">
      <span className="history-block-title">{title}</span>
      {history.length === 0 ? (
        <span className="history-empty">— no absences or OD</span>
      ) : (
        <div className="history-chips">
          {history.map((item) => (
            <span
              key={item.date}
              className={`history-chip ${item.status === "absent" ? "chip-absent" : "chip-od"}`}
              title={item.status}
            >
              {formatDate(item.date)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
