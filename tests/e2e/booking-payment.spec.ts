/**
 * booking-payment.spec.ts
 *
 * End-to-end tests for the LBS booking + payment workflow.
 *
 * Stripe test cards used:
 *  4242 4242 4242 4242  – Standard success (no auth required)
 *  4000 0000 0000 0002  – Always declined (generic_decline)
 *  4000 0025 0000 3155  – 3D Secure 2 — requires authentication
 *  4000 0000 0000 9995  – Insufficient funds decline
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
  countBookingsForSlot,
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
const CARD_SUCCESS   = "4242424242424242";  // Standard success
const CARD_DECLINE   = "4000000000000002";  // Always declined
const CARD_3DS       = "4000002500003155";  // 3DS 2 required
const CARD_EXP       = "12/34";
const CARD_CVC       = "123";
const CARD_ZIP       = "77001";

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Select the next available weekday on the booking calendar and click
 * the first available time slot. Returns the ISO string of the chosen slot.
 */
async function selectFirstAvailableSlot(page: Page): Promise<string> {
  // Wait for calendar to be visible
  await page.waitForSelector('[data-testid="img-service-detail"]');
  await page.waitForSelector("table"); // calendar table

  // Click the first enabled (non-disabled) day button
  const dayBtn = page.locator(
    'button[name="day"]:not([disabled]):not([aria-disabled="true"])'
  ).first();
  await dayBtn.waitFor({ state: "visible" });
  await dayBtn.click();

  // Wait for time slots to load (skeleton disappears)
  await page.waitForSelector('button:has-text("AM"), button:has-text("PM")', {
    timeout: 10_000,
  });

  // Pick the first slot button
  const slotBtn = page.locator(
    'button:has-text("AM"), button:has-text("PM")'
  ).first();
  const slotText = await slotBtn.innerText();
  await slotBtn.click();

  return slotText; // e.g. "8:00 AM"
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
 * Handles both standard and 3DS flows.
 */
async function fillStripeCheckout(page: Page, cardNumber: string) {
  // Stripe checkout is on a different origin — wait for it to load
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

  // Enter email (pre-filled from session but ensure it's there)
  const emailField = page.locator('input[name="email"]');
  if (await emailField.isVisible()) {
    await emailField.fill(CUSTOMER.email);
  }

  // Card number — Stripe checkout renders an iframe
  const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  await cardFrame.locator('[placeholder*="1234"]').fill(cardNumber);
  await cardFrame.locator('[placeholder="MM / YY"]').fill(CARD_EXP);
  await cardFrame.locator('[placeholder="CVC"]').fill(CARD_CVC);

  // Billing ZIP
  const zipField = page.locator('input[name="billingPostalCode"]');
  if (await zipField.isVisible()) {
    await zipField.fill(CARD_ZIP);
  }

  // Submit
  await page.locator('button[type="submit"]').click();
}

/**
 * Get a Stripe client for API calls (webhook simulation, session lookup).
 */
function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Booking flow — pay at visit", () => {
  test("books appointment without payment and shows success screen", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:pay-at-visit`);

    // "Pay online now" toggle should default to OFF
    const toggle = page.locator('[role="switch"]');
    await expect(toggle).toHaveAttribute("aria-checked", "false");

    await page.locator('button:has-text("Book Appointment")').click();

    // Success screen
    await expect(page.locator("text=Appointment Booked!")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(`text=${CUSTOMER.email}`)).toBeVisible();

    // DB: appointment should exist
    const rows = await getRecentAppointments(CUSTOMER.email);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].status).toBe("pending");
    expect(rows[0].payment_status).toBe("unpaid");
  });
});

test.describe("Booking flow — pay online (success)", () => {
  test("completes Stripe checkout and verifies booking confirmed in DB", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:pay-success`);

    // Enable "Pay online now"
    await page.locator('[role="switch"]').click();
    await expect(page.locator('[role="switch"]')).toHaveAttribute("aria-checked", "true");

    // Submit → redirected to Stripe
    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    // Complete checkout with success card
    // Card: 4242 4242 4242 4242 — Standard Visa, always succeeds, no 3DS
    await fillStripeCheckout(page, CARD_SUCCESS);

    // App redirects back to /checkout/success
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 });
    await expect(page.locator("body")).toContainText(/booked|confirmed|success/i);

    // Extract session ID from URL for DB lookup
    const url = new URL(page.url());
    const appointmentId = url.searchParams.get("appointment_id");
    expect(appointmentId).toBeTruthy();

    // Simulate webhook — checkout.session.completed
    // (In real Stripe test mode the webhook fires automatically if
    //  stripe CLI is running; here we simulate it directly.)
    const sessions = await stripe().checkout.sessions.list({
      customer_details: { email: CUSTOMER.email } as any,
      limit: 5,
    });
    const session = sessions.data[0];
    expect(session).toBeDefined();

    await simulateCheckoutCompleted(session);

    // Poll DB until payment_status = "paid" and status = "confirmed"
    const row = await waitForAppointmentStatus(session.id, "confirmed", "paid");
    expect(row.customer_email).toBe(CUSTOMER.email);
    expect(row.stripe_session_id).toBe(session.id);
  });
});

