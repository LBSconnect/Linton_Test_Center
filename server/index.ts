import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { getUncachableStripeClient } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { sendPaymentNotification } from './emailService';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function initStripe() {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not set, Stripe features will be disabled');
    return;
  }

  try {
    console.log('Initializing Stripe...');
    const stripe = await getUncachableStripeClient();

    // Verify Stripe connection
    await stripe.products.list({ limit: 1 });
    console.log('Stripe connection verified');
  } catch (error: any) {
    console.error('Failed to initialize Stripe:', error.message);
    // Don't throw - allow server to start without Stripe
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer.');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const rawBody = req.body as Buffer;

      await WebhookHandlers.processWebhook(rawBody, sig);

      try {
        const event = JSON.parse(rawBody.toString());
        console.log(`Received webhook ${event.id}: ${event.type} for ${event.data?.object?.id}`);

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const stripe = await getUncachableStripeClient();
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const productName = lineItems.data[0]?.description || undefined;
          sendPaymentNotification({
            customerEmail: session.customer_details?.email || undefined,
            customerName: session.customer_details?.name || undefined,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            productName,
            sessionId: session.id,
          });
        }
      } catch (emailErr: any) {
        console.error('Error processing webhook notification:', emailErr.message);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Health check endpoint for Render
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await initStripe();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
