import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and } from "drizzle-orm";
import {
  corporateAccounts,
  corporatePlans,
  corporateAppointments,
  corporateUsageTracking,
  corporateAuditLog,
  type InsertCorporateAccount,
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
      maxActs: 20,
      maxAdmins: 1,
      features: [
        "Up to 20 notarial acts per month",
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
      maxActs: 50,
      maxAdmins: 3,
      features: [
        "Up to 50 notarial acts per month",
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

// ─── Appointments ─────────────────────────────────────────────────────────────
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

  console.log("Corporate migrations complete");
  await seedCorporatePlans();
}
