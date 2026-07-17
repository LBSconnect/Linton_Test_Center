import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import {
  LogIn,
  LogOut,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  CalendarPlus,
  LayoutDashboard,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ID_TYPES = [
  "Driver's License",
  "State ID Card",
  "U.S. Passport",
  "U.S. Passport Card",
  "Military ID",
  "Permanent Resident Card",
  "Foreign Passport",
];

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  appointmentCode: string;
  employeeName: string;
  employeeEmail: string;
  appointmentDatetime: string;
  numDocuments: number;
  estimatedCertificates: number | null;
  status: string;
  createdAt: string;
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

interface TimeSlot {
  time: string;
  label: string;
}

type BookStep = "form" | "success";

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const PORTAL_TOKEN_KEY = "lbs_portal_token";
const PORTAL_ACCOUNT_KEY = "lbs_portal_account";

function getToken(): string | null {
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

function setToken(t: string): void {
  localStorage.setItem(PORTAL_TOKEN_KEY, t);
}

function clearToken(): void {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_ACCOUNT_KEY);
}

function getSavedAccount(): PortalAccount | null {
  const raw = localStorage.getItem(PORTAL_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalAccount;
  } catch {
    return null;
  }
}

function saveAccount(acct: PortalAccount): void {
  localStorage.setItem(PORTAL_ACCOUNT_KEY, JSON.stringify(acct));
}

// ─── API Helper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function isSunday(dateStr: string): boolean {
  return new Date(dateStr + "T12:00:00").getDay() === 0;
}

