import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Building2,
  User,
  CreditCard,
  Users,
  FileText,
  ShieldCheck,
  Send,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type PlanTier = "bronze" | "silver" | "gold";

interface AuthorizedUser {
  name: string;
  email: string;
}

interface FormData {
  // Step 1 — Company Info
  companyName: string;
  businessAddress: string;
  city: string;
  state: string;
  zip: string;
  companySize: string;
  estimatedMonthlyVolume: string;
  // Step 2 — Primary Contact
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactTitle: string;
  // Step 3 — Billing Contact
  apContactName: string;
  apContactEmail: string;
  billingMethod: string;
  // Step 4 — Plan Selection
  planTier: PlanTier | "";
  // Step 5 — Authorized Users
  authorizedUsers: AuthorizedUser[];
  needsScanToEmail: boolean;
  // Step 6 — Special Requirements
  specialRequirements: string;
  // Step 7 — Agreements
  agreedToNoLegalAdvice: boolean;
  agreedToCertificateSelection: boolean;
  agreedToNoConfidentialDocs: boolean;
  agreedToTexasFees: boolean;
  agreedToOverageCharges: boolean;
  agreedToTerms: boolean;
}

const INITIAL: FormData = {
  companyName: "",
  businessAddress: "",
  city: "",
  state: "TX",
  zip: "",
  companySize: "",
  estimatedMonthlyVolume: "",
  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  primaryContactTitle: "",
  apContactName: "",
  apContactEmail: "",
  billingMethod: "invoice",
  planTier: "",
  authorizedUsers: [],
  needsScanToEmail: false,
  specialRequirements: "",
  agreedToNoLegalAdvice: false,
  agreedToCertificateSelection: false,
  agreedToNoConfidentialDocs: false,
  agreedToTexasFees: false,
  agreedToOverageCharges: false,
  agreedToTerms: false,
};

const STEPS = [
  { label: "Company", icon: Building2 },
  { label: "Contact", icon: User },
  { label: "Billing", icon: CreditCard },
  { label: "Plan", icon: FileText },
  { label: "Users", icon: Users },
  { label: "Details", icon: FileText },
  { label: "Agree", icon: ShieldCheck },
];

const PLANS = [
  { tier: "bronze" as PlanTier, name: "Bronze", price: "$250/mo", acts: 15, admins: 1, color: "#cd7f32" },
  { tier: "silver" as PlanTier, name: "Silver", price: "$400/mo", acts: 25, admins: 3, color: "#a8a9ad" },
  { tier: "gold" as PlanTier, name: "Gold", price: "$750/mo", acts: 100, admins: 5, color: "#c9a84c" },
];

