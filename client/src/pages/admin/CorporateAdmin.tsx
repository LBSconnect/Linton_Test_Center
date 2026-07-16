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
  ExternalLink,
  Mail,
  Phone,
  CreditCard,
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
  const [stripeUrl, setStripeUrl] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);

  async function createStripeLink() {
    setCreatingLink(true);
    try {
      const { checkoutUrl } = await api(
        `/api/admin/corporate/accounts/${account.id}/stripe-checkout`,
        { method: "POST" }
      );
      setStripeUrl(checkoutUrl);
      setMsg({ type: "success", text: "Stripe checkout link created." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setCreatingLink(false);
    }
  }

  async function approve() {
    setLoading("approve");
    try {
      await api(`/api/admin/corporate/accounts/${account.id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ adminNotes: approveNotes, stripeCheckoutUrl: stripeUrl || undefined }),
      });
      setMsg({ type: "success", text: "Account approved. Approval email sent." });
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
            <div className="space-y-2">
              <Label className="text-xs">Stripe Checkout URL (optional — generate first)</Label>
              <div className="flex gap-2">
                <Input
                  value={stripeUrl}
                  onChange={(e) => setStripeUrl(e.target.value)}
                  placeholder="https://checkout.stripe.com/..."
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createStripeLink}
                  disabled={creatingLink}
                  className="shrink-0"
                >
                  {creatingLink ? "…" : "Generate"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Admin Notes (optional)</Label>
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
              {loading === "approve" ? "Approving…" : "Approve & Send Email"}
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

      {/* Approved — generate Stripe link */}
      {account.status === "approved" && !account.stripeSubscriptionId && (
        <div className="bg-white rounded-xl border border-border/50 p-5 space-y-3">
          <h3 className="font-semibold text-[#0d1b35]">Awaiting Payment</h3>
          <p className="text-sm text-muted-foreground">
            This account is approved but not yet active. Generate a Stripe checkout link to send to the client.
          </p>
          <div className="flex gap-2">
            <Input
              value={stripeUrl}
              onChange={(e) => setStripeUrl(e.target.value)}
              placeholder="Paste or generate Stripe URL"
              className="text-xs"
            />
            <Button variant="outline" size="sm" onClick={createStripeLink} disabled={creatingLink} className="shrink-0">
              {creatingLink ? "…" : "Generate"}
            </Button>
          </div>
          {stripeUrl && (
            <a href={stripeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Open Checkout Link
            </a>
          )}
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

        {/* Account Table */}
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
      </div>
    </div>
  );
}
