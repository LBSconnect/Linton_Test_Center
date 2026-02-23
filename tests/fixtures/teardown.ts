/**
 * teardown.ts  —  Playwright globalTeardown
 *
 * Runs once after all tests complete. Removes every appointment row
 * that was created (or pre-seeded) by this test suite.
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { TEST_TAG } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

async function teardown() {
  if (!process.env.DATABASE_URL) {
    console.warn("[teardown] DATABASE_URL not set — skipping DB cleanup");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(
      `DELETE FROM appointments WHERE notes LIKE '${TEST_TAG}%' RETURNING id`
    );
    console.log(`[teardown] Deleted ${result.rowCount} test appointments.`);
  } finally {
    await pool.end();
  }
}

export default teardown;
