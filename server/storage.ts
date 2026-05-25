import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, gte, lte, count } from "drizzle-orm";
import {
  contactSubmissions,
  appointments,
  classRegistrations,
  type InsertContact,
  type ContactSubmission,
  type InsertAppointment,
  type Appointment,
  type InsertClassRegistration,
  type ClassRegistration,
} from "@shared/schema";
import { getUncachableStripeClient } from "./stripeClient";

// Create pool only if DATABASE_URL is set
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool);
} else {
  console.warn('DATABASE_URL not set, database features will be disabled');
}

export interface IStorage {
  listProducts(active?: boolean): Promise<any[]>;
  getProduct(productId: string): Promise<any | null>;
  listProductsWithPrices(active?: boolean): Promise<any[]>;
  getPrice(priceId: string): Promise<any | null>;
  getPricesForProduct(productId: string): Promise<any[]>;
  createContactSubmission(data: InsertContact): Promise<ContactSubmission>;
  createAppointment(data: InsertAppointment): Promise<Appointment>;
  getAppointment(id: string): Promise<Appointment | null>;
  updateAppointmentPayment(id: string, paymentStatus: string, stripeSessionId?: string): Promise<Appointment | null>;
  getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  // Class registrations
  createClassRegistration(data: InsertClassRegistration): Promise<ClassRegistration>;
  getClassRegistration(id: string): Promise<ClassRegistration | null>;
  updateClassRegistrationPayment(id: string, paymentStatus: string, stripeSessionId?: string): Promise<ClassRegistration | null>;
  getClassRegistrationCount(classType: string, classDate: string): Promise<number>;
  runMigrations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProduct(productId: string) {
    try {
      const stripe = await getUncachableStripeClient();
      const product = await stripe.products.retrieve(productId);
      return product;
    } catch (error) {
      return null;
    }
  }

  async listProducts(active = true) {
    try {
      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ active, limit: 100 });
      return products.data;
    } catch (error) {
      console.error('Error listing products from Stripe:', error);
      return [];
    }
  }

  async listProductsWithPrices(active = true) {
    try {
      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ active, limit: 100 });

      const result = [];
      for (const product of products.data) {
        const prices = await stripe.prices.list({ product: product.id, active: true });

        for (const price of prices.data) {
          result.push({
            product_id: product.id,
            product_name: product.name,
            product_description: product.description,
            product_active: product.active,
            product_metadata: product.metadata,
            price_id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
            price_active: price.active,
            price_metadata: price.metadata,
          });
        }
      }

      // Sort by name and price
      result.sort((a, b) => {
        const nameCompare = (a.product_name || '').localeCompare(b.product_name || '');
        if (nameCompare !== 0) return nameCompare;
        return (a.unit_amount || 0) - (b.unit_amount || 0);
      });

      return result;
    } catch (error) {
      console.error('Error listing products with prices from Stripe:', error);
      return [];
    }
  }

  async getPrice(priceId: string) {
    try {
      const stripe = await getUncachableStripeClient();
      const price = await stripe.prices.retrieve(priceId);
      return price;
    } catch (error) {
      return null;
    }
  }

  async getPricesForProduct(productId: string) {
    try {
      const stripe = await getUncachableStripeClient();
      const prices = await stripe.prices.list({ product: productId, active: true });
      return prices.data;
    } catch (error) {
      console.error('Error getting prices for product from Stripe:', error);
      return [];
    }
  }

  async createContactSubmission(data: InsertContact): Promise<ContactSubmission> {
    if (!db) {
      throw new Error('Database not configured');
    }
    const [result] = await db.insert(contactSubmissions).values(data).returning();
    return result;
  }

  async createAppointment(data: InsertAppointment): Promise<Appointment> {
    if (!db) {
      throw new Error('Database not configured');
    }
    const [result] = await db.insert(appointments).values(data).returning();
    return result;
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    if (!db) {
      throw new Error('Database not configured');
    }
    const [result] = await db.select().from(appointments).where(eq(appointments.id, id));
    return result || null;
  }

  async updateAppointmentPayment(id: string, paymentStatus: string, stripeSessionId?: string): Promise<Appointment | null> {
    if (!db) {
      throw new Error('Database not configured');
    }
    const updateData: any = {
      paymentStatus,
      updatedAt: new Date(),
      status: paymentStatus === 'paid' ? 'confirmed' : 'pending'
    };
    if (stripeSessionId) {
      updateData.stripeSessionId = stripeSessionId;
    }
    const [result] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();
    return result || null;
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    if (!db) {
      throw new Error('Database not configured');
    }
    const results = await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, startDate),
          lte(appointments.appointmentDate, endDate)
        )
      );
    return results;
  }

  async createClassRegistration(data: InsertClassRegistration): Promise<ClassRegistration> {
    if (!db) throw new Error('Database not configured');
    const [result] = await db.insert(classRegistrations).values(data).returning();
    return result;
  }

  async getClassRegistration(id: string): Promise<ClassRegistration | null> {
    if (!db) throw new Error('Database not configured');
    const [result] = await db.select().from(classRegistrations).where(eq(classRegistrations.id, id));
    return result || null;
  }

  async updateClassRegistrationPayment(id: string, paymentStatus: string, stripeSessionId?: string): Promise<ClassRegistration | null> {
    if (!db) throw new Error('Database not configured');
    const updateData: any = { paymentStatus };
    if (stripeSessionId) updateData.stripeSessionId = stripeSessionId;
    const [result] = await db
      .update(classRegistrations)
      .set(updateData)
      .where(eq(classRegistrations.id, id))
      .returning();
    return result || null;
  }

  async getClassRegistrationCount(classType: string, classDate: string): Promise<number> {
    if (!db) throw new Error('Database not configured');
    const [result] = await db
      .select({ total: count() })
      .from(classRegistrations)
      .where(
        and(
          eq(classRegistrations.classType, classType),
          eq(classRegistrations.classDate, classDate),
          eq(classRegistrations.paymentStatus, 'paid')
        )
      );
    return Number(result?.total ?? 0);
  }

  async runMigrations(): Promise<void> {
    if (!pool) {
      console.warn('Database not configured, skipping migrations');
      return;
    }
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS class_registrations (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          class_type TEXT NOT NULL,
          class_date TEXT NOT NULL,
          class_time TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT,
          payment_status TEXT NOT NULL DEFAULT 'unpaid',
          stripe_session_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Migrations complete: class_registrations table ready');
    } catch (error: any) {
      console.error('Migration error:', error.message);
    }
  }
}

export const storage: IStorage = new DatabaseStorage();
