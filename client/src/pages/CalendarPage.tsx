import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users, Clock, DollarSign } from "lucide-react";
import { CLASS_DEFINITIONS, ClassType } from "@shared/classes";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface ClassSession {
  date: string;
  dayOfWeek: "Friday" | "Saturday";
  classType: ClassType;
  title: string;
  shortTitle: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  priceAmount: number;
  registrationCount: number;
  availableSpots: number;
  isFull: boolean;
  isPast: boolean;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-based

  const { data, isLoading } = useQuery<{ sessions: ClassSession[] }>({
    queryKey: ["/api/classes/sessions", viewYear, viewMonth],
    queryFn: async () => {
      const res = await fetch(`/api/classes/sessions?year=${viewYear}&month=${viewMonth}`);
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
  });

  // Build a map: date string → sessions[]
  const sessionsByDate = new Map<string, ClassSession[]>();
  for (const s of data?.sessions ?? []) {
    if (!sessionsByDate.has(s.date)) sessionsByDate.set(s.date, []);
    sessionsByDate.get(s.date)!.push(s);
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  function todayStr() {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  function dateStr(day: number) {
    return `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const isPast = (day: number) => new Date(viewYear, viewMonth - 1, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]">
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Class Schedule</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Weekly group study sessions every Friday &amp; Saturday — Texas Life Insurance and Property &amp; Casualty licensing exam prep.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-white/80">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 2-hour sessions · 8AM–10AM &amp; 10AM–12PM CT</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Max 20 students per session</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> $75 per session · paid online</span>
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section className="py-12 bg-background flex-1">
        <div className="max-w-5xl mx-auto px-4">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Life Insurance (8–10 AM)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Property &amp; Casualty (10AM–12PM)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-400 inline-block" /> Full</span>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Loading schedule…</div>
          ) : (
            <div className="grid grid-cols-7 border-l border-t border-border/50">
              {cells.map((day, idx) => {
                const ds = day ? dateStr(day) : null;
                const sessions = ds ? (sessionsByDate.get(ds) ?? []) : [];
                const isToday = ds === todayStr();
                const past = day ? isPast(day) : false;

                return (
                  <div
                    key={idx}
                    className={`border-r border-b border-border/50 min-h-[110px] p-1.5 ${!day ? "bg-muted/20" : past ? "bg-muted/10" : "bg-background"}`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-[#e85d40] text-white" : "text-muted-foreground"}`}>
                          {day}
                        </span>
                        <div className="space-y-1">
                          {sessions.map(s => {
                            const isLI = s.classType === "life-insurance";
                            const canRegister = !past && !s.isFull && !s.isPast;
                            const badge = (s.isFull || s.isPast)
                              ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                              : isLI
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 cursor-pointer"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 hover:bg-orange-200 cursor-pointer";

                            const inner = (
                              <div className={`rounded px-1.5 py-1 text-[10px] leading-tight transition-colors ${badge}`}>
                                <div className="font-semibold truncate">{s.shortTitle}</div>
                                <div className="opacity-75">{formatTime(s.startTime)}</div>
                                <div className="opacity-75">
                                  {s.isFull ? "FULL" : s.isPast ? "Ended" : `${s.availableSpots} left`}
                                </div>
                              </div>
                            );

                            return canRegister ? (
                              <Link key={s.classType} href={`/classes/${s.classType}/${s.date}`} className="block">
                                {inner}
                              </Link>
                            ) : (
                              <div key={s.classType}>{inner}</div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Info section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {(Object.entries(CLASS_DEFINITIONS) as [ClassType, typeof CLASS_DEFINITIONS[ClassType]][]).map(([type, def]) => (
            <div key={type} className="bg-card border border-border/50 rounded-lg p-6 space-y-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${type === "life-insurance" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                <Users className={`w-5 h-5 ${type === "life-insurance" ? "text-blue-700" : "text-orange-600"}`} />
              </div>
              <h3 className="font-semibold text-lg">{def.title}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Days:</span> Every Friday &amp; Saturday</p>
                <p><span className="font-medium text-foreground">Time:</span> {formatTime(def.startTime)} – {formatTime(def.endTime)} CT</p>
                <p><span className="font-medium text-foreground">Duration:</span> 2 hours</p>
                <p><span className="font-medium text-foreground">Price:</span> $75 per session</p>
                <p><span className="font-medium text-foreground">Capacity:</span> 20 students max</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
