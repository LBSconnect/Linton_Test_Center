/**
 * db.ts  —  Database assertion helpers for E2E tests
 *
 * Used to verify that bookings are persisted correctly after
 * successful payments and webhook processing.
 */
import { Pool } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for DB assertions");
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

export async function closePool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

export interface AppointmentRow {
  id: string;
  customer_name: string;
  customer_email: string;
  service_name: string;
  appointment_date: Date;
  status: string;
  payment_status: string;
  stripe_session_id: string | null;
  notes: string | null;
}

/** Fetch a single appointment by Stripe checkout session ID */
export async function getAppointmentBySession(
  sessionId: string
): Promise<AppointmentRow | null> {
  const { rows } = await getPool().query<AppointmentRow>(
    "SELECT * FROM appointments WHERE stripe_session_id = $1 LIMIT 1",
    [sessionId]
  );
  return rows[0] ?? null;
}

/** Fetch appointments for an email address within the last 5 minutes */
export async function getRecentAppointments(
  email: string
): Promise<AppointmentRow[]> {
  const { rows } = await getPool().query<AppointmentRow>(
    `SELECT * FROM appointments
      WHERE customer_email = $1
        AND created_at >= NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC`,
    [email]
  );
  return rows;
}

/** Count appointments for a specific datetime slot */
export async function countBookingsForSlot(slotIso: string): Promise<number> {
  const { rows } = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM appointments
      WHERE appointment_date = $1 AND status != 'cancelled'`,
    [slotIso]
  );
  return parseInt(rows[0].count, 10);
}

/**
 * Poll until an appointment reaches the expected status or timeout.
 * Used after webhook events where DB updates are asynchronous.
 */
export async function waitForAppointmentStatus(
  sessionId: string,
  expectedStatus: string,
  expectedPayment: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<AppointmentRow> {
  const { intervalMs = 500, timeoutMs = 15_000 } = opts;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const row = await getAppointmentBySession(sessionId);
    if (
      row &&
      row.status === expectedStatus &&
      row.payment_status === expectedPayment
    ) {
      return row;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  const row = await getAppointmentBySession(sessionId);
  throw new Error(
    `Appointment for session ${sessionId} did not reach ` +
      `status=${expectedStatus}/payment=${expectedPayment} within ${timeoutMs}ms. ` +
      `Last state: status=${row?.status}, payment=${row?.payment_status}`
  );
}
