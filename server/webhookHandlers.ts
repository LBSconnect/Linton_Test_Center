import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { sendAppointmentConfirmation, sendAppointmentCalendarInvite, sendClassRegistrationNotification, sendClassRegistrationConfirmation } from './emailService';
import { CLASS_DEFINITIONS } from '@shared/classes';
import type Stripe from 'stripe';

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

    let event: Stripe.Event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Verify signature when secret is configured
      const stripe = await getUncachableStripeClient();
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      console.log(`Webhook verified: ${event.type} - ${event.id}`);
    } else {
      // Process without verification (not recommended for production)
      console.warn('STRIPE_WEBHOOK_SECRET not set — processing without signature verification');
      event = JSON.parse(payload.toString()) as Stripe.Event;
      console.log(`Webhook received (unverified): ${event.type} - ${event.id}`);
    }

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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

  /**
   * Handle checkout.session.completed — update appointment and send paid confirmation
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Processing checkout.session.completed for session:', session.id);

    // Handle class registration payment
    const registrationId = session.metadata?.registration_id;
    if (registrationId && session.metadata?.type === 'class_registration') {
      try {
        const reg = await storage.updateClassRegistrationPayment(registrationId, 'paid', session.id);
        if (reg) {
          const classDef = CLASS_DEFINITIONS[reg.classType as keyof typeof CLASS_DEFINITIONS];
          if (classDef) {
            sendClassRegistrationNotification({
              registrationId: reg.id,
              classTitle: classDef.title,
              classDate: reg.classDate,
              classTime: reg.classTime,
              customerName: reg.customerName,
              customerEmail: reg.customerEmail,
              customerPhone: reg.customerPhone ?? undefined,
              priceAmount: classDef.priceAmount,
            });
            sendClassRegistrationConfirmation({
              registrationId: reg.id,
              classTitle: classDef.title,
              classDate: reg.classDate,
              classTime: reg.classTime,
              endTime: classDef.endTime,
              customerName: reg.customerName,
              customerEmail: reg.customerEmail,
              priceAmount: classDef.priceAmount,
            });
          }
          console.log(`Class registration ${registrationId} marked as paid`);
        }
      } catch (error: any) {
        console.error('Error processing class registration payment:', error.message);
      }
      return;
    }

    // Get appointment_id from session metadata (set during checkout creation)
    const appointmentId = session.metadata?.appointment_id;

    if (!appointmentId) {
      console.log('No appointment_id in session metadata, skipping appointment update');
      return;
    }

    try {
      // Update appointment payment status
      const appointment = await storage.updateAppointmentPayment(appointmentId, 'paid', session.id);

      if (!appointment) {
        console.error('Appointment not found for ID:', appointmentId);
        return;
      }

      console.log(`Appointment ${appointmentId} marked as paid`);

      // Send paid confirmation email to customer
      sendAppointmentConfirmation({
        appointmentId: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceName: appointment.serviceName,
        appointmentDate: appointment.appointmentDate,
        priceAmount: appointment.priceAmount ?? undefined,
        paymentStatus: 'paid',
      });

      // Send full appointment notification with calendar invite to company
      sendAppointmentCalendarInvite({
        appointmentId: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone ?? undefined,
        serviceName: appointment.serviceName,
        appointmentDate: appointment.appointmentDate,
        priceAmount: appointment.priceAmount ?? undefined,
        paymentStatus: 'paid',
        notes: appointment.notes ?? undefined,
      });

      console.log('Payment confirmation emails queued for customer:', appointment.customerEmail, 'and company');
    } catch (error: any) {
      console.error('Error processing checkout.session.completed:', error.message);
    }
  }
}
