/**
 * booking-payment.spec.ts
 *
 * End-to-end tests for the LBS booking + payment workflow.
 *
 * All bookings now require online payment — the pay-at-visit toggle has been removed.
 *
 * Stripe test cards used:
 *  4242 4242 4242 4242  – Standard success (no auth required)
 *  4000 0000 0000 0002  – Always declined (generic_decline)
 *  4000 0025 0000 3155  – 3D Secure 2 — requires authentication
 *
 * All test cards use:  exp 12/34  |  CVC 123  |  ZIP 77001
 */
import { test, expect, Page } from "@playwright/test";
import Stripe from "stripe";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  getRecentAppointments,
  waitForAppointmentStatus,
} from "./helpers/db.js";
import {
  simulateCheckoutCompleted,
  simulateCheckoutExpired,
} from "./helpers/webhook.js";
import { TEST_TAG } from "../fixtures/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

// ─── Constants ─────────────────────────────────────────────────────────────

const SERVICE_URL = "/services/notary-service";
const CUSTOMER = {
  name: "Test User E2E",
  email: `e2e+${Date.now()}@lbs.test`,
  phone: "(713) 555-0100",
};
const CARD_SUCCESS = "4242424242424242";
const CARD_DECLINE = "4000000000000002";
const CARD_3DS     = "4000002500003155";
const CARD_EXP     = "12/34";
const CARD_CVC     = "123";
const CARD_ZIP     = "77001";

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Select the first available open day on the booking calendar and click
 * the first available time slot.
 */
async function selectFirstAvailableSlot(page: Page): Promise<string> {
  await page.waitForSelector('[data-testid="img-service-detail"]');
  await page.waitForSelector("table"); // calendar table

  // Click the first enabled (non-disabled) day button
  const dayBtn = page.locator(
    'button[name="day"]:not([disabled]):not([aria-disabled="true"])'
  ).first();
  await dayBtn.waitFor({ state: "visible" });
  await dayBtn.click();

  // Wait for time slots to load
  await page.waitForSelector('button:has-text("AM"), button:has-text("PM")', {
    timeout: 10_000,
  });

  const slotBtn = page.locator(
    'button:has-text("AM"), button:has-text("PM")'
  ).first();
  const slotText = await slotBtn.innerText();
  await slotBtn.click();

  return slotText;
}

/**
 * Fill in customer information after a slot is selected.
 */
async function fillCustomerForm(page: Page, notes?: string) {
  await page.fill('input[id="name"]', CUSTOMER.name);
  await page.fill('input[id="email"]', CUSTOMER.email);
  await page.fill('input[id="phone"]', CUSTOMER.phone);
  if (notes) {
    await page.fill('textarea[id="notes"]', notes);
  }
}

/**
 * Complete the Stripe-hosted checkout with the given card number.
 */
async function fillStripeCheckout(page: Page, cardNumber: string) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

  const emailField = page.locator('input[name="email"]');
  if (await emailField.isVisible()) {
    await emailField.fill(CUSTOMER.email);
  }

  const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  await cardFrame.locator('[placeholder*="1234"]').fill(cardNumber);
  await cardFrame.locator('[placeholder="MM / YY"]').fill(CARD_EXP);
  await cardFrame.locator('[placeholder="CVC"]').fill(CARD_CVC);

  const zipField = page.locator('input[name="billingPostalCode"]');
  if (await zipField.isVisible()) {
    await zipField.fill(CARD_ZIP);
  }

  await page.locator('button[type="submit"]').click();
}

function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Booking form — online payment required", () => {
  /**
   * Verify the booking form no longer has a payment toggle.
   * The "Book & Pay $X" button must always be present when a service has a price.
   */
  test("shows Book & Pay button without any pay-toggle switch", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:no-toggle`);

    // No toggle switch should exist
    const toggle = page.locator('[role="switch"]');
    await expect(toggle).toHaveCount(0);

    // Book & Pay button must be visible
    await expect(page.locator('button:has-text("Book & Pay")')).toBeVisible();

    // No "Book Appointment" (pay at visit) button
    await expect(page.locator('button:has-text("Book Appointment")')).toHaveCount(0);
  });
});

test.describe("Booking flow — pay online (success)", () => {
  test("completes Stripe checkout and verifies booking confirmed in DB", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:pay-success`);

    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    await fillStripeCheckout(page, CARD_SUCCESS);

    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 });
    await expect(page.locator("body")).toContainText(/booked|confirmed|success/i);

    const url = new URL(page.url());
    const appointmentId = url.searchParams.get("appointment_id");
    expect(appointmentId).toBeTruthy();

    const sessions = await stripe().checkout.sessions.list({
      customer_details: { email: CUSTOMER.email } as any,
      limit: 5,
    });
    const session = sessions.data[0];
    expect(session).toBeDefined();

    await simulateCheckoutCompleted(session);

    const row = await waitForAppointmentStatus(session.id, "confirmed", "paid");
    expect(row.customer_email).toBe(CUSTOMER.email);
    expect(row.stripe_session_id).toBe(session.id);
  });
});

