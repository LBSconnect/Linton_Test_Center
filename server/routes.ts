import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { insertContactSchema } from "@shared/schema";
import { sendContactNotification } from "./emailService";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get('/api/products', async (_req, res) => {
    try {
      const products = await storage.listProducts();
      res.json({ data: products });
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products-with-prices', async (_req, res) => {
    try {
      const rows = await storage.listProductsWithPrices();

      const productsMap = new Map();
      for (const row of rows) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: [],
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error: any) {
      console.error('Error fetching products with prices:', error.message);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/:productId/prices', async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const prices = await storage.getPricesForProduct(productId);
      res.json({ data: prices });
    } catch (error: any) {
      console.error('Error fetching prices:', error.message);
      res.status(500).json({ error: 'Failed to fetch prices' });
    }
  });

  app.get('/api/stripe/publishable-key', async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      console.error('Error fetching publishable key:', error.message);
      res.status(500).json({ error: 'Failed to fetch Stripe key' });
    }
  });

  app.post('/api/checkout', async (req, res) => {
    try {
      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: 'priceId is required' });
      }

      const stripe = await getUncachableStripeClient();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout error:', error.message);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const parsed = insertContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid form data', details: parsed.error.flatten() });
      }
      const submission = await storage.createContactSubmission(parsed.data);
      console.log('Contact form submission saved:', submission.id);
      sendContactNotification(parsed.data);
      res.json({ success: true, message: 'Message received' });
    } catch (error: any) {
      console.error('Contact form error:', error.message);
      res.status(500).json({ error: 'Failed to process contact form' });
    }
  });

  return httpServer;
}
