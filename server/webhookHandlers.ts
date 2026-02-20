import { getUncachableStripeClient } from './stripeClient';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not set, skipping signature verification');
      // Still parse and log the event for debugging
      const event = JSON.parse(payload.toString());
      console.log(`Webhook received (unverified): ${event.type}`);
      return;
    }

    const stripe = await getUncachableStripeClient();

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    console.log(`Webhook verified: ${event.type} - ${event.id}`);

    // Handle specific event types as needed
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Checkout session completed:', event.data.object);
        break;
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
}