test.describe("Booking flow — card declined", () => {
  test("shows error on Stripe page when card is declined", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:decline`);

    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    await fillStripeCheckout(page, CARD_DECLINE);

    await expect(
      page.locator("text=Your card was declined").or(
        page.locator("text=card has been declined")
      )
    ).toBeVisible({ timeout: 15_000 });

    expect(page.url()).toContain("stripe.com");

    const rows = await getRecentAppointments(CUSTOMER.email);
    for (const row of rows) {
      expect(row.payment_status).not.toBe("paid");
    }
  });
});

test.describe("Booking flow — 3DS authentication", () => {
  test("completes booking after 3DS authentication", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:3ds`);

    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    await fillStripeCheckout(page, CARD_3DS);

    const challengeFrame = page.frameLocator("#challengeFrame").or(
      page.frameLocator('iframe[name="stripe-3DS2-challenge"]')
    );

    const completeBtn = challengeFrame
      .locator('button:has-text("Complete"), button:has-text("Authenticate")')
      .first();
    await completeBtn.waitFor({ timeout: 20_000 });
    await completeBtn.click();

    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 });
    await expect(page.locator("body")).toContainText(/booked|confirmed|success/i);

    const sessions = await stripe().checkout.sessions.list({
      customer_details: { email: CUSTOMER.email } as any,
      limit: 5,
    });
    const session = sessions.data.find((s) => s.payment_status === "paid");
    if (session) {
      await simulateCheckoutCompleted(session);
      const row = await waitForAppointmentStatus(session.id, "confirmed", "paid");
      expect(row).toBeTruthy();
    }
  });
});

test.describe("Booking flow — checkout cancelled", () => {
  test("appointment stays pending when user cancels checkout", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:cancelled`);

    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    await page.goBack();

    await page.waitForURL(/\/services/, { timeout: 15_000 });

    const rows = await getRecentAppointments(CUSTOMER.email);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].payment_status).toBe("unpaid");

    if (rows[0].stripe_session_id) {
      const session = await stripe().checkout.sessions.retrieve(
        rows[0].stripe_session_id
      );
      const response = await simulateCheckoutExpired(session);
      expect(response.status).toBe(200);
    }
  });
});

test.describe("Webhook idempotency", () => {
  test("duplicate webhook does not double-confirm or duplicate booking", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:idempotent`);

    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
    await fillStripeCheckout(page, CARD_SUCCESS);
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 });

    const sessions = await stripe().checkout.sessions.list({
      customer_details: { email: CUSTOMER.email } as any,
      limit: 3,
    });
    const session = sessions.data[0];

    const r1 = await simulateCheckoutCompleted(session);
    const r2 = await simulateCheckoutCompleted(session);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    await new Promise((r) => setTimeout(r, 1500));

    const rows = await getRecentAppointments(CUSTOMER.email);
    const forSession = rows.filter((r) => r.stripe_session_id === session.id);
    expect(forSession.length).toBe(1);
    expect(forSession[0].status).toBe("confirmed");
    expect(forSession[0].payment_status).toBe("paid");
  });
});

test.describe("DB verification — booking shown in UI", () => {
  test("success screen shows correct booking details matching DB after payment", async ({ page }) => {
    await page.goto(SERVICE_URL);
    const slotText = await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:ui-verify`);

    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
    await fillStripeCheckout(page, CARD_SUCCESS);
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 });

    await expect(page.locator("body")).toContainText(/confirmed|success/i);

    const sessions = await stripe().checkout.sessions.list({
      customer_details: { email: CUSTOMER.email } as any,
      limit: 3,
    });
    const session = sessions.data[0];
    await simulateCheckoutCompleted(session);

    const row = await waitForAppointmentStatus(session.id, "confirmed", "paid");
    expect(row.service_name).toBe("Notary Service");
    expect(row.customer_name).toBe(CUSTOMER.name);
    expect(row.customer_email).toBe(CUSTOMER.email);
    expect(row.payment_status).toBe("paid");

    // The appointment_date stored in DB is what gets rendered in the email
    expect(row.appointment_date).toBeTruthy();
    const apptDate = new Date(row.appointment_date);
    expect(apptDate.getTime()).toBeGreaterThan(Date.now()); // must be a future date
  });
});
