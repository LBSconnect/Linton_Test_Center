/**
 * webhook.ts  —  Stripe webhook simulation helpers
 *
 * Constructs and sends signed webhook payloads directly to the app's
 * /api/stripe/webhook endpoint so tests can verify webhook handling
 * without needing the live Stripe CLI or ngrok tunnel.
 *
 * Requires:
 *   STRIPE_WEBHOOK_SECRET  – from `stripe listen --print-secret`
 *   BASE_URL               – app base URL (default: http://localhost:5000)
 */
import Stripe from "stripe";
import crypto from "crypto";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

/**
 * Build a Stripe-signed webhook payload and POST it to the local endpoint.
 * Returns the fetch Response so callers can assert on status codes.
 */
export async function sendWebhookEvent(
  eventType: string,
  data: object
): Promise<Response> {
  const payload = JSON.stringify({
    id: `evt_test_${crypto.randomBytes(8).toString("hex")}`,
    object: "event",
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data: { object: data },
  });

  // Build Stripe-v1 signature header
  const timestamp = Math.floor(Date.now() / 1000);
  const signingPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signingPayload)
    .digest("hex");
  const stripeSignature = `t=${timestamp},v1=${signature}`;

  return fetch(`${BASE_URL}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": stripeSignature,
    },
    body: payload,
  });
}

/**
 * Simulate checkout.session.completed for a given Stripe session object.
 * Pass the real session object from your Stripe test-mode checkout.
 */
export async function simulateCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<Response> {
  return sendWebhookEvent("checkout.session.completed", session);
}

/**
 * Simulate checkout.session.expired (user abandoned checkout).
 */
export async function simulateCheckoutExpired(
  session: Stripe.Checkout.Session
): Promise<Response> {
  return sendWebhookEvent("checkout.session.expired", session);
}

/**
 * Simulate payment_intent.payment_failed (card declined at Stripe).
 */
export async function simulatePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<Response> {
  return sendWebhookEvent("payment_intent.payment_failed", paymentIntent);
}

/**
 * Poll the app's webhook endpoint by sending events until the DB row
 * reaches the expected state. Useful when the app processes webhooks
 * asynchronously.
 *
 * Most of the time a single send is sufficient; this is a safety net.
 */
export async function sendWebhookAndPoll(
  eventType: string,
  data: object,
  pollFn: () => Promise<boolean>,
  opts: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<void> {
  const { maxAttempts = 6, intervalMs = 1000 } = opts;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sendWebhookEvent(eventType, data);
    await new Promise((r) => setTimeout(r, intervalMs));
    if (await pollFn()) return;
  }

  throw new Error(
    `Webhook event '${eventType}' was sent ${maxAttempts} times but ` +
      "the expected DB state was never reached."
  );
}
