import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  LogIn,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  CreditCard,
  CalendarCheck,
  CalendarX,
  FileCheck,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Account {
  id: number;
  accountCode: string;
  companyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string | null;
  apContactEmail: string | null;
  companySize: string | null;
  planTier: string | null;
  billingMethod: string | null;
  status: string;
  enrolledAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  authorizedUsers: { name: string; email: string }[];
  specialRequirements: string | null;
  needsScanToEmail: boolean | null;
  estimatedMonthlyVolume: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface Stats {
  totalAccounts: number;
  pendingEnrollments: number;
  activeAccounts: number;
  monthlyRevenueDollars: number;
}

interface Appointment {
  id: string;
  appointmentCode: string;
  accountId: number;
  employeeName: string;
  employeeEmail: string;
  employeePhone: string | null;
  appointmentDatetime: string;
  numSigners: number;
  numDocuments: number;
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

// ─── Appointment Status Badge ─────────────────────────────────────────────────

function ApptStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "Scheduled", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    completed: { label: "Completed", cls: "bg-green-100 text-green-700 border-green-200" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700 border-red-200" },
    no_show: { label: "No Show", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const c = cfg[status] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── Appointments Tab ─────────────────────────────────────────────────────────

function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/api/admin/corporate/appointments");
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      // silently fail — parent handles auth errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function complete(appt: Appointment) {
    setActionLoading(appt.id);
    try {
      await api(`/api/admin/corporate/appointments/${appt.id}/complete`, { method: "PUT" });
      setMsg({ id: appt.id, type: "success", text: "Marked complete. Usage logged." });
      load();
    } catch (err: any) {
      setMsg({ id: appt.id, type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  async function cancel(appt: Appointment) {
    setActionLoading(appt.id + "-cancel");
    try {
      await api(`/api/admin/corporate/appointments/${appt.id}/cancel`, { method: "PUT" });
      setMsg({ id: appt.id, type: "success", text: "Appointment cancelled." });
      load();
    } catch (err: any) {
      setMsg({ id: appt.id, type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold text-[#0d1b35]">All Appointments</h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {["all", "scheduled", "completed", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                    filter === s ? "bg-[#0d1b35] text-white" : "text-muted-foreground hover:bg-[#f8f9fb]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#f8f9fb] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {loading ? "Loading…" : "No appointments found"}
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((appt) => {
              const dt = new Date(appt.appointmentDatetime);
              const fmtDate = dt.toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric" });
              const fmtTime = dt.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });
              const isExpanded = expandedId === appt.id;
              const thisMsg = msg?.id === appt.id ? msg : null;

              return (
                <li key={appt.id} className="px-5 py-4">
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#0d1b35] text-sm">{appt.employeeName}</span>
                        <ApptStatusBadge status={appt.status} />
                        <span className="text-xs font-mono text-muted-foreground">{appt.appointmentCode}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate} at {fmtTime} CT · {appt.numSigners} signer{appt.numSigners !== 1 ? "s" : ""} · {appt.numDocuments} doc{appt.numDocuments !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{appt.employeeEmail}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {thisMsg && (
                        <div className={`p-3 rounded-lg text-xs ${thisMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                          {thisMsg.text}
                        </div>
                      )}

                      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm bg-[#f8f9fb] rounded-xl p-4">
                        <div><dt className="text-xs text-muted-foreground">ID Type</dt><dd>{appt.idType || "—"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{appt.employeePhone || "—"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Witnesses</dt><dd>{appt.needWitnesses ? "Yes" : "No"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Printing</dt><dd>{appt.needPrinting ? "Yes" : "No"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Scan-to-Email</dt><dd>{appt.needScanEmail ? "Yes" : "No"}</dd></div>
                        {appt.specialInstructions && (
                          <div className="col-span-2 sm:col-span-3">
                            <dt className="text-xs text-muted-foreground">Special Instructions</dt>
                            <dd className="whitespace-pre-wrap text-xs mt-0.5">{appt.specialInstructions}</dd>
                          </div>
                        )}
                      </dl>

                      {appt.status === "scheduled" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                            disabled={actionLoading === appt.id}
                            onClick={() => complete(appt)}
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            {actionLoading === appt.id ? "Saving…" : "Mark Complete"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
                            disabled={actionLoading === appt.id + "-cancel"}
                            onClick={() => cancel(appt)}
                          >
                            <CalendarX className="w-3.5 h-3.5" />
                            {actionLoading === appt.id + "-cancel" ? "Cancelling…" : "Cancel"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "lbs_admin_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── API Helpers ───────────────────────────────────────────────────────────────

async function api(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending Review", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    approved: { label: "Approved", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    active: { label: "Active", cls: "bg-green-100 text-green-700 border-green-200" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" },
    suspended: { label: "Suspended", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const c = cfg[status] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token } = await api("/api/admin/corporate/login", {
        method: "POST",
        body: JSON.stringify({ secret }),
      });
      setToken(token);
      onLogin();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b35] flex items-center justify-center px-6">
      <SEO title="Admin Login | LBS Corporate" canonical="/admin/corporate" noIndex />
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <Building2 className="w-10 h-10 text-[#0d1b35] mx-auto" />
          <h1 className="text-xl font-bold text-[#0d1b35]">LBS Corporate Admin</h1>
          <p className="text-sm text-muted-foreground">Enter your admin password to continue</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Admin Password</Label>
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-[#0d1b35] hover:bg-[#1a2d52] text-white"
            disabled={loading || !secret}
          >
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border/50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="w-5 h-5" style={{ color: color || "#6b7280" }} />
      </div>
      <p className="text-3xl font-bold text-[#0d1b35]">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Account Detail ────────────────────────────────────────────────────────────

function AccountDetail({
  account,
  onBack,
  onRefresh,
}: {
  account: Account;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [approveNotes, setApproveNotes] = useState(account.adminNotes || "");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function approve() {
    setLoading("approve");
    try {
      const result = await api(`/api/admin/corporate/accounts/${account.id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ adminNotes: approveNotes }),
      });
      const linkNote = result.stripeCheckoutUrl
        ? " Stripe payment link generated and emailed to the company."
        : " Note: Stripe not configured — no payment link was sent.";
      setMsg({ type: "success", text: `Account approved.${linkNote}` });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  }

  async function reject() {
    if (!rejectReason.trim()) {
      setMsg({ type: "error", text: "Please provide a rejection reason." });
      return;
    }
    setLoading("reject");
    try {
      await api(`/api/admin/corporate/accounts/${account.id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      setMsg({ type: "success", text: "Account rejected. Notification email sent." });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="h-5 w-px bg-border" />
        <h2 className="font-semibold text-[#0d1b35]">{account.companyName}</h2>
        <StatusBadge status={account.status} />
        <span className="text-xs text-muted-foreground font-mono ml-auto">{account.accountCode}</span>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm ${
            msg.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-white rounded-xl border border-border/50 p-5 space-y-4">
          <h3 className="font-semibold text-[#0d1b35] flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Company Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Company</dt><dd className="font-medium">{account.companyName}</dd></div>
            <div><dt className="text-muted-foreground">Size</dt><dd>{account.companySize || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Plan</dt><dd className="capitalize font-medium text-[#0d1b35]">{account.planTier}</dd></div>
            <div><dt className="text-muted-foreground">Billing</dt><dd className="capitalize">{account.billingMethod || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Est. Monthly Acts</dt><dd>{account.estimatedMonthlyVolume ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Scan-to-Email</dt><dd>{account.needsScanToEmail ? "Yes" : "No"}</dd></div>
            <div><dt className="text-muted-foreground">Enrolled</dt><dd>{account.enrolledAt ? new Date(account.enrolledAt).toLocaleDateString() : "—"}</dd></div>
          </dl>
        </div>

        {/* Contacts */}
        <div className="bg-white rounded-xl border border-border/50 p-5 space-y-4">
          <h3 className="font-semibold text-[#0d1b35] flex items-center gap-2">
            <Users className="w-4 h-4" /> Contacts
          </h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Primary Contact</dt><dd className="font-medium">{account.primaryContactName}</dd></div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <a href={`mailto:${account.primaryContactEmail}`} className="text-blue-600 hover:underline">{account.primaryContactEmail}</a>
            </div>
            {account.primaryContactPhone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <a href={`tel:${account.primaryContactPhone}`} className="hover:underline">{account.primaryContactPhone}</a>
              </div>
            )}
            {account.apContactEmail && (
              <>
                <div className="pt-2 border-t border-border/50"><dt className="text-muted-foreground">AP Contact</dt></div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <a href={`mailto:${account.apContactEmail}`} className="text-blue-600 hover:underline">{account.apContactEmail}</a>
                </div>
              </>
            )}
          </dl>

          {(account.authorizedUsers?.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authorized Users</p>
              <ul className="space-y-1">
                {account.authorizedUsers.map((u, i) => (
                  <li key={i} className="text-sm">
                    {u.name} — <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline">{u.email}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Special Requirements */}
        {account.specialRequirements && (
          <div className="bg-white rounded-xl border border-border/50 p-5 md:col-span-2 space-y-2">
            <h3 className="font-semibold text-[#0d1b35]">Special Requirements</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{account.specialRequirements}</p>
          </div>
        )}

        {/* Stripe Info */}
        {(account.stripeCustomerId || account.stripeSubscriptionId) && (
          <div className="bg-white rounded-xl border border-border/50 p-5 space-y-2">
            <h3 className="font-semibold text-[#0d1b35] flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Stripe
            </h3>
            <dl className="space-y-1 text-sm">
              {account.stripeCustomerId && (
                <div><dt className="text-muted-foreground">Customer ID</dt><dd className="font-mono text-xs">{account.stripeCustomerId}</dd></div>
              )}
              {account.stripeSubscriptionId && (
                <div><dt className="text-muted-foreground">Subscription ID</dt><dd className="font-mono text-xs">{account.stripeSubscriptionId}</dd></div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Actions for pending accounts */}
      {account.status === "pending" && (
        <div className="bg-white rounded-xl border border-border/50 p-5 space-y-5">
          <h3 className="font-semibold text-[#0d1b35]">Review Actions</h3>

          {/* Approve flow */}
          <div className="space-y-3 p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-sm font-medium text-green-800">Approve Enrollment</p>
            <p className="text-xs text-green-700">
              A Stripe payment link will be generated automatically and included in the approval email sent to {account.primaryContactEmail}.
            </p>
            <div className="space-y-2">
              <Label className="text-xs">Admin Notes (optional — internal only)</Label>
              <Textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Internal notes…"
                rows={2}
              />
            </div>
            <Button
              onClick={approve}
              disabled={loading === "approve"}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading === "approve" ? "Approving & sending email…" : "Approve & Send Payment Link"}
            </Button>
          </div>

          {/* Reject flow */}
          <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm font-medium text-red-800">Reject Enrollment</p>
            <div className="space-y-2">
              <Label className="text-xs">Rejection Reason (required)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Service area does not cover this location…"
                rows={2}
              />
            </div>
            <Button
              onClick={reject}
              disabled={loading === "reject"}
              variant="destructive"
              className="gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              {loading === "reject" ? "Rejecting…" : "Reject & Notify"}
            </Button>
          </div>
        </div>
      )}

      {/* Force Activate — testing bypass */}
      {(account.status === "pending" || account.status === "approved") && (
        <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-3">
          <h3 className="font-semibold text-purple-900 text-sm">Testing Only — Bypass Payment</h3>
          <p className="text-xs text-muted-foreground">
            Force this account to <strong>Active</strong> without Stripe payment. Use only for testing the booking workflow.
          </p>
          <Button
            size="sm"
            className="bg-purple-700 hover:bg-purple-800 text-white gap-1.5"
            disabled={loading === "force-activate"}
            onClick={async () => {
              setLoading("force-activate");
              try {
                await api(`/api/admin/corporate/accounts/${account.id}/force-activate`, { method: "PUT" });
                setMsg({ type: "success", text: "Account force-activated. Employees can now book appointments." });
                onRefresh();
              } catch (err: any) {
                setMsg({ type: "error", text: err.message });
              } finally {
                setLoading(null);
              }
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loading === "force-activate" ? "Activating…" : "Force Activate (Skip Payment)"}
          </Button>
        </div>
      )}

      {/* Approved — awaiting payment */}
      {account.status === "approved" && !account.stripeSubscriptionId && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-3">
          <h3 className="font-semibold text-[#0d1b35]">Awaiting Payment</h3>
          <p className="text-sm text-muted-foreground">
            Approval email with Stripe payment link has been sent to{" "}
            <strong>{account.primaryContactEmail}</strong>. Account activates automatically once payment is complete.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
            disabled={loading === "resend"}
            onClick={async () => {
              setLoading("resend");
              try {
                await api(`/api/admin/corporate/accounts/${account.id}/resend-approval`, { method: "POST" });
                setMsg({ type: "success", text: "Approval email with fresh payment link resent." });
              } catch (err: any) {
                setMsg({ type: "error", text: err.message });
              } finally {
                setLoading(null);
              }
            }}
          >
            <Mail className="w-4 h-4" />
            {loading === "resend" ? "Sending…" : "Resend Payment Link"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function CorporateAdmin() {
  const [authed, setAuthed] = useState(!!getToken());
  const [stats, setStats] = useState<Stats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"enrollments" | "appointments">("enrollments");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, acctData] = await Promise.all([
        api("/api/admin/corporate/stats"),
        api("/api/admin/corporate/accounts"),
      ]);
      setStats(statsData);
      setAccounts(acctData);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("Invalid")) {
        clearToken();
        setAuthed(false);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  function refreshSelected() {
    load().then(() => {
      if (selected) {
        const updated = accounts.find((a) => a.id === selected.id);
        if (updated) setSelected(updated);
      }
    });
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  const filteredAccounts = filter === "all" ? accounts : accounts.filter((a) => a.status === filter);

  if (selected) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <AccountDetail
            account={selected}
            onBack={() => setSelected(null)}
            onRefresh={refreshSelected}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <SEO title="Corporate Admin Dashboard | LBS" canonical="/admin/corporate" noIndex />

      {/* Header */}
      <div className="bg-[#0d1b35] text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[#c9a84c]" />
            <div>
              <h1 className="font-bold text-lg leading-tight">LBS Corporate Admin</h1>
              <p className="text-xs text-white/50">Enterprise Notary Division</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={load}
              disabled={loading}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { clearToken(); setAuthed(false); }}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="Total Accounts" value={stats.totalAccounts} color="#0d1b35" />
            <StatCard icon={Clock} label="Pending Review" value={stats.pendingEnrollments} color="#f59e0b" />
            <StatCard icon={CheckCircle2} label="Active Accounts" value={stats.activeAccounts} color="#10b981" />
            <StatCard
              icon={TrendingUp}
              label="Monthly Revenue"
              value={`$${stats.monthlyRevenueDollars.toLocaleString()}`}
              color="#c9a84c"
            />
          </div>
        )}

        {/* Main Tab Switcher */}
        <div className="flex gap-1 border-b border-border/50">
          {(["enrollments", "appointments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                mainTab === tab
                  ? "border-[#0d1b35] text-[#0d1b35]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "enrollments" ? <Building2 className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Enrollments Tab */}
        {mainTab === "enrollments" && (
          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="font-semibold text-[#0d1b35]">Enrollments</h2>
              <div className="flex gap-1">
                {["all", "pending", "approved", "active", "rejected"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                      filter === s ? "bg-[#0d1b35] text-white" : "text-muted-foreground hover:bg-[#f8f9fb]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                {loading ? "Loading…" : "No accounts found"}
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {filteredAccounts.map((acct) => (
                  <li
                    key={acct.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8f9fb] cursor-pointer transition-colors"
                    onClick={() => setSelected(acct)}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-medium text-[#0d1b35] truncate">{acct.companyName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {acct.primaryContactName} · {acct.primaryContactEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className="text-xs capitalize bg-[#0d1b35]/10 text-[#0d1b35] hover:bg-[#0d1b35]/10">
                        {acct.planTier}
                      </Badge>
                      <StatusBadge status={acct.status} />
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {acct.enrolledAt ? new Date(acct.enrolledAt).toLocaleDateString() : "—"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {mainTab === "appointments" && <AppointmentsTab />}
      </div>
    </div>
  );
}
