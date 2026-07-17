import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  corporateAccounts,
  corporatePlans,
  corporateAppointments,
  corporateUsageTracking,
  corporateAuditLog,
  type InsertCorporateAccount,
  type InsertCorporateAppointment,
  type CorporateAccount,
  type CorporatePlan,
  type CorporateAppointment,
} from "@shared/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    pool = pool || new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool);
  }
  return db;
}

// ─── Account Code Generation ──────────────────────────────────────────────────
export function generateAccountCode(id: number): string {
  return `LBS-ACCT-${String(id).padStart(6, "0")}`;
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export async function listCorporatePlans(): Promise<CorporatePlan[]> {
  const database = getDb();
  return database.select().from(corporatePlans).where(eq(corporatePlans.isActive, true));
}

export async function seedCorporatePlans(): Promise<void> {
  const database = getDb();
  const existing = await database.select().from(corporatePlans);
  if (existing.length > 0) return;

  const plans = [
    {
      name: "Bronze",
      tier: "bronze",
      monthlyPriceCents: 25000,
      maxActs: 15,
      maxAdmins: 1,
      features: [
        "Up to 15 notarial acts per month",
        "Online appointment scheduling",
        "Priority appointment access",
        "Monthly activity statement",
        "1 company administrator",
        "Email confirmations",
        "Secure office environment",
      ],
    },
    {
      name: "Silver",
      tier: "silver",
      monthlyPriceCents: 40000,
      maxActs: 25,
      maxAdmins: 3,
      features: [
        "Up to 25 notarial acts per month",
        "Dedicated booking link for employees",
        "Priority scheduling",
        "Secure document handling",
        "Scan-to-email (authorized staff only)",
        "Monthly utilization report",
        "3 company administrators",
        "Email confirmations & reminders",
      ],
    },
    {
      name: "Gold",
      tier: "gold",
      monthlyPriceCents: 75000,
      maxActs: 100,
      maxAdmins: 5,
      features: [
        "Up to 100 notarial acts per month",
        "Reserved appointment windows",
        "Dedicated account manager",
        "Monthly utilization reports",
        "Additional usage billed at statutory rates",
        "Priority queue access",
        "Scan-to-email included",
        "Up to 5 company administrators",
        "Corporate account portal (Phase 2)",
      ],
    },
  ];

  for (const plan of plans) {
    await database.insert(corporatePlans).values(plan as any);
  }
  console.log("Corporate plans seeded");
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
export async function createCorporateAccount(
  data: InsertCorporateAccount
): Promise<CorporateAccount> {
  const database = getDb();

  // Find matching plan
  const plans = await database
    .select()
    .from(corporatePlans)
    .where(eq(corporatePlans.tier, data.planTier));
  const plan = plans[0];

  // Insert account first to get the auto-increment ID
  const inserted = await database
    .insert(corporateAccounts)
    .values({
      accountCode: "TMP",
      companyName: data.companyName,
      businessAddress: data.businessAddress,
      city: data.city,
      state: data.state,
      zip: data.zip,
      primaryContactName: data.primaryContactName,
      primaryContactEmail: data.primaryContactEmail,
      primaryContactPhone: data.primaryContactPhone,
      primaryContactTitle: data.primaryContactTitle,
      apContactName: data.apContactName,
      apContactEmail: data.apContactEmail,
      companySize: data.companySize,
      estimatedMonthlyVolume: data.estimatedMonthlyVolume,
      planId: plan?.id,
      planTier: data.planTier,
      billingMethod: data.billingMethod,
      needsScanToEmail: data.needsScanToEmail,
      authorizedUsers: data.authorizedUsers,
      agreedToNoLegalAdvice: data.agreedToNoLegalAdvice,
      agreedToCertificateSelection: data.agreedToCertificateSelection,
      agreedToNoConfidentialDocs: data.agreedToNoConfidentialDocs,
      agreedToTexasFees: data.agreedToTexasFees,
      agreedToOverageCharges: data.agreedToOverageCharges,
      agreedToTerms: data.agreedToTerms,
      agreedAt: new Date(),
      specialRequirements: data.specialRequirements,
      status: "pending",
    } as any)
    .returning();

  const account = inserted[0];

  // Update with proper account code
  const accountCode = generateAccountCode(account.id);
  const updated = await database
    .update(corporateAccounts)
    .set({ accountCode })
    .where(eq(corporateAccounts.id, account.id))
    .returning();

  await logAudit("account", String(account.id), "enrollment_submitted", "system", {
    companyName: data.companyName,
    planTier: data.planTier,
    accountCode,
  });

  return updated[0];
}

export async function listCorporateAccounts(status?: string): Promise<CorporateAccount[]> {
  const database = getDb();
  const query = database
    .select()
    .from(corporateAccounts)
    .orderBy(desc(corporateAccounts.enrolledAt));

  if (status) {
    return database
      .select()
      .from(corporateAccounts)
      .where(eq(corporateAccounts.status, status))
      .orderBy(desc(corporateAccounts.enrolledAt));
  }
  return query;
}

export async function getCorporateAccount(id: number): Promise<CorporateAccount | null> {
  const database = getDb();
  const rows = await database
    .select()
    .from(corporateAccounts)
    .where(eq(corporateAccounts.id, id));
  return rows[0] || null;
}

export async function approveCorporateAccount(
  id: number,
  adminNotes?: string,
  stripeCheckoutUrl?: string
): Promise<CorporateAccount | null> {
  const database = getDb();
  const updated = await database
    .update(corporateAccounts)
    .set({ status: "approved", approvedAt: new Date(), adminNotes })
    .where(eq(corporateAccounts.id, id))
    .returning();

  await logAudit("account", String(id), "account_approved", "admin", { adminNotes, stripeCheckoutUrl });
  return updated[0] || null;
}

export async function rejectCorporateAccount(
  id: number,
  rejectionReason: string
): Promise<CorporateAccount | null> {
  const database = getDb();
  const updated = await database
    .update(corporateAccounts)
    .set({ status: "rejected", rejectedAt: new Date(), rejectionReason })
    .where(eq(corporateAccounts.id, id))
    .returning();

  await logAudit("account", String(id), "account_rejected", "admin", { rejectionReason });
  return updated[0] || null;
}

export async function updateCorporateAccountStripe(
  id: number,
  stripeCustomerId: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const database = getDb();
  await database
    .update(corporateAccounts)
    .set({
      stripeCustomerId,
      stripeSubscriptionId,
      status: stripeSubscriptionId ? "active" : "approved",
    })
    .where(eq(corporateAccounts.id, id));
}

// ─── Account by Code ──────────────────────────────────────────────────────────
export async function getCorporateAccountByCode(code: string): Promise<CorporateAccount | null> {
  const database = getDb();
  const rows = await database
    .select()
    .from(corporateAccounts)
    .where(eq(corporateAccounts.accountCode, code.toUpperCase()));
  return rows[0] || null;
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export function generateAppointmentCode(accountCode: string): string {
  const now = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  // e.g. LBS-000001-0716-4823
  const acctNum = accountCode.replace("LBS-ACCT-", "");
  return `LBS-${acctNum}-${mmdd}-${rand}`;
}

export async function createCorporateAppointment(
  data: InsertCorporateAppointment & { accountId: number }
): Promise<CorporateAppointment> {
  const database = getDb();
  const appointmentCode = generateAppointmentCode(
    (await getCorporateAccount(data.accountId))?.accountCode || "000000"
  );

  const inserted = await database
    .insert(corporateAppointments)
    .values({
      accountId: data.accountId,
      appointmentCode,
      employeeName: data.employeeName,
      employeeEmail: data.employeeEmail,
      employeePhone: data.employeePhone,
      appointmentDatetime: new Date(data.appointmentDatetime),
      numSigners: data.numSigners ?? 1,
      numDocuments: data.numDocuments ?? 1,
      estimatedCertificates: data.estimatedCertificates,
      idType: data.idType,
      needWitnesses: data.needWitnesses ?? false,
      needPrinting: data.needPrinting ?? false,
      needScanEmail: data.needScanEmail ?? false,
      specialInstructions: data.specialInstructions,
      status: "scheduled",
    } as any)
    .returning();

  await logAudit("appointment", inserted[0].id, "appointment_booked", data.employeeEmail, {
    accountId: data.accountId,
    appointmentCode,
    datetime: data.appointmentDatetime,
  });

  return inserted[0];
}

export async function listCorporateAppointments(
  accountId?: number
): Promise<CorporateAppointment[]> {
  const database = getDb();
  if (accountId) {
    return database
      .select()
      .from(corporateAppointments)
      .where(eq(corporateAppointments.accountId, accountId))
      .orderBy(desc(corporateAppointments.appointmentDatetime));
  }
  return database
    .select()
    .from(corporateAppointments)
    .orderBy(desc(corporateAppointments.appointmentDatetime));
}

export async function getCorporateAppointment(id: string): Promise<CorporateAppointment | null> {
  const database = getDb();
  const rows = await database
    .select()
    .from(corporateAppointments)
    .where(eq(corporateAppointments.id, id));
  return rows[0] || null;
}

export async function updateCorporateAppointmentStatus(
  id: string,
  status: "scheduled" | "completed" | "cancelled",
  adminNotes?: string,
  outlookEventId?: string
): Promise<CorporateAppointment | null> {
  const database = getDb();
  const updated = await database
    .update(corporateAppointments)
    .set({
      status,
      ...(status === "completed" ? { completedAt: new Date() } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(outlookEventId !== undefined ? { outlookEventId } : {}),
    } as any)
    .where(eq(corporateAppointments.id, id))
    .returning();
  await logAudit("appointment", id, `appointment_${status}`, "admin", { adminNotes });
  return updated[0] || null;
}

// ─── Usage Tracking ───────────────────────────────────────────────────────────
export async function incrementCorporateUsage(
  accountId: number,
  actsIncluded: number,
  actsToAdd: number = 1,
  numDocuments: number = 1,
  estimatedCertificates: number = 0
): Promise<{ overageChargeCents: number }> {
  const database = getDb();
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Overage charge per appointment: $10/doc + $1 per stamp beyond the first
  function calcOverageCharge(docs: number, stamps: number): number {
    return docs * 1000 + Math.max(0, stamps - 1) * 100; // in cents
  }

  const existing = await database
    .select()
    .from(corporateUsageTracking)
    .where(
      and(
        eq(corporateUsageTracking.accountId, accountId),
        eq(corporateUsageTracking.monthYear, monthYear)
      )
    );

  let overageChargeCents = 0;

  if (existing.length > 0) {
    const row = existing[0];
    const newUsed = row.actsUsed + actsToAdd;
    const overageActs = Math.max(0, newUsed - row.actsIncluded);
    // Charge applies when this act exceeds the plan limit
    if (newUsed > row.actsIncluded) {
      overageChargeCents = calcOverageCharge(numDocuments, estimatedCertificates);
    }
    const newOverageCharge = (row as any).overageChargeCents ?? 0;
    await database
      .update(corporateUsageTracking)
      .set({
        actsUsed: newUsed,
        overageActs,
        overageChargeCents: newOverageCharge + overageChargeCents,
        updatedAt: new Date(),
      } as any)
      .where(eq(corporateUsageTracking.id, row.id));
  } else {
    if (actsToAdd > actsIncluded) {
      overageChargeCents = calcOverageCharge(numDocuments, estimatedCertificates);
    }
    await database
      .insert(corporateUsageTracking)
      .values({
        accountId,
        monthYear,
        actsUsed: actsToAdd,
        actsIncluded,
        overageActs: Math.max(0, actsToAdd - actsIncluded),
        overageChargeCents,
        billingPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        billingPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      } as any);
  }

  return { overageChargeCents };
}

export async function getCorporateUsage(
  accountId: number,
  monthYear?: string
): Promise<{ monthYear: string; actsUsed: number; actsIncluded: number; overageActs: number; overageChargeCents: number } | null> {
  const database = getDb();
  const now = new Date();
  const target = monthYear || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const rows = await database
    .select()
    .from(corporateUsageTracking)
    .where(
      and(
        eq(corporateUsageTracking.accountId, accountId),
        eq(corporateUsageTracking.monthYear, target)
      )
    );

  return rows[0]
    ? {
        monthYear: rows[0].monthYear,
        actsUsed: rows[0].actsUsed,
        actsIncluded: rows[0].actsIncluded,
        overageActs: rows[0].overageActs,
        overageChargeCents: (rows[0] as any).overageChargeCents ?? 0,
      }
    : null;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export async function logAudit(
  entityType: string,
  entityId: string,
  action: string,
  performedBy: string,
  details?: object,
  ipAddress?: string
): Promise<void> {
  try {
    const database = getDb();
    await database.insert(corporateAuditLog).values({
      entityType,
      entityId,
      action,
      performedBy,
      details: details || {},
      ipAddress,
    } as any);
  } catch {
    // non-critical
  }
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getCorporateDashboardStats() {
  const database = getDb();

  const [allAccounts, pendingList, activeList] = await Promise.all([
    database.select().from(corporateAccounts),
    database.select().from(corporateAccounts).where(eq(corporateAccounts.status, "pending")),
    database.select().from(corporateAccounts).where(eq(corporateAccounts.status, "active")),
  ]);

  const monthlyRevenue = activeList.reduce((sum, acct) => {
    const prices: Record<string, number> = { bronze: 250, silver: 400, gold: 750 };
    return sum + (prices[acct.planTier || ""] || 0);
  }, 0);

  return {
    totalAccounts: allAccounts.length,
    pendingEnrollments: pendingList.length,
    activeAccounts: activeList.length,
    monthlyRevenueDollars: monthlyRevenue,
    recentEnrollments: allAccounts
      .sort((a, b) => new Date(b.enrolledAt!).getTime() - new Date(a.enrolledAt!).getTime())
      .slice(0, 10),
  };
}

// ─── Portal Helpers ───────────────────────────────────────────────────────────

export async function getCorporateUsageHistory(
  accountId: number,
  months: number = 6
): Promise<{ monthYear: string; actsUsed: number; actsIncluded: number; overageActs: number; overageChargeCents: number }[]> {
  const database = getDb();
  const rows = await database
    .select()
    .from(corporateUsageTracking)
    .where(eq(corporateUsageTracking.accountId, accountId))
    .orderBy(desc(corporateUsageTracking.monthYear))
    .limit(months);

  return rows.map((r) => ({
    monthYear: r.monthYear,
    actsUsed: r.actsUsed,
    actsIncluded: r.actsIncluded,
    overageActs: r.overageActs,
    overageChargeCents: (r as any).overageChargeCents ?? 0,
  })).reverse();
}

// ─── Reporting ────────────────────────────────────────────────────────────────

export async function getAdminReportingData() {
  const database = getDb();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const [allAccounts, allAppointments, usageThisMonth, usageLastMonth, auditSample] = await Promise.all([
    database.select().from(corporateAccounts).orderBy(desc(corporateAccounts.enrolledAt)),
    database.select().from(corporateAppointments).orderBy(desc(corporateAppointments.appointmentDatetime)),
    database.select().from(corporateUsageTracking).where(eq(corporateUsageTracking.monthYear, currentMonth)),
    database.select().from(corporateUsageTracking).where(eq(corporateUsageTracking.monthYear, lastMonth)),
    database.select().from(corporateAuditLog).orderBy(desc(corporateAuditLog.createdAt)).limit(5),
  ]);

  const activeAccounts = allAccounts.filter((a) => a.status === "active");
  const prices: Record<string, number> = { bronze: 250, silver: 400, gold: 750 };
  const planLimits: Record<string, number> = { bronze: 15, silver: 25, gold: 100 };

  // Plan tier breakdown
  const planBreakdown = {
    bronze: activeAccounts.filter((a) => a.planTier === "bronze").length,
    silver: activeAccounts.filter((a) => a.planTier === "silver").length,
    gold: activeAccounts.filter((a) => a.planTier === "gold").length,
  };

  // Revenue
  const revenueThisMonth = activeAccounts.reduce((s, a) => s + (prices[a.planTier || ""] || 0), 0);
  const overageThisMonth = usageThisMonth.reduce((s, u) => s + ((u as any).overageChargeCents || 0), 0) / 100;
  const overageLastMonth = usageLastMonth.reduce((s, u) => s + ((u as any).overageChargeCents || 0), 0) / 100;

  // Projected overage alerts (>= 80% of plan limit this month)
  const overageAlerts = activeAccounts
    .map((acct) => {
      const usage = usageThisMonth.find((u) => u.accountId === acct.id);
      const limit = planLimits[acct.planTier || ""] || 15;
      const used = usage?.actsUsed || 0;
      const pct = Math.round((used / limit) * 100);
      return { accountId: acct.id, accountCode: acct.accountCode, companyName: acct.companyName, planTier: acct.planTier, actsUsed: used, actsIncluded: limit, pct };
    })
    .filter((a) => a.pct >= 80)
    .sort((a, b) => b.pct - a.pct);

  // Appointment volume by day (0=Sun) and hour
  const byDay = new Array(7).fill(0);
  const byHour = new Array(24).fill(0);
  let totalTurnaroundMs = 0;
  let turnaroundCount = 0;

  for (const appt of allAppointments) {
    if (appt.status === "completed") {
      const dt = new Date(appt.appointmentDatetime);
      byDay[dt.getDay()]++;
      byHour[dt.getHours()]++;
      const created = appt.createdAt ? new Date(appt.createdAt) : null;
      if (!created) continue;
      const diff = dt.getTime() - created.getTime();
      if (diff > 0) { totalTurnaroundMs += diff; turnaroundCount++; }
    }
  }
  const avgTurnaroundDays = turnaroundCount > 0 ? Math.round((totalTurnaroundMs / turnaroundCount / 86400000) * 10) / 10 : 0;

  // Account health: active accounts by last completed appointment date
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

  const completedByAccount: Record<number, Date> = {};
  for (const appt of allAppointments) {
    if (appt.status === "completed") {
      const dt = new Date(appt.appointmentDatetime);
      if (!completedByAccount[appt.accountId] || dt > completedByAccount[appt.accountId]) {
        completedByAccount[appt.accountId] = dt;
      }
    }
  }

  const inactiveAccounts = activeAccounts
    .filter((acct) => {
      const last = completedByAccount[acct.id];
      return !last || last < thirtyDaysAgo;
    })
    .map((acct) => ({
      id: acct.id,
      companyName: acct.companyName,
      accountCode: acct.accountCode,
      planTier: acct.planTier,
      lastAppointment: completedByAccount[acct.id]?.toISOString() || null,
      daysSinceLast: completedByAccount[acct.id]
        ? Math.floor((now.getTime() - completedByAccount[acct.id].getTime()) / 86400000)
        : null,
    }));

  // Enrollment trend: last 6 months
  const enrollmentTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const count = allAccounts.filter((a) => {
      if (!a.enrolledAt) return false;
      const e = new Date(a.enrolledAt);
      return e.getFullYear() === d.getFullYear() && e.getMonth() === d.getMonth();
    }).length;
    return { month: label, count };
  });

  return {
    planBreakdown,
    revenueThisMonth,
    overageThisMonth,
    overageLastMonth,
    overageAlerts,
    appointmentVolumeByDay: byDay,
    appointmentVolumeByHour: byHour,
    avgTurnaroundDays,
    inactiveAccounts,
    accountsInactive30: inactiveAccounts.length,
    accountsInactive90: activeAccounts.filter((acct) => {
      const last = completedByAccount[acct.id];
      return !last || last < ninetyDaysAgo;
    }).length,
    enrollmentTrend,
    totalAppointments: allAppointments.length,
    completedAppointments: allAppointments.filter((a) => a.status === "completed").length,
    scheduledAppointments: allAppointments.filter((a) => a.status === "scheduled").length,
  };
}

export async function getAuditLogEntries(limit = 100, offset = 0): Promise<any[]> {
  const database = getDb();
  return database
    .select()
    .from(corporateAuditLog)
    .orderBy(desc(corporateAuditLog.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getExportData(type: "appointments" | "accounts"): Promise<string> {
  const database = getDb();
  if (type === "accounts") {
    const accounts = await database.select().from(corporateAccounts).orderBy(desc(corporateAccounts.enrolledAt));
    const header = "Account Code,Company Name,Plan Tier,Status,Primary Contact,Email,Phone,Enrolled At,Approved At\n";
    const rows = accounts.map((a) =>
      [a.accountCode, `"${a.companyName}"`, a.planTier || "", a.status, `"${a.primaryContactName}"`, a.primaryContactEmail, a.primaryContactPhone || "", a.enrolledAt ? new Date(a.enrolledAt).toLocaleDateString() : "", a.approvedAt ? new Date(a.approvedAt).toLocaleDateString() : ""].join(",")
    );
    return header + rows.join("\n");
  }

  // appointments export with account info
  const [appointments, accounts] = await Promise.all([
    database.select().from(corporateAppointments).orderBy(desc(corporateAppointments.appointmentDatetime)),
    database.select().from(corporateAccounts),
  ]);
  const acctMap: Record<number, (typeof accounts)[0]> = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const header = "Appointment Code,Company,Account Code,Employee Name,Employee Email,Date,Time CT,Signers,Documents,Status,Completed At,Witnesses,Printing,Scan Email\n";
  const rows = appointments.map((a) => {
    const acct = acctMap[a.accountId];
    const dt = new Date(a.appointmentDatetime);
    const dateStr = dt.toLocaleDateString("en-US", { timeZone: "America/Chicago" });
    const timeStr = dt.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });
    return [a.appointmentCode, `"${acct?.companyName || ""}"`, acct?.accountCode || "", `"${a.employeeName}"`, a.employeeEmail, dateStr, timeStr, a.numSigners, a.numDocuments, a.status, a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "", a.needWitnesses ? "Yes" : "No", a.needPrinting ? "Yes" : "No", a.needScanEmail ? "Yes" : "No"].join(",");
  });
  return header + rows.join("\n");
}

// ─── Migrations ───────────────────────────────────────────────────────────────
export async function runCorporateMigrations(): Promise<void> {
  const database = getDb();
  const pg = pool!;

  await pg.query(`
    CREATE TABLE IF NOT EXISTS corporate_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      tier VARCHAR(20) NOT NULL,
      monthly_price_cents INTEGER NOT NULL,
      max_acts INTEGER NOT NULL,
      max_admins INTEGER NOT NULL DEFAULT 1,
      features JSONB NOT NULL DEFAULT '[]',
      stripe_price_id VARCHAR(100),
      stripe_product_id VARCHAR(100),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS corporate_accounts (
      id SERIAL PRIMARY KEY,
      account_code VARCHAR(20) NOT NULL UNIQUE,
      company_name VARCHAR(200) NOT NULL,
      business_address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(2) NOT NULL,
      zip VARCHAR(10) NOT NULL,
      primary_contact_name VARCHAR(100) NOT NULL,
      primary_contact_email VARCHAR(200) NOT NULL,
      primary_contact_phone VARCHAR(20),
      primary_contact_title VARCHAR(100),
      ap_contact_name VARCHAR(100),
      ap_contact_email VARCHAR(200),
      company_size VARCHAR(50),
      estimated_monthly_volume INTEGER,
      plan_id INTEGER,
      plan_tier VARCHAR(20),
      billing_method VARCHAR(50),
      needs_scan_to_email BOOLEAN DEFAULT false,
      authorized_users JSONB DEFAULT '[]',
      agreed_to_no_legal_advice BOOLEAN DEFAULT false,
      agreed_to_certificate_selection BOOLEAN DEFAULT false,
      agreed_to_no_confidential_docs BOOLEAN DEFAULT false,
      agreed_to_texas_fees BOOLEAN DEFAULT false,
      agreed_to_terms BOOLEAN DEFAULT false,
      agreed_at TIMESTAMP,
      special_requirements TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      stripe_customer_id VARCHAR(100),
      stripe_subscription_id VARCHAR(100),
      stripe_checkout_session_id VARCHAR(100),
      admin_notes TEXT,
      enrolled_at TIMESTAMP DEFAULT NOW(),
      approved_at TIMESTAMP,
      rejected_at TIMESTAMP,
      rejection_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS corporate_appointments (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      account_id INTEGER NOT NULL,
      appointment_code VARCHAR(30) NOT NULL UNIQUE,
      employee_name VARCHAR(100) NOT NULL,
      employee_email VARCHAR(200) NOT NULL,
      employee_phone VARCHAR(20),
      appointment_datetime TIMESTAMP NOT NULL,
      num_signers INTEGER NOT NULL DEFAULT 1,
      num_documents INTEGER NOT NULL DEFAULT 1,
      estimated_certificates INTEGER,
      id_type VARCHAR(50),
      need_witnesses BOOLEAN DEFAULT false,
      need_printing BOOLEAN DEFAULT false,
      need_scan_email BOOLEAN DEFAULT false,
      special_instructions TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
      outlook_event_id VARCHAR(300),
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS corporate_usage_tracking (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      account_id INTEGER NOT NULL,
      month_year VARCHAR(7) NOT NULL,
      acts_used INTEGER NOT NULL DEFAULT 0,
      acts_included INTEGER NOT NULL,
      overage_acts INTEGER NOT NULL DEFAULT 0,
      billing_period_start TIMESTAMP,
      billing_period_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS corporate_audit_log (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(100),
      action VARCHAR(100) NOT NULL,
      performed_by VARCHAR(100),
      details JSONB,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Add columns if not present (safe on existing deployments)
  await pg.query(`
    ALTER TABLE corporate_usage_tracking
    ADD COLUMN IF NOT EXISTS overage_charge_cents INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE corporate_accounts
    ADD COLUMN IF NOT EXISTS agreed_to_overage_charges BOOLEAN NOT NULL DEFAULT false;
  `);

  // Keep plan act limits in sync with product decisions
  await pg.query(`
    UPDATE corporate_plans SET max_acts = 15,
      features = '["Up to 15 notarial acts per month","Online appointment scheduling","Priority appointment access","Monthly activity statement","1 company administrator","Email confirmations","Secure office environment"]'::jsonb
    WHERE tier = 'bronze';

    UPDATE corporate_plans SET max_acts = 25,
      features = '["Up to 25 notarial acts per month","Dedicated booking link for employees","Priority scheduling","Secure document handling","Scan-to-email (authorized staff only)","Monthly utilization report","3 company administrators","Email confirmations & reminders"]'::jsonb
    WHERE tier = 'silver';
  `);

  console.log("Corporate migrations complete");
  await seedCorporatePlans();
}
