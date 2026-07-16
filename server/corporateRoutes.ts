import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  createCorporateAccount,
  listCorporateAccounts,
  getCorporateAccount,
  approveCorporateAccount,
  rejectCorporateAccount,
  getCorporateDashboardStats,
  listCorporatePlans,
  runCorporateMigrations,
  logAudit,
} from "./corporateStorage";
import {
  sendEnrollmentConfirmation,
  sendEnrollmentNotificationToAdmin,
  sendApprovalEmail,
  sendRejectionEmail,
} from "./corporateEmailService";
import { insertCorporateAccountSchema } from "@shared/schema";
import { getUncachableStripeClient } from "./stripeClient";
import { z } from "zod";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "changeme-dev-only";
const JWT_SECRET = process.env.JWT_SECRET || ADMIN_SECRET;

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });

  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  // Accept raw secret directly (for admin dashboard bootstrap)
  if (token === ADMIN_SECRET) return next();

  // Or accept a signed JWT
  try {
    jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── Route Registration ───────────────────────────────────────────────────────

export async function registerCorporateRoutes(app: Express): Promise<void> {
  // Run migrations on startup
  try {
    await runCorporateMigrations();
  } catch (err) {
    console.error("Corporate migrations failed:", err);
  }

  // ── Admin Auth ──────────────────────────────────────────────────────────────

  app.post("/api/admin/corporate/login", (req: Request, res: Response) => {
    const { secret } = req.body as { secret?: string };
    if (!secret || secret !== ADMIN_SECRET) {
      return res.status(401).json({ error: "Invalid admin secret" });
    }
    const token = jwt.sign({ role: "corporate-admin" }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({ token });
  });

  // ── Enrollment (Public) ─────────────────────────────────────────────────────

  app.post("/api/corporate/enroll", async (req: Request, res: Response) => {
    try {
      const data = insertCorporateAccountSchema.parse(req.body);
      const account = await createCorporateAccount(data);

      // Fire-and-forget emails; don't block on failures
      Promise.all([
        sendEnrollmentConfirmation(account).catch(console.error),
        sendEnrollmentNotificationToAdmin(account).catch(console.error),
      ]);

      return res.status(201).json({
        accountCode: account.accountCode,
        status: account.status,
        message: "Enrollment received. You will be contacted within 1–2 business days.",
      });
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", issues: err.issues });
      }
      console.error("Corporate enroll error:", err);
      return res.status(500).json({ error: "Enrollment submission failed. Please try again." });
    }
  });

  // ── Public Plan List ────────────────────────────────────────────────────────

  app.get("/api/corporate/plans", async (_req: Request, res: Response) => {
    try {
      const plans = await listCorporatePlans();
      return res.json(plans);
    } catch (err) {
      console.error("List plans error:", err);
      return res.status(500).json({ error: "Failed to load plans" });
    }
  });

  // ── Admin: Dashboard Stats ──────────────────────────────────────────────────

  app.get("/api/admin/corporate/stats", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const stats = await getCorporateDashboardStats();
      return res.json(stats);
    } catch (err) {
      console.error("Stats error:", err);
      return res.status(500).json({ error: "Failed to load stats" });
    }
  });

  // ── Admin: List Accounts ────────────────────────────────────────────────────

  app.get("/api/admin/corporate/accounts", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const accounts = await listCorporateAccounts(status);
      return res.json(accounts);
    } catch (err) {
      console.error("List accounts error:", err);
      return res.status(500).json({ error: "Failed to load accounts" });
    }
  });

  // ── Admin: Get Single Account ───────────────────────────────────────────────

  app.get("/api/admin/corporate/accounts/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid account ID" });
      const account = await getCorporateAccount(id);
      if (!account) return res.status(404).json({ error: "Account not found" });
      return res.json(account);
    } catch (err) {
      console.error("Get account error:", err);
      return res.status(500).json({ error: "Failed to load account" });
    }
  });

  // ── Admin: Approve Account ──────────────────────────────────────────────────

  app.put("/api/admin/corporate/accounts/:id/approve", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid account ID" });

      const { adminNotes } = req.body as { adminNotes?: string };

      const accountBefore = await getCorporateAccount(id);
      if (!accountBefore) return res.status(404).json({ error: "Account not found" });

      // Auto-generate Stripe checkout link
      let stripeCheckoutUrl: string | undefined;
      try {
        const stripe = await getUncachableStripeClient().catch(() => null);
        if (stripe) {
          const priceIds: Record<string, string> = {
            bronze: process.env.STRIPE_CORPORATE_BRONZE_PRICE_ID || "",
            silver: process.env.STRIPE_CORPORATE_SILVER_PRICE_ID || "",
            gold:   process.env.STRIPE_CORPORATE_GOLD_PRICE_ID   || "",
          };
          const priceId = priceIds[accountBefore.planTier || ""];
          if (priceId) {
            const baseUrl = process.env.BASE_URL || "https://www.lbs4.com";
            const session = await stripe.checkout.sessions.create({
              mode: "subscription",
              customer_email: accountBefore.primaryContactEmail,
              client_reference_id: String(accountBefore.id),
              line_items: [{ price: priceId, quantity: 1 }],
              metadata: { corporateAccountId: String(accountBefore.id), accountCode: accountBefore.accountCode },
              success_url: `${baseUrl}/corporate/activated?account=${accountBefore.accountCode}`,
              cancel_url: `${baseUrl}/corporate/enroll`,
            });
            stripeCheckoutUrl = session.url ?? undefined;
            await logAudit("account", String(id), "stripe_checkout_created", "admin", { sessionId: session.id });
          }
        }
      } catch (stripeErr) {
        console.error("Stripe checkout auto-generate failed:", stripeErr);
        // Non-fatal — approve without Stripe link if Stripe isn't configured
      }

      const account = await approveCorporateAccount(id, adminNotes, stripeCheckoutUrl);
      if (!account) return res.status(404).json({ error: "Account not found" });

      await sendApprovalEmail(account, stripeCheckoutUrl || "").catch(console.error);

      return res.json({ success: true, account, stripeCheckoutUrl });
    } catch (err) {
      console.error("Approve error:", err);
      return res.status(500).json({ error: "Failed to approve account" });
    }
  });

  // ── Admin: Reject Account ───────────────────────────────────────────────────

  app.put("/api/admin/corporate/accounts/:id/reject", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid account ID" });

      const schema = z.object({ rejectionReason: z.string().min(1) });
      const { rejectionReason } = schema.parse(req.body);

      const account = await rejectCorporateAccount(id, rejectionReason);
      if (!account) return res.status(404).json({ error: "Account not found" });

      await sendRejectionEmail(account).catch(console.error);

      return res.json({ success: true, account });
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ error: "rejectionReason is required" });
      }
      console.error("Reject error:", err);
      return res.status(500).json({ error: "Failed to reject account" });
    }
  });

  // ── Admin: Create Stripe Checkout Link ─────────────────────────────────────

  app.post("/api/admin/corporate/accounts/:id/stripe-checkout", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid account ID" });

      const account = await getCorporateAccount(id);
      if (!account) return res.status(404).json({ error: "Account not found" });

      const stripe = await getUncachableStripeClient().catch(() => null);
      if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

      // Price IDs map from plan tier — must be set in env or Stripe product lookup
      const priceIds: Record<string, string> = {
        bronze: process.env.STRIPE_CORPORATE_BRONZE_PRICE_ID || "",
        silver: process.env.STRIPE_CORPORATE_SILVER_PRICE_ID || "",
        gold: process.env.STRIPE_CORPORATE_GOLD_PRICE_ID || "",
      };

      const priceId = priceIds[account.planTier || ""];
      if (!priceId) {
        return res.status(400).json({ error: `Stripe price ID not configured for tier: ${account.planTier}` });
      }

      const baseUrl = process.env.BASE_URL || "https://www.lbs4.com";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: account.primaryContactEmail,
        client_reference_id: String(account.id),
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { corporateAccountId: String(account.id), accountCode: account.accountCode },
        success_url: `${baseUrl}/corporate/activated?account=${account.accountCode}`,
        cancel_url: `${baseUrl}/corporate/enroll`,
      });

      await logAudit("account", String(id), "stripe_checkout_created", "admin", {
        sessionId: session.id,
        url: session.url,
      });

      return res.json({ checkoutUrl: session.url, sessionId: session.id });
    } catch (err) {
      console.error("Stripe checkout error:", err);
      return res.status(500).json({ error: "Failed to create Stripe checkout session" });
    }
  });

  // ── Stripe Webhook: Activate on Payment ────────────────────────────────────

  app.post("/api/webhooks/stripe/corporate", async (req: Request, res: Response) => {
    try {
      const stripe = await getUncachableStripeClient().catch(() => null);
      if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_CORPORATE_WEBHOOK_SECRET;

      let event: any;
      if (webhookSecret && sig) {
        try {
          event = stripe.webhooks.constructEvent(
            (req as any).rawBody || JSON.stringify(req.body),
            sig,
            webhookSecret
          );
        } catch {
          return res.status(400).json({ error: "Invalid webhook signature" });
        }
      } else {
        event = req.body;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const accountId = parseInt(session.client_reference_id || session.metadata?.corporateAccountId, 10);
        if (!isNaN(accountId)) {
          const { updateCorporateAccountStripe } = await import("./corporateStorage");
          await updateCorporateAccountStripe(
            accountId,
            session.customer as string,
            session.subscription as string
          );
          await logAudit("account", String(accountId), "subscription_activated", "stripe", {
            stripeCustomer: session.customer,
            stripeSubscription: session.subscription,
          });
        }
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Stripe webhook error:", err);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
