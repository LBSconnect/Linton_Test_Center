/**
 * seed.ts  —  Playwright globalSetup
 *
 * Runs once before all tests. Creates a clean, predictable DB state:
 *  - Deletes any leftover test appointments from prior runs
 *  - Pre-inserts a TAKEN slot used by the concurrency tests
 *
 * The slot date is always the next Monday at 10 AM CT so tests never
 * depend on a calendar date that has already passed.
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

/** Compute the ISO string for "next Monday at 10:00 AM CT" in UTC */
export function nextMondayAt10CT(): string {
  const now = new Date();
  const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7; // 1–7
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  // 10 AM CST = 16:00 UTC (winter). CDT = 15:00 UTC (summer).
  // Keep it simple: use UTC 16 which is unambiguously 10 AM CST.
  d.setUTCHours(16, 0, 0, 0);
  return d.toISOString();
}

/** ID prefix so teardown knows which rows to delete */
export const TEST_TAG = "e2e-test";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.warn("[seed] DATABASE_URL not set — skipping DB seed");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. Wipe leftover test data from any previous run
    await pool.query(`DELETE FROM appointments WHERE notes LIKE '${TEST_TAG}%'`);

    // 2. Pre-book the "taken" slot used by concurrency tests
    const takenSlot = nextMondayAt10CT();
    await pool.query(
      `INSERT INTO appointments
         (customer_name, customer_email, service_name, appointment_date,
          status, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        "Pre-booked User",
        "prebooked@e2e.test",
        "Notary Service",
        takenSlot,
        "confirmed",
        "paid",
        `${TEST_TAG}:prebooked`,
      ]
    );

    console.log(`[seed] Pre-booked slot at ${takenSlot}`);
    console.log("[seed] Done.");
  } finally {
    await pool.end();
  }
}

export default seed;