// ─── Field Helpers ──────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
          checked ? "bg-[#0d1b35] border-[#0d1b35]" : "border-gray-300 group-hover:border-[#0d1b35]/50"
        }`}
      >
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className="text-sm text-foreground leading-relaxed">{children}</span>
    </label>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CorporateEnroll() {
  const [searchParams] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ accountCode: string } | null>(null);
  const [newUser, setNewUser] = useState<AuthorizedUser>({ name: "", email: "" });

  // Pre-fill plan from URL ?plan=silver
  useEffect(() => {
    const match = searchParams.match(/plan=(bronze|silver|gold)/);
    if (match) {
      setForm((f) => ({ ...f, planTier: match[1] as PlanTier }));
      setStep(3); // Jump straight to plan step
    }
  }, []);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  // ── Validation ────────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (!form.companyName.trim()) e.companyName = "Required";
      if (!form.businessAddress.trim()) e.businessAddress = "Required";
      if (!form.city.trim()) e.city = "Required";
      if (!form.zip.trim()) e.zip = "Required";
    }
    if (step === 1) {
      if (!form.primaryContactName.trim()) e.primaryContactName = "Required";
      if (!form.primaryContactEmail.trim()) e.primaryContactEmail = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primaryContactEmail)) e.primaryContactEmail = "Invalid email";
    }
    if (step === 2) {
      if (form.apContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.apContactEmail)) {
        e.apContactEmail = "Invalid email";
      }
    }
    if (step === 3) {
      if (!form.planTier) e.planTier = "Please select a plan";
    }
    if (step === 6) {
      if (!form.agreedToNoLegalAdvice) e.agreedToNoLegalAdvice = "Required";
      if (!form.agreedToCertificateSelection) e.agreedToCertificateSelection = "Required";
      if (!form.agreedToNoConfidentialDocs) e.agreedToNoConfidentialDocs = "Required";
      if (!form.agreedToTexasFees) e.agreedToTexasFees = "Required";
      if (!form.agreedToOverageCharges) e.agreedToOverageCharges = "Required";
      if (!form.agreedToTerms) e.agreedToTerms = "Required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validate()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        estimatedMonthlyVolume: form.estimatedMonthlyVolume
          ? parseInt(form.estimatedMonthlyVolume, 10)
          : undefined,
        planTier: form.planTier as PlanTier,
        apContactEmail: form.apContactEmail || undefined,
        apContactName: form.apContactName || undefined,
      };
      const res = await fetch("/api/corporate/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enrollment failed");
      setSubmitted({ accountCode: json.accountCode });
    } catch (err: any) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <>
        <SEO title="Enrollment Submitted | LBS Corporate Notary" canonical="/corporate/enroll" noIndex />
        <Header />
        <section className="min-h-[60vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-lg text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#0d1b35]">Enrollment Submitted!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Your application has been received. A confirmation has been sent to{" "}
              <strong>{form.primaryContactEmail}</strong>.
            </p>
            <div className="bg-[#f8f9fb] rounded-xl p-5 text-left space-y-2">
              <p className="text-sm text-muted-foreground">Your account reference</p>
              <p className="text-2xl font-mono font-bold text-[#0d1b35]">{submitted.accountCode}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Our team will review your enrollment and reach out within <strong>1–2 business days</strong>.
              Once approved, you'll receive a secure payment link to activate your account.
            </p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────────

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
      <SEO
        title="Enroll: Corporate Notary Services | LBS Houston"
        description="Enroll your Houston company in LBS Corporate Notary Services. Choose a plan, provide your company details, and get started in minutes."
        canonical="/corporate/enroll"
        noIndex
      />
      <Header />

      <section className="bg-gradient-to-br from-[#0d1b35] to-[#1a2d52] text-white py-12 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Corporate Enrollment
          </Badge>
          <h1 className="text-3xl font-bold">Enroll Your Company</h1>
          <p className="text-white/70 text-sm">Step {step + 1} of {STEPS.length}</p>
        </div>
      </section>

      <section className="py-12 px-6 bg-[#f8f9fb] min-h-[60vh]">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Step Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-1">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className={`flex flex-col items-center gap-1 flex-1 ${i <= step ? "opacity-100" : "opacity-40"}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        i < step
                          ? "bg-green-500 text-white"
                          : i === step
                          ? "bg-[#0d1b35] text-white"
                          : "bg-white border-2 border-border text-muted-foreground"
                      }`}
                    >
                      {i < step ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{s.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-1.5 bg-border rounded-full">
              <div
                className="h-1.5 bg-[#0d1b35] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 md:p-8 space-y-6">
            {/* STEP 0 — Company Info */}
            {step === 0 && (
              <>
                <h2 className="text-xl font-bold text-[#0d1b35]">Company Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Field label="Company Name" required>
                      <Input
                        value={form.companyName}
                        onChange={(e) => set("companyName", e.target.value)}
                        placeholder="Acme Corporation"
                      />
                      {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Business Address" required>
                      <Input
                        value={form.businessAddress}
                        onChange={(e) => set("businessAddress", e.target.value)}
                        placeholder="123 Main Street, Suite 100"
                      />
                      {errors.businessAddress && <p className="text-red-500 text-xs mt-1">{errors.businessAddress}</p>}
                    </Field>
                  </div>
                  <Field label="City" required>
                    <Input
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Houston"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="State" required>
                      <Input value={form.state} readOnly className="bg-gray-50" />
                    </Field>
                    <Field label="ZIP" required>
                      <Input
                        value={form.zip}
                        onChange={(e) => set("zip", e.target.value)}
                        placeholder="77090"
                      />
                      {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                    </Field>
                  </div>
                  <Field label="Company Size">
                    <select
                      value={form.companySize}
                      onChange={(e) => set("companySize", e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1–10 employees</option>
                      <option value="11-50">11–50 employees</option>
                      <option value="51-200">51–200 employees</option>
                      <option value="201-500">201–500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </Field>
                  <Field label="Est. Monthly Notarial Acts">
                    <Input
                      type="number"
                      min={1}
                      value={form.estimatedMonthlyVolume}
                      onChange={(e) => set("estimatedMonthlyVolume", e.target.value)}
                      placeholder="10"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* STEP 1 — Primary Contact */}
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold text-[#0d1b35]">Primary Contact</h2>
                <p className="text-sm text-muted-foreground">
                  This person will receive all account communications and enrollment updates.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Full Name" required>
                    <Input
                      value={form.primaryContactName}
                      onChange={(e) => set("primaryContactName", e.target.value)}
                      placeholder="Jane Smith"
                    />
                    {errors.primaryContactName && <p className="text-red-500 text-xs mt-1">{errors.primaryContactName}</p>}
                  </Field>
                  <Field label="Title / Role">
                    <Input
                      value={form.primaryContactTitle}
                      onChange={(e) => set("primaryContactTitle", e.target.value)}
                      placeholder="Office Manager"
                    />
                  </Field>
                  <Field label="Email Address" required>
                    <Input
                      type="email"
                      value={form.primaryContactEmail}
                      onChange={(e) => set("primaryContactEmail", e.target.value)}
                      placeholder="jane@acme.com"
                    />
                    {errors.primaryContactEmail && <p className="text-red-500 text-xs mt-1">{errors.primaryContactEmail}</p>}
                  </Field>
                  <Field label="Phone Number">
                    <Input
                      type="tel"
                      value={form.primaryContactPhone}
                      onChange={(e) => set("primaryContactPhone", e.target.value)}
                      placeholder="(281) 555-1234"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* STEP 2 — Billing Contact */}
            {step === 2 && (
              <>
                <h2 className="text-xl font-bold text-[#0d1b35]">Accounts Payable Contact</h2>
                <p className="text-sm text-muted-foreground">
                  For invoices and billing. Leave blank to use the primary contact.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="AP Contact Name">
                    <Input
                      value={form.apContactName}
                      onChange={(e) => set("apContactName", e.target.value)}
                      placeholder="John Doe"
                    />
                  </Field>
                  <Field label="AP Email Address">
                    <Input
                      type="email"
                      value={form.apContactEmail}
                      onChange={(e) => set("apContactEmail", e.target.value)}
                      placeholder="ap@acme.com"
                    />
                    {errors.apContactEmail && <p className="text-red-500 text-xs mt-1">{errors.apContactEmail}</p>}
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Preferred Billing Method">
                      <div className="flex gap-4 mt-1">
                        {[
                          { value: "invoice", label: "Invoice / ACH" },
                          { value: "credit-card", label: "Credit Card" },
                          { value: "check", label: "Business Check" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name="billingMethod"
                              value={opt.value}
                              checked={form.billingMethod === opt.value}
                              onChange={() => set("billingMethod", opt.value)}
                              className="accent-[#0d1b35]"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* STEP 3 — Plan Selection */}
            {step === 3 && (
              <>
                <h2 className="text-xl font-bold text-[#0d1b35]">Choose Your Plan</h2>
                <div className="space-y-3">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.tier}
                      onClick={() => set("planTier", plan.tier)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.planTier === plan.tier
                          ? "border-[#0d1b35] bg-[#0d1b35]/5"
                          : "border-border hover:border-[#0d1b35]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: form.planTier === plan.tier ? "#0d1b35" : "#cbd5e1" }}
                          >
                            {form.planTier === plan.tier && (
                              <div className="w-2 h-2 rounded-full bg-[#0d1b35]" />
                            )}
                          </div>
                          <span className="font-semibold text-[#0d1b35]">{plan.name}</span>
                        </div>
                        <span className="font-bold text-[#0d1b35]">{plan.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 ml-7">
                        {plan.acts} notarial acts/month · {plan.admins} admin{plan.admins > 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
                {errors.planTier && <p className="text-red-500 text-sm">{errors.planTier}</p>}
              </>
            )}

            {/* STEP 4 — Authorized Users */}
            {step === 4 && (
              <>
                <h2 className="text-xl font-bold text-[#0d1b35]">Authorized Employees</h2>
                <p className="text-sm text-muted-foreground">
                  List employees who will be scheduling notary appointments. You can add more later.
                </p>
                <div className="space-y-3">
                  {form.authorizedUsers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fb] rounded-lg border border-border/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => set("authorizedUsers", form.authorizedUsers.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="border border-dashed border-border/60 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Employee</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Full name"
                        value={newUser.name}
                        onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                      />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={newUser.email}
                        onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newUser.name && newUser.email) {
                          set("authorizedUsers", [...form.authorizedUsers, { ...newUser }]);
                          setNewUser({ name: "", email: "" });
                        }
                      }}
                      disabled={!newUser.name || !newUser.email}
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add Employee
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <Checkbox
                    checked={form.needsScanToEmail}
                    onChange={(v) => set("needsScanToEmail", v)}
                  >
                    Our company needs scan-to-email service (available on Silver and Gold plans)
                  </Checkbox>
                </div>
              </>
            )}

            {/* STEP 5 — Special Requirements */}
            {step === 5 && (
              <>
                <h2 className="text-xl font-bold text-[#0d1b35]">Additional Details</h2>
                <p className="text-sm text-muted-foreground">
                  Let us know about any special scheduling needs, document types, or requirements.
                  This is optional.
                </p>
                <Field label="Special Requirements or Notes">
                  <Textarea
                    value={form.specialRequirements}
                    onChange={(e) => set("specialRequirements", e.target.value)}
                    placeholder="e.g., We frequently need real estate closings, POAs, and I-9 document reviews..."
                    rows={5}
                  />
                </Field>
              </>
            )}

            {/* STEP 6 — Agreements */}
            {step === 6 && (
              <>
                <h2 className="text-xl font-bold text-[#0d1b35]">Review & Agree</h2>
                <p className="text-sm text-muted-foreground">
                  Please review and acknowledge each item to complete your enrollment.
                </p>
                <div className="space-y-5">
                  <Checkbox
                    checked={form.agreedToNoLegalAdvice}
                    onChange={(v) => set("agreedToNoLegalAdvice", v)}
                  >
                    I understand that LBS notary services do not constitute legal advice, and LBS
                    does not provide legal counsel or document preparation.
                  </Checkbox>
                  {errors.agreedToNoLegalAdvice && <p className="text-red-500 text-xs -mt-3">{errors.agreedToNoLegalAdvice}</p>}

                  <Checkbox
                    checked={form.agreedToCertificateSelection}
                    onChange={(v) => set("agreedToCertificateSelection", v)}
                  >
                    I understand that our employees are responsible for determining the correct
                    notarial certificate type. LBS will not select certificates on behalf of signers.
                  </Checkbox>
                  {errors.agreedToCertificateSelection && <p className="text-red-500 text-xs -mt-3">{errors.agreedToCertificateSelection}</p>}

                  <Checkbox
                    checked={form.agreedToNoConfidentialDocs}
                    onChange={(v) => set("agreedToNoConfidentialDocs", v)}
                  >
                    I understand that LBS will decline to notarize documents it has reason to believe
                    are fraudulent, incomplete, or involve confidential information that creates a
                    conflict of interest.
                  </Checkbox>
                  {errors.agreedToNoConfidentialDocs && <p className="text-red-500 text-xs -mt-3">{errors.agreedToNoConfidentialDocs}</p>}

                  <Checkbox
                    checked={form.agreedToTexasFees}
                    onChange={(v) => set("agreedToTexasFees", v)}
                  >
                    I acknowledge that Texas law governs maximum notarial fees, and acts exceeding
                    the plan limit will be billed at statutory rates.
                  </Checkbox>
                  {errors.agreedToTexasFees && <p className="text-red-500 text-xs -mt-3">{errors.agreedToTexasFees}</p>}

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <p className="text-sm font-semibold text-amber-900">Overage Charges Disclosure</p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      If your company's monthly notarial acts exceed your plan's included limit, overage
                      charges will apply at the following rates:
                    </p>
                    <ul className="text-sm text-amber-800 space-y-1 pl-4 list-disc">
                      <li><strong>$10.00</strong> per document for each act beyond the plan limit</li>
                      <li><strong>$1.00</strong> per additional stamp required beyond the first (e.g., 3 stamps = $2.00 extra)</li>
                    </ul>
                    <p className="text-xs text-amber-700">
                      Overage charges are tracked monthly and will appear on your invoice. Your administrator
                      will be notified when usage approaches the plan limit.
                    </p>
                    <Checkbox
                      checked={form.agreedToOverageCharges}
                      onChange={(v) => set("agreedToOverageCharges", v)}
                    >
                      I understand and agree to the overage charge rates described above, and authorize
                      LBS to bill my company for any acts exceeding the monthly plan limit.
                    </Checkbox>
                    {errors.agreedToOverageCharges && <p className="text-red-500 text-xs">{errors.agreedToOverageCharges}</p>}
                  </div>

                  <Checkbox
                    checked={form.agreedToTerms}
                    onChange={(v) => set("agreedToTerms", v)}
                  >
                    I agree to the{" "}
                    <a
                      href="/terms-of-use"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1e3a6e] underline underline-offset-2"
                    >
                      Terms of Use
                    </a>{" "}
                    and authorize LBS to process this enrollment on behalf of my company.
                  </Checkbox>
                  {errors.agreedToTerms && <p className="text-red-500 text-xs -mt-3">{errors.agreedToTerms}</p>}
                </div>

                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={back}
              disabled={step === 0}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="gap-1.5 bg-[#0d1b35] hover:bg-[#1a2d52] text-white">
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={submitting}
                className="gap-1.5 bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-bold"
              >
                {submitting ? "Submitting…" : "Submit Enrollment"}
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
