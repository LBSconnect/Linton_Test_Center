import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { contactSubmissions, type InsertContact, type ContactSubmission } from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

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
    const result = await pool.query(
      'SELECT * FROM stripe.products WHERE id = $1',
      [productId]
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true) {
    const result = await pool.query(
      'SELECT * FROM stripe.products WHERE active = $1 ORDER BY name',
      [active]
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true) {
    const result = await pool.query(
      `WITH active_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = $1
        ORDER BY name
      )
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active,
        pr.metadata as price_metadata
      FROM active_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.name, pr.unit_amount`,
      [active]
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await pool.query(
      'SELECT * FROM stripe.prices WHERE id = $1',
      [priceId]
    );
    return result.rows[0] || null;
  }

  async getPricesForProduct(productId: string) {
    const result = await pool.query(
      'SELECT * FROM stripe.prices WHERE product = $1 AND active = true',
      [productId]
    );
    return result.rows;
  }

  async createContactSubmission(data: InsertContact): Promise<ContactSubmission> {
    const [result] = await db.insert(contactSubmissions).values(data).returning();
    return result;
  }
}

export const storage: IStorage = new DatabaseStorage();
