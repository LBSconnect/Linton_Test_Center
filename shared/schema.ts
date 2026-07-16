import { pgTable, text, varchar, timestamp, integer, serial, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  service: text("service"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

// Appointments table for service bookings
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  serviceName: text("service_name").notNull(),
  serviceId: text("service_id"), // Stripe product ID
  priceId: text("price_id"), // Stripe price ID
  priceAmount: integer("price_amount"), // Amount in cents
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, paid
  stripeSessionId: text("stripe_session_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// Corporate Notary Division
// ─────────────────────────────────────────────────────────────────────────────

export const corporatePlans = pgTable("corporate_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  tier: varchar("tier", { length: 20 }).notNull(), // bronze | silver | gold
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  maxActs: integer("max_acts").notNull(),
  maxAdmins: integer("max_admins").notNull().default(1),
  features: jsonb("features").notNull().default([]),
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  stripeProductId: varchar("stripe_product_id", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const corporateAccounts = pgTable("corporate_accounts", {
  id: serial("id").primaryKey(),
  accountCode: varchar("account_code", { length: 20 }).notNull().unique(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  businessAddress: text("business_address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zip: varchar("zip", { length: 10 }).notNull(),
  primaryContactName: varchar("primary_contact_name", { length: 100 }).notNull(),
  primaryContactEmail: varchar("primary_contact_email", { length: 200 }).notNull(),
  primaryContactPhone: varchar("primary_contact_phone", { length: 20 }),
  primaryContactTitle: varchar("primary_contact_title", { length: 100 }),
  apContactName: varchar("ap_contact_name", { length: 100 }),
  apContactEmail: varchar("ap_contact_email", { length: 200 }),
  companySize: varchar("company_size", { length: 50 }),
  estimatedMonthlyVolume: integer("estimated_monthly_volume"),
  planId: integer("plan_id"),
  planTier: varchar("plan_tier", { length: 20 }),
  billingMethod: varchar("billing_method", { length: 50 }),
  needsScanToEmail: boolean("needs_scan_to_email").default(false),
  authorizedUsers: jsonb("authorized_users").default([]),
  agreedToNoLegalAdvice: boolean("agreed_to_no_legal_advice").default(false),
  agreedToCertificateSelection: boolean("agreed_to_certificate_selection").default(false),
  agreedToNoConfidentialDocs: boolean("agreed_to_no_confidential_docs").default(false),
  agreedToTexasFees: boolean("agreed_to_texas_fees").default(false),
  agreedToTerms: boolean("agreed_to_terms").default(false),
  agreedAt: timestamp("agreed_at"),
  specialRequirements: text("special_requirements"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 100 }),
  adminNotes: text("admin_notes"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});

export const corporateAppointments = pgTable("corporate_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: integer("account_id").notNull(),
  appointmentCode: varchar("appointment_code", { length: 30 }).notNull().unique(),
  employeeName: varchar("employee_name", { length: 100 }).notNull(),
  employeeEmail: varchar("employee_email", { length: 200 }).notNull(),
  employeePhone: varchar("employee_phone", { length: 20 }),
  appointmentDatetime: timestamp("appointment_datetime").notNull(),
  numSigners: integer("num_signers").notNull().default(1),
  numDocuments: integer("num_documents").notNull().default(1),
  estimatedCertificates: integer("estimated_certificates"),
  idType: varchar("id_type", { length: 50 }),
  needWitnesses: boolean("need_witnesses").default(false),
  needPrinting: boolean("need_printing").default(false),
  needScanEmail: boolean("need_scan_email").default(false),
  specialInstructions: text("special_instructions"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  outlookEventId: varchar("outlook_event_id", { length: 300 }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const corporateUsageTracking = pgTable("corporate_usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: integer("account_id").notNull(),
  monthYear: varchar("month_year", { length: 7 }).notNull(),
  actsUsed: integer("acts_used").notNull().default(0),
  actsIncluded: integer("acts_included").notNull(),
  overageActs: integer("overage_acts").notNull().default(0),
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const corporateAuditLog = pgTable("corporate_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  action: varchar("action", { length: 100 }).notNull(),
  performedBy: varchar("performed_by", { length: 100 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertCorporateAccountSchema = z.object({
  companyName: z.string().min(2),
  businessAddress: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  zip: z.string().min(5),
  primaryContactName: z.string().min(2),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z.string().optional(),
  primaryContactTitle: z.string().optional(),
  apContactName: z.string().optional(),
  apContactEmail: z.string().email().optional(),
  companySize: z.string().optional(),
  estimatedMonthlyVolume: z.number().int().optional(),
  planTier: z.enum(["bronze", "silver", "gold"]),
  billingMethod: z.string().optional(),
  needsScanToEmail: z.boolean().default(false),
  authorizedUsers: z.array(z.object({ name: z.string(), email: z.string().email() })).default([]),
  agreedToNoLegalAdvice: z.boolean(),
  agreedToCertificateSelection: z.boolean(),
  agreedToNoConfidentialDocs: z.boolean(),
  agreedToTexasFees: z.boolean(),
  agreedToTerms: z.boolean(),
  specialRequirements: z.string().optional(),
});

export type InsertCorporateAccount = z.infer<typeof insertCorporateAccountSchema>;
export type CorporateAccount = typeof corporateAccounts.$inferSelect;
export type CorporatePlan = typeof corporatePlans.$inferSelect;
export type CorporateAppointment = typeof corporateAppointments.$inferSelect;

