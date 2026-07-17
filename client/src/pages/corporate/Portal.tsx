import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  LogIn, LogOut, Building2, AlertTriangle, CheckCircle2, Calendar, Clock,
  ChevronRight, ChevronLeft, AlertCircle, Loader2, CalendarPlus, LayoutDashboard,
  History, Settings, Download, MessageSquare, RefreshCw, RotateCcw, X,
  Users, Phone, Mail, MapPin, Send, FileText, TrendingUp, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  appointmentCode: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone: string | null;
  appointmentDatetime: string;
  numSigners: number;
  numDocuments: number;
  estimatedCertificates: number | null;
  idType: string | null;
  needWitnesses: boolean;
  needPrinting: boolean;
  needScanEmail: boolean;
  specialInstructions: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface UsageData {
  monthYear: string;
  actsUsed: number;
  actsIncluded: number;
  overageActs: number;
  overageChargeCents: number;
}

interface PortalAccount {
  accountCode: string;
  companyName: string;
  planTier: string | null;
  status: string;
}

interface FullAccount extends PortalAccount {
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string | null;
  authorizedUsers: { name: string; email: string }[];
  businessAddress: string;
  city: string;
  state: string;
  zip: string;
  needsScanToEmail: boolean | null;
  enrolledAt: string | null;
}

interface TimeSlot { time: string; label: string; }
type BookStep = "form" | "success";
type PortalView = "dashboard" | "book" | "history" | "settings";

// ─── Constants ────────────────────────────────────────────────────────────────

const ID_TYPES = [
  "Driver's License", "State ID Card", "U.S. Passport", "U.S. Passport Card",
  "Military ID", "Permanent Resident Card", "Foreign Passport",
];

const PLAN_LIMITS: Record<string, number> = { bronze: 15, silver: 25, gold: 100 };

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const PORTAL_TOKEN_KEY = "lbs_portal_token";
const PORTAL_ACCOUNT_KEY = "lbs_portal_account";

function getToken(): string | null { return localStorage.getItem(PORTAL_TOKEN_KEY); }
function setToken(t: string): void { localStorage.setItem(PORTAL_TOKEN_KEY, t); }
function clearToken(): void {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_ACCOUNT_KEY);
}
function getSavedAccount(): PortalAccount | null {
  const raw = localStorage.getItem(PORTAL_ACCOUNT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as PortalAccount; } catch { return null; }
}
function saveAccount(acct: PortalAccount): void {
  localStorage.setItem(PORTAL_ACCOUNT_KEY, JSON.stringify(acct));
}

// ─── API Helper ───────────────────────────────────────────────────────────────

async function api(path: string, options?: RequestInit): Promise<any> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({})) as { error?: string };
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function today(): string { return new Date().toISOString().split("T")[0]; }
function isSunday(dateStr: string): boolean { return new Date(dateStr + "T12:00:00").getDay() === 0; }
function isUnauth(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("401") || msg.includes("expired") || msg.includes("unauthorized");
}

function fmtDateCT(iso: string) {
  const dt = new Date(iso);
  return {
    date: dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric" }),
    time: dt.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true }),
    full: dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", year: "numeric" }),
  };
}

