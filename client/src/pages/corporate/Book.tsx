import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AccountInfo {
  id: number;
  accountCode: string;
  companyName: string;
  planTier: string;
  needsScanToEmail: boolean;
}

interface TimeSlot {
  time: string;
  label: string;
}

const ID_TYPES = [
  "Driver's License",
  "State ID Card",
  "U.S. Passport",
  "U.S. Passport Card",
  "Military ID",
  "Permanent Resident Card",
  "Foreign Passport",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function isSunday(dateStr: string): boolean {
  return new Date(dateStr + "T12:00:00").getDay() === 0;
}

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

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CorporateBook() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  // Step 0 = account code entry, 1 = booking form, 2 = success
  const [step, setStep] = useState(0);
  const [accountCode, setAccountCode] = useState(params.get("account") || "");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

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
    idType: "",
    needWitnesses: false,
    needPrinting: false,
    needScanEmail: false,
    specialInstructions: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ appointmentCode: string; appointmentDatetime: string } | null>(null);

  // Auto-verify if account code passed via URL
  useEffect(() => {
    if (params.get("account")) verifyAccount();
  }, []);

  // Load time slots when date changes
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

  // ── Account Verification ────────────────────────────────────────────────────

  async function verifyAccount() {
    const code = accountCode.trim().toUpperCase();
    if (!code) { setVerifyError("Please enter your account code."); return; }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch(`/api/corporate/account/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Account not found");
      setAccount(json);
      setStep(1);
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  // ── Form Helpers ────────────────────────────────────────────────────────────

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
    if (isSunday(date)) e.date = "We are closed on Sundays";
    if (!selectedTime) e.time = "Select a time slot";
    if (!form.idType) e.idType = "Select an ID type";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function submit() {
    if (!validate() || !account) return;
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
      setStep(2);
    } catch (err: any) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success ─────────────────────────────────────────────────────────────────

  if (step === 2 && result) {
    const dt = new Date(result.appointmentDatetime);
    const fmtDate = dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const fmtTime = dt.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });
    return (
      <>
        <SEO title="Appointment Booked | LBS Corporate Notary" canonical="/corporate/book" noIndex />
        <Header />
        <section className="min-h-[65vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-lg text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#0d1b35]">Appointment Booked!</h1>
            <p className="text-muted-foreground">
              A confirmation has been sent to <strong>{form.employeeEmail}</strong>.
            </p>
            <div className="bg-[#f8f9fb] rounded-xl p-5 text-left space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Confirmation Code</p>
                <p className="text-xl font-mono font-bold text-[#0d1b35]">{result.appointmentCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
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
            <Button
              onClick={() => { setStep(0); setResult(null); setDate(""); setSelectedTime(""); setForm({ employeeName: "", employeeEmail: "", employeePhone: "", numSigners: "1", numDocuments: "1", idType: "", needWitnesses: false, needPrinting: false, needScanEmail: false, specialInstructions: "" }); }}
              variant="outline"
              className="w-full"
            >
              Book Another Appointment
            </Button>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO
        title="Book a Corporate Notary Appointment | LBS Houston"
        description="LBS corporate account holders: book a notary appointment for your employees. Enter your account code to get started."
        canonical="/corporate/book"
        noIndex
      />
      <Header />

      <section className="bg-gradient-to-br from-[#0d1b35] to-[#1a2d52] text-white py-12 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Corporate Appointments
          </Badge>
          <h1 className="text-3xl font-bold">Book a Notary Appointment</h1>
          <p className="text-white/70 text-sm">For active LBS corporate account holders only</p>
        </div>
      </section>

      <section className="py-12 px-6 bg-[#f8f9fb] min-h-[60vh]">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Step 0 — Account Code Entry */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#0d1b35]">Enter Your Account Code</h2>
                <p className="text-sm text-muted-foreground">
                  Your account code was provided in your activation email (format: LBS-ACCT-XXXXXX).
                </p>
              </div>
              <Field label="Corporate Account Code" required>
                <Input
                  value={accountCode}
                  onChange={(e) => { setAccountCode(e.target.value.toUpperCase()); setVerifyError(""); }}
                  placeholder="LBS-ACCT-000001"
                  className="font-mono text-lg tracking-wider"
                  onKeyDown={(e) => e.key === "Enter" && verifyAccount()}
                />
              </Field>
              {verifyError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {verifyError}
                </div>
              )}
              <Button
                onClick={verifyAccount}
                disabled={verifying || !accountCode.trim()}
                className="w-full bg-[#0d1b35] hover:bg-[#1a2d52] text-white gap-2"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {verifying ? "Verifying…" : "Verify Account"}
              </Button>
            </div>
          )}

          {/* Step 1 — Booking Form */}
          {step === 1 && account && (
            <>
              {/* Account pill */}
              <div className="flex items-center justify-between bg-white rounded-xl border border-border/50 px-5 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Booking for</p>
                  <p className="font-semibold text-[#0d1b35]">{account.companyName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{account.accountCode}</span>
                  <Badge className="capitalize bg-[#0d1b35]/10 text-[#0d1b35] hover:bg-[#0d1b35]/10">{account.planTier}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => { setStep(0); setAccount(null); }} className="text-xs text-muted-foreground">
                    Change
                  </Button>
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
                    <Calendar className="w-4 h-4" /> Date & Time
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
                  </div>

                  <Field label="Signer ID Type" required>
                    <select
                      value={form.idType}
                      onChange={(e) => { set("idType", e.target.value); }}
                      className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select ID type…</option>
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
                    ...(account.needsScanToEmail ? [{ key: "needScanEmail" as const, label: "Scan-to-email requested" }] : []),
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
                    placeholder="e.g., Real estate closing, power of attorney, multiple languages needed…"
                    rows={3}
                  />
                </Field>

                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.submit}</div>
                )}
              </div>

              {/* Nav */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => { setStep(0); setAccount(null); }} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="gap-1.5 bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-bold px-8"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? "Booking…" : "Confirm Appointment"}
                  {!submitting && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
