import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { LogIn, LogOut, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";

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

function isUnauth(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("401") || msg.includes("expired") || msg.includes("unauthorized");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ApptStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "Scheduled", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    completed: { label: "Completed", cls: "bg-green-100 text-green-700 border-green-200" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}
    >
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
  const c = cfg[key] ?? { label: tier ?? "—", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${c.cls}`}
    >
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
            {loading ? "Signing in…" : "Sign In"}
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
  const [month, setMonth] = useState(getCurrentMonth());
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [actsIncluded, setActsIncluded] = useState(15);
  const [planTier, setPlanTier] = useState<string>(account.planTier ?? "bronze");
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Fetch usage
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

    // Fetch appointments
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

      {/* Content */}
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
              Loading usage…
            </div>
          ) : (
            <div className="space-y-4">
              {/* Big numbers */}
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-[#0d1b35]">{actsUsed}</span>
                <span className="text-2xl text-muted-foreground mb-1">/ {actsIncluded}</span>
                <span className="text-sm text-muted-foreground mb-2 ml-1">notarial acts used</span>
              </div>

              {/* Progress bar */}
              <div className="h-3 rounded-full bg-[#f0f4ff] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Remaining text */}
              <p className="text-sm text-muted-foreground">
                {isOver
                  ? `${actsUsed - actsIncluded} act${actsUsed - actsIncluded !== 1 ? "s" : ""} over limit`
                  : `${remaining} act${remaining !== 1 ? "s" : ""} remaining this month`}
              </p>

              {/* Overage or OK */}
              {usage && usage.overageChargeCents > 0 ? (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700">
                      Overage Charges: ${(usage.overageChargeCents / 100).toFixed(2)} — $10/doc +
                      $1/additional stamp
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
          <div className="px-6 py-4 border-b border-border/50">
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
              Loading appointments…
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No appointments for this month
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
                        <td className="px-6 py-4">{appt.estimatedCertificates ?? "—"}</td>
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