function isUnauth(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("401") || msg.includes("expired") || msg.includes("unauthorized");
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

// ─── Login Screen ──────────────────────────────────────────────────────────────

interface LoginScreenProps {
  onLogin: (acct: PortalAccount) => void;
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [accountCode, setAccountCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
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
    } finally {
      setLoading(false);
    }
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
            <Input
              id="accountCode"
              type="text"
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value.toUpperCase())}
              placeholder="LBS-ACCT-000001"
              className="font-mono uppercase"
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-[#0d1b35] hover:bg-[#1a2d52] text-white"
            disabled={loading || !accountCode || !email}
          >
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Booking Form (embedded in portal) ────────────────────────────────────────

interface BookingFormProps {
  account: PortalAccount;
  onBack: () => void;
  onSuccess: () => void;
}

function BookingForm({ account, onBack, onSuccess }: BookingFormProps) {
  const [step, setStep] = useState<BookStep>("form");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({
    employeeName: "",
    employeeEmail: "",
    employeePhone: "",
    numSigners: "1",
    numDocuments: "1",
    estimatedCertificates: "",
    idType: "",
    needWitnesses: false,
    needPrinting: false,
    needScanEmail: false,
    specialInstructions: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ appointmentCode: string; appointmentDatetime: string } | null>(null);

  useEffect(() => {
    if (!date || isSunday(date)) { setSlots([]); return; }
    setLoadingSlots(true);
    setSelectedTime("");
    fetch(`/api/appointments/available-slots?date=${date}&service=notary-service`)
      .then((r) => r.json())
      .then((data) => {
        const raw: string[] = Array.isArray(data) ? data : data.slots || [];
        setSlots(raw.map((iso) => {
          const d = new Date(iso);
          return {
            time: iso,
            label: d.toLocaleTimeString("en-US", {
              timeZone: "America/Chicago",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          };
        }));
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
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep("form");
    setResult(null);
    setDate("");
    setSelectedTime("");
    setForm({
      employeeName: "",
      employeeEmail: "",
      employeePhone: "",
      numSigners: "1",
      numDocuments: "1",
      estimatedCertificates: "",
      idType: "",
      needWitnesses: false,
      needPrinting: false,
      needScanEmail: false,
      specialInstructions: "",
    });
    setErrors({});
  }

  if (step === "success" && result) {
    const dt = new Date(result.appointmentDatetime);
    const fmtDate = dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const fmtTime = dt.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });
    return (
      <div className="max-w-lg mx-auto py-8 px-6 space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#0d1b35]">Appointment Booked!</h2>
        <p className="text-muted-foreground">
          A confirmation has been sent to <strong>{form.employeeEmail}</strong>.
        </p>
        <div className="bg-[#f8f9fb] rounded-xl p-5 text-left space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Confirmation Code</p>
            <p className="text-xl font-mono font-bold text-[#0d1b35]">{result.appointmentCode}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date &amp; Time</p>
            <p className="text-sm font-semibold text-[#0d1b35]">{fmtDate} at {fmtTime} CT</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm text-foreground">616 FM 1960 Rd W, Ste 101, Houston, TX 77090</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left">
          <strong>Reminder:</strong> Bring all documents <em>unsigned</em> and a valid government-issued photo ID for all signers.
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={resetForm}>
            Book Another
          </Button>
          <Button
            className="flex-1 bg-[#0d1b35] hover:bg-[#1a2d52] text-white"
            onClick={() => { resetForm(); onSuccess(); }}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* Account context */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-border/50 px-5 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Booking for</p>
          <p className="font-semibold text-[#0d1b35]">{account.companyName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{account.accountCode}</span>
          <Badge className="capitalize bg-[#0d1b35]/10 text-[#0d1b35] hover:bg-[#0d1b35]/10">{account.planTier}</Badge>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-[#0d1b35]">Appointment Details</h2>

        {/* Employee Info */}
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

        {/* Date & Time */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0d1b35]">
            <Calendar className="w-4 h-4" /> Date &amp; Time
          </div>
          <Field label="Appointment Date" required>
            <Input
              type="date"
              value={date}
              min={today()}
              onChange={(e) => { setDate(e.target.value); setErrors((er) => { const n = { ...er }; delete n.date; return n; }); }}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            {date && isSunday(date) && <p className="text-amber-600 text-xs mt-1">We are closed on Sundays. Please select another day.</p>}
          </Field>

          {date && !isSunday(date) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Available Times (CT)
                {loadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
              </Label>
              {slots.length === 0 && !loadingSlots ? (
                <p className="text-sm text-muted-foreground">No slots available on this date. Please choose another day.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      onClick={() => { setSelectedTime(s.time); setErrors((er) => { const n = { ...er }; delete n.time; return n; }); }}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        selectedTime === s.time
                          ? "bg-[#0d1b35] text-white border-[#0d1b35]"
                          : "bg-white text-foreground border-border hover:border-[#0d1b35]/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              {errors.time && <p className="text-red-500 text-xs">{errors.time}</p>}
            </div>
          )}
        </div>

        {/* Document Details */}
        <div className="space-y-4">
          <div className="text-sm font-semibold text-[#0d1b35]">Document Details</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of Signers" required>
              <select
                value={form.numSigners}
                onChange={(e) => set("numSigners", e.target.value)}
                className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Number of Documents" required>
              <select
                value={form.numDocuments}
                onChange={(e) => set("numDocuments", e.target.value)}
                className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[1,2,3,4,5,6,7,8,9,10,15,20,25,30].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Total Stamps Required">
              <Input
                type="number"
                min="0"
                value={form.estimatedCertificates}
                onChange={(e) => set("estimatedCertificates", e.target.value)}
                placeholder="e.g. 4"
                className="w-full"
              />
            </Field>
          </div>
          <Field label="Signer ID Type" required>
            <select
              value={form.idType}
              onChange={(e) => set("idType", e.target.value)}
              className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select ID type...</option>
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.idType && <p className="text-red-500 text-xs mt-1">{errors.idType}</p>}
          </Field>
        </div>

        {/* Add-ons */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[#0d1b35]">Additional Services</div>
          {[
            { key: "needWitnesses" as const, label: "Witness(es) requested" },
            { key: "needPrinting" as const, label: "Document printing needed" },
            { key: "needScanEmail" as const, label: "Scan-to-email requested" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 accent-[#0d1b35]"
              />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>

        {/* Special Instructions */}
        <Field label="Special Instructions">
          <Textarea
            value={form.specialInstructions}
            onChange={(e) => set("specialInstructions", e.target.value)}
            placeholder="e.g., Real estate closing, power of attorney, multiple languages needed..."
            rows={3}
          />
        </Field>

        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.submit}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
        <Button
          onClick={submit}
          disabled={submitting}
          className="gap-1.5 bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-bold px-8"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Booking..." : "Confirm Appointment"}
          {!submitting && <ChevronRight className="w-4 h-4" />}
        </Button>
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
  const [view, setView] = useState<"dashboard" | "book">("dashboard");
  const [month, setMonth] = useState(getCurrentMonth());
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [actsIncluded, setActsIncluded] = useState(15);
  const [planTier, setPlanTier] = useState<string>(account.planTier ?? "bronze");
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  const loadDashboard = useCallback(() => {
    let active = true;

    setUsageLoading(true);
    setUsageError(null);
    api(`/api/corporate/portal/usage?month=${month}`)
      .then((d) => {
        if (!active) return;
        setUsage(d.usage as UsageData | null);
        setActsIncluded(d.actsIncluded as number);
        setPlanTier(d.planTier as string);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (isUnauth(err)) { onUnauth(); return; }
        setUsageError(err instanceof Error ? err.message : "Failed to load usage");
      })
      .finally(() => { if (active) setUsageLoading(false); });

    setApptLoading(true);
    setApptError(null);
    api(`/api/corporate/portal/appointments?month=${month}`)
      .then((d) => {
        if (!active) return;
        setAppointments(Array.isArray(d) ? (d as Appointment[]) : []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (isUnauth(err)) { onUnauth(); return; }
        setApptError(err instanceof Error ? err.message : "Failed to load appointments");
      })
      .finally(() => { if (active) setApptLoading(false); });

    return () => { active = false; };
  }, [month, onUnauth]);

  useEffect(() => {
    const cleanup = loadDashboard();
    return cleanup;
  }, [loadDashboard]);

  const actsUsed = usage?.actsUsed ?? 0;
  const pct = actsIncluded > 0 ? Math.min(100, Math.round((actsUsed / actsIncluded) * 100)) : 0;
  const isOver = actsUsed > actsIncluded;
  const remaining = Math.max(0, actsIncluded - actsUsed);
  const progressColor =
    isOver || pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500";

  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(b.appointmentDatetime).getTime() - new Date(a.appointmentDatetime).getTime()
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <SEO title="Corporate Portal | LBS Notary" canonical="/corporate/portal" noIndex />

      {/* Top Bar */}
      <div className="bg-[#0d1b35] text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <span className="flex-1 font-bold text-lg">LBS Corporate Portal</span>
          <span className="px-3 py-1 bg-white/10 rounded-lg text-sm font-mono">
            {account.accountCode}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 flex gap-1">
          <button
            onClick={() => setView("dashboard")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === "dashboard"
                ? "border-[#0d1b35] text-[#0d1b35]"
                : "border-transparent text-muted-foreground hover:text-[#0d1b35]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setView("book")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === "book"
                ? "border-[#c9a84c] text-[#0d1b35]"
                : "border-transparent text-muted-foreground hover:text-[#0d1b35]"
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Booking View */}
      {view === "book" && (
        <BookingForm
          account={account}
          onBack={() => setView("dashboard")}
          onSuccess={() => { setView("dashboard"); loadDashboard(); }}
        />
      )}

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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
                Active
              </span>
            </div>
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={() => setView("book")}
                className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-semibold gap-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                Book Appointment
              </Button>
            </div>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-3">
            <Label
              htmlFor="month-picker"
              className="text-sm font-medium text-[#0d1b35] whitespace-nowrap"
            >
              Month
            </Label>
            <input
              id="month-picker"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border/50 text-sm bg-white text-[#0d1b35] focus:outline-none focus:ring-2 focus:ring-[#0d1b35]/20"
            />
          </div>

          {/* Monthly Usage Card */}
          <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
            <h2 className="font-semibold text-[#0d1b35]">Monthly Usage</h2>

            {usageError && <p className="text-sm text-red-600">{usageError}</p>}

            {usageLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <div className="w-4 h-4 border-2 border-[#0d1b35]/30 border-t-[#0d1b35] rounded-full animate-spin" />
                Loading usage...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-[#0d1b35]">{actsUsed}</span>
                  <span className="text-2xl text-muted-foreground mb-1">/ {actsIncluded}</span>
                  <span className="text-sm text-muted-foreground mb-2 ml-1">notarial acts used</span>
                </div>

                <div className="h-3 rounded-full bg-[#f0f4ff] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  {isOver
                    ? `${actsUsed - actsIncluded} act${actsUsed - actsIncluded !== 1 ? "s" : ""} over limit`
                    : `${remaining} act${remaining !== 1 ? "s" : ""} remaining this month`}
                </p>

                {usage && usage.overageChargeCents > 0 ? (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700">
                        Overage Charges: ${(usage.overageChargeCents / 100).toFixed(2)}. Rate: $10/doc + $1/additional stamp
                      </p>
                    </div>
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

          {/* Appointments Table */}
          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-[#0d1b35]">Appointments</h2>
            </div>

            {apptError && (
              <div className="px-6 py-4">
                <p className="text-sm text-red-600">{apptError}</p>
              </div>
            )}

            {apptLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
                <div className="w-5 h-5 border-2 border-[#0d1b35]/30 border-t-[#0d1b35] rounded-full animate-spin" />
                Loading appointments...
              </div>
            ) : sortedAppointments.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-muted-foreground text-sm">No appointments for this month</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView("book")}
                  className="gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Book an Appointment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-[#f8f9fb]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Confirmation Code
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Employee
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Date &amp; Time
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Documents
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Stamps
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedAppointments.map((appt) => {
                      const dt = new Date(appt.appointmentDatetime);
                      const fmtDate = dt.toLocaleDateString("en-US", {
                        timeZone: "America/Chicago",
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });
                      const fmtTime = dt.toLocaleTimeString("en-US", {
                        timeZone: "America/Chicago",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return (
                        <tr key={appt.id} className="hover:bg-[#f8f9fb] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-[#0d1b35]">
                            {appt.appointmentCode}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-[#0d1b35]">{appt.employeeName}</div>
                            <div className="text-xs text-muted-foreground">{appt.employeeEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>{fmtDate}</div>
                            <div className="text-xs text-muted-foreground">{fmtTime} CT</div>
                          </td>
                          <td className="px-6 py-4">{appt.numDocuments}</td>
                          <td className="px-6 py-4">{appt.estimatedCertificates ?? "N/A"}</td>
                          <td className="px-6 py-4">
                            <ApptStatusBadge status={appt.status} />
                          </td>
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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CorporatePortal() {
  const [account, setAccount] = useState<PortalAccount | null>(
    getToken() ? getSavedAccount() : null
  );

  const handleLogin = useCallback((acct: PortalAccount) => {
    setAccount(acct);
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setAccount(null);
  }, []);

  if (!account || !getToken()) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard account={account} onLogout={handleLogout} onUnauth={handleLogout} />;
}