test.describe("Booking flow — card declined", () => {
  /**
   * Card: 4000 0000 0000 0002
   * Stripe declines this card immediately with code: generic_decline.
   * Checkout stays on the Stripe page and shows an error — no redirect.
   */
  test("shows error on Stripe page when card is declined", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:decline`);

    await page.locator('[role="switch"]').click();
    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    // Card: 4000 0000 0000 0002 — declined by issuer
    await fillStripeCheckout(page, CARD_DECLINE);

    // Stripe shows an inline error — stays on checkout page
    await expect(
      page.locator("text=Your card was declined").or(
        page.locator("text=card has been declined")
      )
    ).toBeVisible({ timeout: 15_000 });

    // Should NOT have been redirected to app
    expect(page.url()).toContain("stripe.com");

    // DB: appointment should still be in "pending / unpaid" state
    const rows = await getRecentAppointments(CUSTOMER.email);
    for (const row of rows) {
      expect(row.payment_status).not.toBe("paid");
    }
  });
});

test.describe("Booking flow — 3DS authentication", () => {
  /**
   * Card: 4000 0025 0000 3155
   * Requires 3DS 2 challenge. Stripe shows an authentication modal.
   * User must click "Complete authentication" / "Authenticate" in the
   * Stripe 3DS frame to proceed.
   */
  test("completes booking after 3DS authentication", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:3ds`);

    await page.locator('[role="switch"]').click();
    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    // Card: 4000 0025 0000 3155 — 3DS 2 required
    await fillStripeCheckout(page, CARD_3DS);

    // Stripe renders a 3DS challenge iframe — "Complete authentication"
    // The test mode 3DS page has a button to simulate success or failure.
    const challengeFrame = page.frameLocator("#challengeFrame").or(
      page.frameLocator('iframe[name="stripe-3DS2-challenge"]')
    );

    // Click "Complete" / "Authenticate" in the 3DS challenge
    const completeBtn = challengeFrame
      .locator('button:has-text("Complete"), button:has-text("Authenticate")')
      .first();
    await completeBtn.waitFor({ timeout: 20_000 });
    await completeBtn.click();

    // Should redirect back to app success URL
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 });
    await expect(page.locator("body")).toContainText(/booked|confirmed|success/i);

    // Simulate webhook and verify DB
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
  /**
   * User clicks "Back" / navigates away from Stripe checkout.
   * Stripe redirects to the cancel_url with appointment_id.
   * The appointment should remain pending/unpaid (not deleted).
   */
  test("appointment stays pending when user cancels checkout", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:cancelled`);

    await page.locator('[role="switch"]').click();
    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });

    // Simulate cancellation — navigate directly to the cancel_url
    // (same as user clicking "← Back" on Stripe checkout)
    await page.goBack();

    // Should return to /services page with cancellation param
    await page.waitForURL(/\/services/, { timeout: 15_000 });

    // DB: appointment should still exist as pending/unpaid (not deleted)
    const rows = await getRecentAppointments(CUSTOMER.email);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].payment_status).toBe("unpaid");

    // Simulate checkout.session.expired webhook
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
  /**
   * Sending the same checkout.session.completed event twice must NOT
   * create a duplicate confirmed appointment or alter existing state.
   * Stripe may replay webhooks — the handler must be idempotent.
   */
  test("duplicate webhook does not double-confirm or duplicate booking", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:idempotent`);

    await page.locator('[role="switch"]').click();
    await page.locator('button:has-text("Book & Pay")').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
    await fillStripeCheckout(page, CARD_SUCCESS);
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 });

    const sessions = await stripe().checkout.sessions.list({
      customer_details: { email: CUSTOMER.email } as any,
      limit: 3,
    });
    const session = sessions.data[0];

    // Send webhook event TWICE
    const r1 = await simulateCheckoutCompleted(session);
    const r2 = await simulateCheckoutCompleted(session);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    await new Promise((r) => setTimeout(r, 1500));

    // Only ONE appointment should exist for this session
    const rows = await getRecentAppointments(CUSTOMER.email);
    const forSession = rows.filter((r) => r.stripe_session_id === session.id);
    expect(forSession.length).toBe(1);
    expect(forSession[0].status).toBe("confirmed");
    expect(forSession[0].payment_status).toBe("paid");
  });
});

test.describe("DB verification — booking shown in UI", () => {
  /**
   * After a pay-at-visit booking, the success screen must display the
   * correct service name, date, and time that are stored in the DB.
   */
  test("success screen shows correct booking details matching DB", async ({ page }) => {
    await page.goto(SERVICE_URL);
    await selectFirstAvailableSlot(page);
    await fillCustomerForm(page, `${TEST_TAG}:ui-verify`);

    await page.locator('button:has-text("Book Appointment")').click();

    await expect(page.locator("text=Appointment Booked!")).toBeVisible({ timeout: 15_000 });

    // UI should show service name
    await expect(page.locator("body")).toContainText("Notary Service");

    // DB should have a matching row
    const rows = await getRecentAppointments(CUSTOMER.email);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const row = rows[0];
    expect(row.service_name).toBe("Notary Service");
    expect(row.customer_name).toBe(CUSTOMER.name);

    // UI date should match DB date (displayed in CT)
    const uiDate = await page.locator(".bg-muted\\/50 p:first-child").innerText();
    const dbDate = new Date(row.appointment_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Chicago",
    });
    expect(uiDate).toContain(dbDate);
  });
});