function monthLabel(monthYear: string): string {
  const [y, m] = monthYear.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function downloadStatementCsv(appointments: Appointment[], month: string, companyName: string) {
  const header = "Appointment Code,Employee Name,Employee Email,Date,Time CT,Signers,Documents,Stamps,Status,Services,Admin Notes\n";
  const rows = appointments.map((a) => {
    const { date, time } = fmtDateCT(a.appointmentDatetime);
    const services = [a.needWitnesses && "Witnesses", a.needPrinting && "Printing", a.needScanEmail && "Scan-to-Email"].filter(Boolean).join("; ") || "None";
    return [
      a.appointmentCode,
      `"${a.employeeName}"`,
      a.employeeEmail,
      date,
      `${time} CT`,
      a.numSigners,
      a.numDocuments,
      a.estimatedCertificates ?? "N/A",
      a.status,
      `"${services}"`,
      `"${a.adminNotes || ""}"`,
    ].join(",");
  });
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = `LBS-Statement-${companyName.replace(/\s+/g, "-")}-${month}.csv`;
  el.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ApptStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "Scheduled", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    completed: { label: "Completed", cls: "bg-green-100 text-green-700 border-green-200" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>
      {c.label}
    </span>
  );
}

function PlanBadge({ tier }: { tier: string | null }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    bronze: { label: "Bronze", cls: "bg-amber-100 text-amber-800 border-amber-300" },
    silver: { label: "Silver", cls: "bg-slate-100 text-slate-700 border-slate-300" },
    gold: { label: "Gold", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  };
  const key = tier ?? "";
  const c = cfg[key] ?? { label: tier ?? "N/A", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({ month, appointments }: { month: string; appointments: Appointment[] }) {
  const [year, mon] = month.split("-").map(Number);
  const firstDay = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();

  const apptsByDay = useMemo(() => {
    const map = new Map<number, Appointment[]>();
    for (const appt of appointments) {
      const dt = new Date(appt.appointmentDatetime);
      // get day in CT
      const dayStr = dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", day: "numeric" });
      const day = parseInt(dayStr, 10);
      const apptMon = parseInt(dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "numeric" }), 10);
      const apptYear = parseInt(dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", year: "numeric" }), 10);
      if (apptMon === mon && apptYear === year) {
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(appt);
      }
    }
    return map;
  }, [month, appointments, mon, year]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const appts = apptsByDay.get(day);
          const hasScheduled = appts?.some((a) => a.status === "scheduled");
          const hasCompleted = appts?.some((a) => a.status === "completed");
          return (
            <div
              key={i}
              title={appts ? `${appts.length} appointment${appts.length > 1 ? "s" : ""}` : undefined}
              className={`
                w-7 h-7 flex items-center justify-center rounded-lg text-xs mx-auto font-medium
                ${hasScheduled ? "bg-blue-100 text-blue-800" : hasCompleted ? "bg-green-100 text-green-800" : "text-foreground hover:bg-[#f0f4ff]"}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-100 inline-block" /> Scheduled</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-100 inline-block" /> Completed</span>
      </div>
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (acct: PortalAccount) => void }) {
  const [accountCode, setAccountCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await api("/api/corporate/portal/login", {
        method: "POST",
        body: JSON.stringify({ accountCode: accountCode.toUpperCase(), email }),
      });
      setToken(result.token as string);
      const acct = result.account as PortalAccount;
      saveAccount(acct);
      onLogin(acct);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please check your details.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0d1b35] flex items-center justify-center px-6">
      <SEO title="Corporate Portal | LBS Notary" canonical="/corporate/portal" noIndex />
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <Building2 className="w-10 h-10 text-[#0d1b35] mx-auto" />
          <h1 className="text-xl font-bold text-[#0d1b35]">LBS Enterprise</h1>
          <p className="text-sm text-muted-foreground">Sign in to your corporate portal</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="accountCode">Account Code</Label>
            <Input id="accountCode" type="text" value={accountCode} onChange={(e) => setAccountCode(e.target.value.toUpperCase())} placeholder="LBS-ACCT-000001" className="font-mono uppercase" autoFocus autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Contact Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full bg-[#0d1b35] hover:bg-[#1a2d52] text-white" disabled={loading || !accountCode || !email}>
            <LogIn className="w-4 h-4 mr-2" />{loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Booking Form ─────────────────────────────────────────────────────────────

interface BookingFormProps {
  account: PortalAccount;
  onBack: () => void;
  onSuccess: () => void;
  prefill?: Partial<{
    employeeName: string;
    employeeEmail: string;
    employeePhone: string;
    numSigners: string;
    numDocuments: string;
    estimatedCertificates: string;
    idType: string;
    needWitnesses: boolean;
    needPrinting: boolean;
    needScanEmail: boolean;
    specialInstructions: string;
  }>;
}

function BookingForm({ account, onBack, onSuccess, prefill }: BookingFormProps) {
  const [step, setStep] = useState<BookStep>("form");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({
    employeeName: prefill?.employeeName || "",
    employeeEmail: prefill?.employeeEmail || "",
    employeePhone: prefill?.employeePhone || "",
    numSigners: prefill?.numSigners || "1",
    numDocuments: prefill?.numDocuments || "1",
    estimatedCertificates: prefill?.estimatedCertificates || "",
    idType: prefill?.idType || "",
    needWitnesses: prefill?.needWitnesses ?? false,
    needPrinting: prefill?.needPrinting ?? false,
    needScanEmail: prefill?.needScanEmail ?? false,
    specialInstructions: prefill?.specialInstructions || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ appointmentCode: string; appointmentDatetime: string } | null>(null);

  useEffect(() => {
    if (!date || isSunday(date)) { setSlots([]); return; }
    setLoadingSlots(true); setSelectedTime("");
    fetch(`/api/appointments/available-slots?date=${date}&service=notary-service`)
      .then((r) => r.json())
      .then((data) => {
        const raw: string[] = Array.isArray(data) ? data : data.slots || [];
        setSlots(raw.map((iso) => ({ time: iso, label: new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true }) })));
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.employeeName.trim()) e.employeeName = "Required";
    if (!form.employeeEmail.trim()) e.employeeEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.employeeEmail)) e.employeeEmail = "Invalid email";
    if (!date) e.date = "Select a date";
    if (date && isSunday(date)) e.date = "We are closed on Sundays";
    if (!selectedTime) e.time = "Select a time slot";
    if (!form.idType) e.idType = "Select an ID type";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/corporate/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountCode: account.accountCode,
          employeeName: form.employeeName,
          employeeEmail: form.employeeEmail,
          employeePhone: form.employeePhone || undefined,
          appointmentDatetime: selectedTime,
          numSigners: parseInt(form.numSigners, 10),
          numDocuments: parseInt(form.numDocuments, 10),
          estimatedCertificates: form.estimatedCertificates ? parseInt(form.estimatedCertificates, 10) : undefined,
          idType: form.idType,
          needWitnesses: form.needWitnesses,
          needPrinting: form.needPrinting,
          needScanEmail: form.needScanEmail,
          specialInstructions: form.specialInstructions || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Booking failed");
      setResult({ appointmentCode: json.appointmentCode, appointmentDatetime: json.appointmentDatetime });
      setStep("success");
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : "Booking failed" });
    } finally { setSubmitting(false); }
  }

  function resetForm() {
    setStep("form"); setResult(null); setDate(""); setSelectedTime("");
    setForm({ employeeName: "", employeeEmail: "", employeePhone: "", numSigners: "1", numDocuments: "1", estimatedCertificates: "", idType: "", needWitnesses: false, needPrinting: false, needScanEmail: false, specialInstructions: "" });
    setErrors({});
  }

  if (step === "success" && result) {
    const { full: fmtDate, time: fmtTime } = fmtDateCT(result.appointmentDatetime);
    return (
      <div className="max-w-lg mx-auto py-8 px-6 space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#0d1b35]">Appointment Booked!</h2>
        <p className="text-muted-foreground">A confirmation has been sent to <strong>{form.employeeEmail}</strong>.</p>
        <div className="bg-[#f8f9fb] rounded-xl p-5 text-left space-y-3">
          <div><p className="text-xs text-muted-foreground">Confirmation Code</p><p className="text-xl font-mono font-bold text-[#0d1b35]">{result.appointmentCode}</p></div>
          <div><p className="text-xs text-muted-foreground">Date &amp; Time</p><p className="text-sm font-semibold text-[#0d1b35]">{fmtDate} at {fmtTime} CT</p></div>
          <div><p className="text-xs text-muted-foreground">Location</p><p className="text-sm text-foreground">616 FM 1960 Rd W, Ste 101, Houston, TX 77090</p></div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left">
          <strong>Reminder:</strong> Bring all documents <em>unsigned</em> and a valid government-issued photo ID for all signers.
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={resetForm}>Book Another</Button>
          <Button className="flex-1 bg-[#0d1b35] hover:bg-[#1a2d52] text-white" onClick={() => { resetForm(); onSuccess(); }}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between bg-white rounded-xl border border-border/50 px-5 py-3">
        <div><p className="text-xs text-muted-foreground">Booking for</p><p className="font-semibold text-[#0d1b35]">{account.companyName}</p></div>
        <div className="flex items-center gap-2"><span className="text-xs font-mono text-muted-foreground">{account.accountCode}</span><Badge className="capitalize bg-[#0d1b35]/10 text-[#0d1b35] hover:bg-[#0d1b35]/10">{account.planTier}</Badge></div>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-[#0d1b35]">Appointment Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Employee Name" required>
            <Input value={form.employeeName} onChange={(e) => set("employeeName", e.target.value)} placeholder="Jane Smith" />
            {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
          </Field>
          <Field label="Employee Email" required>
            <Input type="email" value={form.employeeEmail} onChange={(e) => set("employeeEmail", e.target.value)} placeholder="jane@company.com" />
            {errors.employeeEmail && <p className="text-red-500 text-xs mt-1">{errors.employeeEmail}</p>}
          </Field>
          <Field label="Phone Number">
            <Input type="tel" value={form.employeePhone} onChange={(e) => set("employeePhone", e.target.value)} placeholder="(281) 555-1234" />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0d1b35]"><Calendar className="w-4 h-4" /> Date &amp; Time</div>
          <Field label="Appointment Date" required>
            <Input type="date" value={date} min={today()} onChange={(e) => { setDate(e.target.value); setErrors((er) => { const n = { ...er }; delete n.date; return n; }); }} />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            {date && isSunday(date) && <p className="text-amber-600 text-xs mt-1">We are closed on Sundays. Please select another day.</p>}
          </Field>
          {date && !isSunday(date) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Available Times (CT){loadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}</Label>
              {slots.length === 0 && !loadingSlots ? (
                <p className="text-sm text-muted-foreground">No slots available on this date. Please choose another day.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button key={s.time} onClick={() => { setSelectedTime(s.time); setErrors((er) => { const n = { ...er }; delete n.time; return n; }); }} className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${selectedTime === s.time ? "bg-[#0d1b35] text-white border-[#0d1b35]" : "bg-white text-foreground border-border hover:border-[#0d1b35]/40"}`}>{s.label}</button>
                  ))}
                </div>
              )}
              {errors.time && <p className="text-red-500 text-xs">{errors.time}</p>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[#0d1b35]">Document Details</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of Signers" required>
              <select value={form.numSigners} onChange={(e) => set("numSigners", e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Number of Documents" required>
              <select value={form.numDocuments} onChange={(e) => set("numDocuments", e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                {[1,2,3,4,5,6,7,8,9,10,15,20,25,30].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Total Stamps Required">
              <Input type="number" min="0" value={form.estimatedCertificates} onChange={(e) => set("estimatedCertificates", e.target.value)} placeholder="e.g. 4" />
            </Field>
          </div>
          <Field label="Signer ID Type" required>
            <select value={form.idType} onChange={(e) => set("idType", e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select ID type...</option>
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.idType && <p className="text-red-500 text-xs mt-1">{errors.idType}</p>}
          </Field>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-[#0d1b35]">Additional Services</div>
          {[
            { key: "needWitnesses" as const, label: "Witness(es) requested" },
            { key: "needPrinting" as const, label: "Document printing needed" },
            { key: "needScanEmail" as const, label: "Scan-to-email requested" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form[key] as boolean} onChange={(e) => set(key, e.target.checked)} className="w-4 h-4 accent-[#0d1b35]" />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>

        <Field label="Special Instructions">
          <Textarea value={form.specialInstructions} onChange={(e) => set("specialInstructions", e.target.value)} placeholder="e.g., Real estate closing, power of attorney, multiple languages needed..." rows={3} />
        </Field>

        {errors.submit && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.submit}</div>}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={submit} disabled={submitting} className="gap-1.5 bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-bold px-8">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Booking..." : "Confirm Appointment"}
          {!submitting && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

interface HistoryTabProps {
  account: PortalAccount;
  onRebook: (appt: Appointment) => void;
  onUnauth: () => void;
}

function HistoryTab({ account, onRebook, onUnauth }: HistoryTabProps) {
  const [all, setAll] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api("/api/corporate/portal/appointments")
      .then((d) => setAll(Array.isArray(d) ? d : []))
      .catch((err) => { if (isUnauth(err)) onUnauth(); })
      .finally(() => setLoading(false));
  }, [onUnauth]);

  async function cancelAppt(appt: Appointment) {
    setCancelling(appt.id);
    try {
      await api(`/api/corporate/portal/appointments/${appt.id}/cancel`, { method: "PUT" });
      setAll((prev) => prev.map((a) => a.id === appt.id ? { ...a, status: "cancelled" } : a));
      setMsg({ id: appt.id, type: "success", text: "Appointment cancelled successfully." });
    } catch (err) {
      setMsg({ id: appt.id, type: "error", text: err instanceof Error ? err.message : "Cancel failed" });
    } finally { setCancelling(null); }
  }

  const filtered = useMemo(() => {
    return all
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter((a) => !employeeFilter || a.employeeName.toLowerCase().includes(employeeFilter.toLowerCase()) || a.employeeEmail.toLowerCase().includes(employeeFilter.toLowerCase()))
      .sort((a, b) => new Date(b.appointmentDatetime).getTime() - new Date(a.appointmentDatetime).getTime());
  }, [all, statusFilter, employeeFilter]);

  const employeeNames = useMemo(() => Array.from(new Set(all.map((a) => a.employeeName))).sort(), [all]);

  if (loading) return <div className="py-24 text-center text-muted-foreground text-sm"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Input
            placeholder="Search by employee name or email..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="pl-9 text-sm"
          />
          <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          {employeeFilter && <button onClick={() => setEmployeeFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex gap-1">
          {["all", "scheduled", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-[#0d1b35] text-white" : "text-muted-foreground border border-border/50 hover:bg-[#f8f9fb]"}`}>{s}</button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Download filtered results */}
      {filtered.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-1.5 text-[#0d1b35] border-[#0d1b35]/20" onClick={() => downloadStatementCsv(filtered, "all", account.companyName)}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/50 py-16 text-center text-muted-foreground text-sm">No appointments match your filters</div>
      ) : (
        <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
          <ul className="divide-y divide-border/50">
            {filtered.map((appt) => {
              const { date, time } = fmtDateCT(appt.appointmentDatetime);
              const isExpanded = expanded === appt.id;
              const thisMsg = msg?.id === appt.id ? msg : null;
              return (
                <li key={appt.id} className="px-5 py-4">
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : appt.id)}>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#0d1b35] text-sm">{appt.employeeName}</span>
                        <ApptStatusBadge status={appt.status} />
                        <span className="text-xs font-mono text-muted-foreground">{appt.appointmentCode}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{date} at {time} CT · {appt.numDocuments} doc{appt.numDocuments !== 1 ? "s" : ""} · {appt.numSigners} signer{appt.numSigners !== 1 ? "s" : ""}</p>
                      <p className="text-xs text-muted-foreground">{appt.employeeEmail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {appt.status === "scheduled" && (
                        <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-7 px-2 text-xs gap-1" disabled={cancelling === appt.id} onClick={(e) => { e.stopPropagation(); cancelAppt(appt); }}>
                          <X className="w-3 h-3" />{cancelling === appt.id ? "..." : "Cancel"}
                        </Button>
                      )}
                      {(appt.status === "completed" || appt.status === "cancelled") && (
                        <Button size="sm" variant="outline" className="border-[#0d1b35]/20 text-[#0d1b35] h-7 px-2 text-xs gap-1" onClick={(e) => { e.stopPropagation(); onRebook(appt); }}>
                          <RotateCcw className="w-3 h-3" /> Rebook
                        </Button>
                      )}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {thisMsg && <div className={`p-3 rounded-lg text-xs ${thisMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{thisMsg.text}</div>}
                      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm bg-[#f8f9fb] rounded-xl p-4">
                        <div><dt className="text-xs text-muted-foreground">ID Type</dt><dd>{appt.idType || "N/A"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{appt.employeePhone || "N/A"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Stamps</dt><dd>{appt.estimatedCertificates ?? "N/A"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Witnesses</dt><dd>{appt.needWitnesses ? "Yes" : "No"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Printing</dt><dd>{appt.needPrinting ? "Yes" : "No"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Scan-to-Email</dt><dd>{appt.needScanEmail ? "Yes" : "No"}</dd></div>
                        {appt.completedAt && <div><dt className="text-xs text-muted-foreground">Completed</dt><dd className="text-xs">{new Date(appt.completedAt).toLocaleDateString()}</dd></div>}
                        {appt.specialInstructions && <div className="col-span-2 sm:col-span-3"><dt className="text-xs text-muted-foreground">Special Instructions</dt><dd className="text-xs mt-0.5 whitespace-pre-wrap">{appt.specialInstructions}</dd></div>}
                        {appt.adminNotes && (
                          <div className="col-span-2 sm:col-span-3">
                            <dt className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" /> Notes from LBS</dt>
                            <dd className="text-xs mt-0.5 text-[#0d1b35] whitespace-pre-wrap bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{appt.adminNotes}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ account, onUnauth }: { account: PortalAccount; onUnauth: () => void }) {
  const [fullAccount, setFullAccount] = useState<FullAccount | null>(null);
  const [loadingAcct, setLoadingAcct] = useState(true);

  // Contact update form
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactMsg, setContactMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Message LBS form
  const [msgForm, setMsgForm] = useState({ senderName: "", senderEmail: "", subject: "", message: "" });
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [msgResult, setMsgResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api("/api/corporate/portal/account")
      .then((d) => {
        setFullAccount(d as FullAccount);
        setContactForm((f) => ({ ...f, name: d.primaryContactName || "", email: d.primaryContactEmail || "", phone: d.primaryContactPhone || "" }));
        setMsgForm((f) => ({ ...f, senderName: d.primaryContactName || "", senderEmail: d.primaryContactEmail || "" }));
      })
      .catch((err) => { if (isUnauth(err)) onUnauth(); })
      .finally(() => setLoadingAcct(false));
  }, [onUnauth]);

  async function submitContactUpdate(e: React.FormEvent) {
    e.preventDefault();
    setContactSubmitting(true); setContactMsg(null);
    try {
      await api("/api/corporate/portal/message", {
        method: "POST",
        body: JSON.stringify({
          senderName: contactForm.name,
          senderEmail: contactForm.email,
          subject: `Contact Info Update Request: ${account.companyName}`,
          message: `Please update our contact information:\n\nName: ${contactForm.name}\nEmail: ${contactForm.email}\nPhone: ${contactForm.phone || "No change"}\n\nNotes: ${contactForm.notes || "None"}`,
        }),
      });
      setContactMsg({ type: "success", text: "Update request sent. LBS will review and confirm within 1 business day." });
    } catch (err) {
      setContactMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to send request" });
    } finally { setContactSubmitting(false); }
  }

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    setMsgSubmitting(true); setMsgResult(null);
    try {
      await api("/api/corporate/portal/message", {
        method: "POST",
        body: JSON.stringify(msgForm),
      });
      setMsgResult({ type: "success", text: "Message sent. We'll respond to your email within 1 business day." });
      setMsgForm((f) => ({ ...f, subject: "", message: "" }));
    } catch (err) {
      setMsgResult({ type: "error", text: err instanceof Error ? err.message : "Failed to send message" });
    } finally { setMsgSubmitting(false); }
  }

  if (loadingAcct) return <div className="py-24 text-center text-muted-foreground text-sm"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading account...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
        <h2 className="font-semibold text-[#0d1b35] flex items-center gap-2"><Building2 className="w-4 h-4" /> Account Information</h2>
        {fullAccount && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Company</dt><dd className="font-medium text-[#0d1b35]">{fullAccount.companyName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Account Code</dt><dd className="font-mono text-[#0d1b35]">{fullAccount.accountCode}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Plan</dt><dd><PlanBadge tier={fullAccount.planTier} /></dd></div>
            <div><dt className="text-xs text-muted-foreground">Status</dt><dd><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Active</span></dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Address</dt><dd>{[fullAccount.businessAddress, fullAccount.city, fullAccount.state, fullAccount.zip].filter(Boolean).join(", ")}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Scan-to-Email</dt><dd>{fullAccount.needsScanToEmail ? "Enabled" : "Not enabled"}</dd></div>
            {fullAccount.enrolledAt && <div><dt className="text-xs text-muted-foreground">Member Since</dt><dd>{new Date(fullAccount.enrolledAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</dd></div>}
          </div>
        )}
      </div>

      {/* Authorized Users */}
      {fullAccount && fullAccount.authorizedUsers.length > 0 && (
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
          <h2 className="font-semibold text-[#0d1b35] flex items-center gap-2"><Users className="w-4 h-4" /> Authorized Users</h2>
          <p className="text-xs text-muted-foreground">These employees are authorized to book appointments under your account.</p>
          <ul className="divide-y divide-border/50">
            {fullAccount.authorizedUsers.map((u, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-[#0d1b35]/10 flex items-center justify-center text-xs font-bold text-[#0d1b35]">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0d1b35]">{u.name}</p>
                  <a href={`mailto:${u.email}`} className="text-xs text-blue-600 hover:underline">{u.email}</a>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Need to add or remove authorized users? Use the message form below to request a change.</p>
        </div>
      )}

      {/* Contact Info Update */}
      <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
        <h2 className="font-semibold text-[#0d1b35] flex items-center gap-2"><Phone className="w-4 h-4" /> Update Contact Information</h2>
        <p className="text-xs text-muted-foreground">Submit a request and LBS will update your account within 1 business day.</p>
        <form onSubmit={submitContactUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Name" required><Input value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Contact Email" required><Input type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Contact Phone"><Input type="tel" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(281) 555-1234" /></Field>
          </div>
          <Field label="Additional Notes"><Textarea value={contactForm.notes} onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g., Also add authorized user Jane Smith (jane@company.com)..." rows={2} /></Field>
          {contactMsg && <div className={`p-3 rounded-lg text-sm ${contactMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{contactMsg.text}</div>}
          <Button type="submit" disabled={contactSubmitting} className="bg-[#0d1b35] hover:bg-[#1a2d52] text-white gap-1.5">
            <Send className="w-3.5 h-3.5" />{contactSubmitting ? "Sending..." : "Submit Update Request"}
          </Button>
        </form>
      </div>

      {/* Message LBS */}
      <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
        <h2 className="font-semibold text-[#0d1b35] flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Message LBS</h2>
        <p className="text-xs text-muted-foreground">Send a message directly to our team. We'll respond to your email within 1 business day.</p>
        <form onSubmit={submitMessage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Your Name" required><Input value={msgForm.senderName} onChange={(e) => setMsgForm((f) => ({ ...f, senderName: e.target.value }))} /></Field>
            <Field label="Reply-To Email" required><Input type="email" value={msgForm.senderEmail} onChange={(e) => setMsgForm((f) => ({ ...f, senderEmail: e.target.value }))} /></Field>
          </div>
          <Field label="Subject" required><Input value={msgForm.subject} onChange={(e) => setMsgForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g., Question about my statement" /></Field>
          <Field label="Message" required><Textarea value={msgForm.message} onChange={(e) => setMsgForm((f) => ({ ...f, message: e.target.value }))} placeholder="How can we help you?" rows={5} /></Field>
          {msgResult && <div className={`p-3 rounded-lg text-sm ${msgResult.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msgResult.text}</div>}
          <Button type="submit" disabled={msgSubmitting || !msgForm.subject || !msgForm.message || !msgForm.senderEmail} className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-semibold gap-1.5">
            <Send className="w-3.5 h-3.5" />{msgSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>

    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

interface DashboardProps {
  account: PortalAccount;
  onLogout: () => void;
  onUnauth: () => void;
}

function Dashboard({ account, onLogout, onUnauth }: DashboardProps) {
  const [view, setView] = useState<PortalView>("dashboard");
  const [month, setMonth] = useState(getCurrentMonth());
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [actsIncluded, setActsIncluded] = useState(PLAN_LIMITS[account.planTier ?? "bronze"] ?? 15);
  const [planTier, setPlanTier] = useState<string>(account.planTier ?? "bronze");
  const [usageLoading, setUsageLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [usageHistory, setUsageHistory] = useState<UsageData[]>([]);
  const [bookPrefill, setBookPrefill] = useState<Partial<Appointment> | undefined>();

  const loadDashboard = useCallback(() => {
    let active = true;
    setUsageLoading(true);
    api(`/api/corporate/portal/usage?month=${month}`)
      .then((d) => { if (!active) return; setUsage(d.usage); setActsIncluded(d.actsIncluded); setPlanTier(d.planTier); })
      .catch((err) => { if (isUnauth(err)) onUnauth(); })
      .finally(() => { if (active) setUsageLoading(false); });

    setApptLoading(true);
    api(`/api/corporate/portal/appointments?month=${month}`)
      .then((d) => { if (!active) return; setAppointments(Array.isArray(d) ? d : []); })
      .catch((err) => { if (isUnauth(err)) onUnauth(); })
      .finally(() => { if (active) setApptLoading(false); });

    api("/api/corporate/portal/usage/history")
      .then((d) => { if (!active) return; setUsageHistory(Array.isArray(d) ? d : []); })
      .catch(() => {});

    return () => { active = false; };
  }, [month, onUnauth]);

  useEffect(() => { return loadDashboard(); }, [loadDashboard]);

  const actsUsed = usage?.actsUsed ?? 0;
  const pct = actsIncluded > 0 ? Math.min(100, Math.round((actsUsed / actsIncluded) * 100)) : 0;
  const isOver = actsUsed > actsIncluded;
  const remaining = Math.max(0, actsIncluded - actsUsed);
  const progressColor = isOver || pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500";

  const sortedAppointments = useMemo(() => [...appointments].sort((a, b) => new Date(b.appointmentDatetime).getTime() - new Date(a.appointmentDatetime).getTime()), [appointments]);

  const upcomingCount = sortedAppointments.filter((a) => a.status === "scheduled").length;
  const completedCount = sortedAppointments.filter((a) => a.status === "completed").length;

  // History chart data — fill in months with no data
  const historyChartData = useMemo(() => {
    const map = Object.fromEntries(usageHistory.map((u) => [u.monthYear, u]));
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const u = map[key];
      return {
        month: monthLabel(key),
        acts: u?.actsUsed ?? 0,
        limit: u?.actsIncluded ?? (PLAN_LIMITS[planTier] ?? 15),
        hasOverage: (u?.overageChargeCents ?? 0) > 0,
      };
    });
  }, [usageHistory, planTier]);

  function handleRebook(appt: Appointment) {
    setBookPrefill(appt);
    setView("book");
  }

  const tabs: { key: PortalView; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "book", label: "Book Appointment", icon: CalendarPlus },
    { key: "history", label: "History", icon: History },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <SEO title="Corporate Portal | LBS Notary" canonical="/corporate/portal" noIndex />

      {/* Top Bar */}
      <div className="bg-[#0d1b35] text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <span className="flex-1 font-bold text-lg">LBS Corporate Portal</span>
          <span className="px-3 py-1 bg-white/10 rounded-lg text-sm font-mono">{account.accountCode}</span>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 flex gap-0 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setView(key); if (key !== "book") setBookPrefill(undefined); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                view === key
                  ? key === "book" ? "border-[#c9a84c] text-[#0d1b35]" : "border-[#0d1b35] text-[#0d1b35]"
                  : "border-transparent text-muted-foreground hover:text-[#0d1b35]"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Book View */}
      {view === "book" && (
        <BookingForm
          account={account}
          onBack={() => { setView("dashboard"); setBookPrefill(undefined); }}
          onSuccess={() => { setView("dashboard"); setBookPrefill(undefined); loadDashboard(); }}
          prefill={bookPrefill ? {
            employeeName: bookPrefill.employeeName,
            employeeEmail: bookPrefill.employeeEmail,
            employeePhone: bookPrefill.employeePhone ?? undefined,
            numSigners: String(bookPrefill.numSigners),
            numDocuments: String(bookPrefill.numDocuments),
            estimatedCertificates: bookPrefill.estimatedCertificates ? String(bookPrefill.estimatedCertificates) : "",
            idType: bookPrefill.idType ?? undefined,
            needWitnesses: bookPrefill.needWitnesses,
            needPrinting: bookPrefill.needPrinting,
            needScanEmail: bookPrefill.needScanEmail,
            specialInstructions: bookPrefill.specialInstructions ?? undefined,
          } : undefined}
        />
      )}

      {/* History View */}
      {view === "history" && <HistoryTab account={account} onRebook={handleRebook} onUnauth={onUnauth} />}

      {/* Settings View */}
      {view === "settings" && <SettingsTab account={account} onUnauth={onUnauth} />}

      {/* Dashboard View */}
      {view === "dashboard" && (
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          {/* Account Summary Strip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border/50">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-[#0d1b35]">{account.companyName}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border/50">
              <span className="text-xs text-muted-foreground mr-1">Plan</span>
              <PlanBadge tier={planTier} />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border/50">
              <span className="text-xs text-muted-foreground mr-1">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">Active</span>
            </div>
            <div className="ml-auto">
              <Button size="sm" onClick={() => setView("book")} className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-semibold gap-1.5">
                <CalendarPlus className="w-4 h-4" /> Book Appointment
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-border/50 p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="bg-white rounded-xl border border-border/50 p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed this month</p>
            </div>
            <div className="bg-white rounded-xl border border-border/50 p-4 text-center space-y-1">
              <p className={`text-2xl font-bold ${isOver ? "text-red-600" : "text-[#0d1b35]"}`}>{remaining}</p>
              <p className="text-xs text-muted-foreground">Acts remaining</p>
            </div>
          </div>

          {/* Month Picker + Download */}
          <div className="flex items-center gap-3">
            <Label htmlFor="month-picker" className="text-sm font-medium text-[#0d1b35] whitespace-nowrap">Month</Label>
            <input id="month-picker" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border/50 text-sm bg-white text-[#0d1b35] focus:outline-none focus:ring-2 focus:ring-[#0d1b35]/20" />
            {sortedAppointments.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 ml-auto text-[#0d1b35] border-[#0d1b35]/20" onClick={() => downloadStatementCsv(sortedAppointments, month, account.companyName)}>
                <Download className="w-3.5 h-3.5" /> Download Statement
              </Button>
            )}
          </div>

          {/* Usage + Calendar Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Usage Card */}
            <div className="md:col-span-2 bg-white rounded-xl border border-border/50 p-6 space-y-4">
              <h2 className="font-semibold text-[#0d1b35]">Monthly Usage</h2>
              {usageLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><div className="w-4 h-4 border-2 border-[#0d1b35]/30 border-t-[#0d1b35] rounded-full animate-spin" />Loading...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-[#0d1b35]">{actsUsed}</span>
                    <span className="text-2xl text-muted-foreground mb-1">/ {actsIncluded}</span>
                    <span className="text-sm text-muted-foreground mb-2 ml-1">acts used</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#f0f4ff] overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">{isOver ? `${actsUsed - actsIncluded} act${actsUsed - actsIncluded !== 1 ? "s" : ""} over limit` : `${remaining} act${remaining !== 1 ? "s" : ""} remaining this month`}</p>
                  {usage && usage.overageChargeCents > 0 ? (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div><p className="font-semibold text-red-700">Overage Charges: ${(usage.overageChargeCents / 100).toFixed(2)}</p><p className="text-xs text-red-600 mt-0.5">Rate: $10/doc + $1/additional stamp</p></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <p className="text-green-700 text-sm">No overage charges this month</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-xl border border-border/50 p-5 space-y-3">
              <h2 className="font-semibold text-[#0d1b35] text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Calendar</h2>
              <MiniCalendar month={month} appointments={sortedAppointments} />
            </div>
          </div>

          {/* Usage History Chart */}
          {usageHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
              <h2 className="font-semibold text-[#0d1b35] flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Usage History (Last 6 Months)</h2>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={historyChartData} barSize={28}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value: number, name: string, props: any) => {
                      const limit = props?.payload?.limit;
                      return [`${value}${limit ? ` / ${limit}` : ""}`, "Acts Used"];
                    }}
                  />
                  <Bar dataKey="acts" name="Acts Used" radius={[4, 4, 0, 0]}>
                    {historyChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.hasOverage ? "#ef4444" : entry.acts >= entry.limit ? "#f59e0b" : "#1e3a6e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#1e3a6e] inline-block" /> Within limit</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> At limit</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Overage</span>
              </div>
            </div>
          )}

          {/* Appointments Table */}
          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-[#0d1b35]">Appointments</h2>
              <button onClick={() => setView("history")} className="text-xs text-[#1e3a6e] hover:underline font-medium">View all history</button>
            </div>

            {apptLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm"><div className="w-5 h-5 border-2 border-[#0d1b35]/30 border-t-[#0d1b35] rounded-full animate-spin" />Loading...</div>
            ) : sortedAppointments.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-muted-foreground text-sm">No appointments for this month</p>
                <Button size="sm" variant="outline" onClick={() => setView("book")} className="gap-1.5"><CalendarPlus className="w-4 h-4" /> Book an Appointment</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-[#f8f9fb]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employee</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date &amp; Time</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Docs</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedAppointments.map((appt) => {
                      const { date, time } = fmtDateCT(appt.appointmentDatetime);
                      return (
                        <tr key={appt.id} className="hover:bg-[#f8f9fb] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-[#0d1b35]">{appt.appointmentCode}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-[#0d1b35]">{appt.employeeName}</div>
                            <div className="text-xs text-muted-foreground">{appt.employeeEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><div>{date}</div><div className="text-xs text-muted-foreground">{time} CT</div></td>
                          <td className="px-6 py-4">{appt.numDocuments}</td>
                          <td className="px-6 py-4"><ApptStatusBadge status={appt.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CorporatePortal() {
  const [account, setAccount] = useState<PortalAccount | null>(getToken() ? getSavedAccount() : null);
  const handleLogin = useCallback((acct: PortalAccount) => setAccount(acct), []);
  const handleLogout = useCallback(() => { clearToken(); setAccount(null); }, []);
  if (!account || !getToken()) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard account={account} onLogout={handleLogout} onUnauth={handleLogout} />;
}
