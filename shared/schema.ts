import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
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

// Class registrations for weekly group study sessions
export const classRegistrations = pgTable("class_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classType: text("class_type").notNull(),   // "life-insurance" | "property-casualty"
  classDate: text("class_date").notNull(),   // "2026-06-06" (YYYY-MM-DD)
  classTime: text("class_time").notNull(),   // "08:00" | "10:00"
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassRegistrationSchema = createInsertSchema(classRegistrations).omit({
  id: true,
  createdAt: true,
});

export type InsertClassRegistration = z.infer<typeof insertClassRegistrationSchema>;
export type ClassRegistration = typeof classRegistrations.$inferSelect;
