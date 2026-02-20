import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { contactSubmissions, type InsertContact, type ContactSubmission } from "@shared/schema";
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
}

export const storage: IStorage = new DatabaseStorage();
