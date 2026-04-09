import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { insertContactSchema } from "@shared/schema";
import { sendContactNotification, sendAppointmentConfirmation, sendAppointmentCalendarInvite } from "./emailService";
import { sendEmail } from "./smtpClient";
import { z } from "zod";

// Validation schema for appointment booking
const bookAppointmentSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  serviceName: z.string().min(1, "Service name is required"),
  serviceId: z.string().optional(),
  priceId: z.string().optional(),
  priceAmount: z.number().optional(),
  appointmentDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Invalid date format"),
  payNow: z.boolean().default(false),
  notes: z.string().optional(),
});

// Business is in Houston, TX — all hours are Central Time (America/Chicago)
// CST = UTC-6 (Nov–Mar), CDT = UTC-5 (Mar–Nov)
// DST rules: starts 2nd Sunday of March, ends 1st Sunday of November

function isCDT(date: Date): boolean {
  const year = date.getUTCFullYear();
  // 2nd Sunday of March @ 2:00 AM CT = 8:00 AM UTC (CST+6)
  const mar1Dow = new Date(Date.UTC(year, 2, 1)).getUTCDay();
  const dstStartDay = 1 + (7 - mar1Dow) % 7 + 7; // 8–14
  const dstStart = new Date(Date.UTC(year, 2, dstStartDay, 8, 0, 0));
  // 1st Sunday of November @ 2:00 AM CT = 7:00 AM UTC (CDT+5)
  const nov1Dow = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const dstEndDay = 1 + (7 - nov1Dow) % 7;
  const dstEnd = new Date(Date.UTC(year, 10, dstEndDay, 7, 0, 0));
  return date >= dstStart && date < dstEnd;
}

// Returns hours CT is behind UTC (5 for CDT, 6 for CST)
function ctUtcOffset(date: Date): number {
  return isCDT(date) ? 5 : 6;
}

// Convert a UTC Date to its Central Time hour-of-day
function utcToCTHour(date: Date): number {
  return (date.getUTCHours() - ctUtcOffset(date) + 24) % 24;
}

// Business hours validation — all comparisons done in Central Time
function isValidBusinessTime(date: Date): boolean {
  const dow = date.getUTCDay();
  const ctHour = utcToCTHour(date);

  if (dow === 0) return false;                          // Sunday: closed
  if (dow === 4) return false;                          // Thursday: closed
  if (dow === 6) return ctHour >= 8 && ctHour <= 15;   // Saturday: last slot 3pm (closes 4pm)
  return ctHour >= 8 && ctHour <= 16;                  // Mon–Wed, Fri: last slot 4pm (closes 5pm)
}

// Generate available time slots for a given date (all in Central Time)
// Last slot is 1hr before close so appointments end at closing time:
// Mon–Wed, Fri: slots 8am–4pm (business closes 5pm) | Sat: slots 8am–3pm (closes 4pm) | Thu, Sun: closed
function getAvailableTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const dow = date.getUTCDay();

  if (dow === 0 || dow === 4) return slots; // Sunday, Thursday — closed

  let startHour: number;
  let endHour: number;

  if (dow === 6) { startHour = 8; endHour = 15; } // Saturday: last slot 3pm (closes 4pm)
  else           { startHour = 8; endHour = 16; } // Mon–Wed, Fri: last slot 4pm (closes 5pm)

  const offset = ctUtcOffset(date); // hours CT is behind UTC
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  for (let ctHour = startHour; ctHour <= endHour; ctHour++) {
    // Convert CT hour to UTC — may roll into next UTC day (rare at end of DST range)
    const utcHour = ctHour + offset;
    const dayOffset = utcHour >= 24 ? 1 : 0;
    const slot = new Date(Date.UTC(y, m, d + dayOffset, utcHour % 24, 0, 0, 0));
    slots.push(slot.toISOString());
  }

  return slots;
}

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
      // Verify captcha if secret key is configured
      const captchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
      const { captchaToken, ...formData } = req.body;

      if (captchaSecretKey) {
        if (!captchaToken) {
          return res.status(400).json({ error: 'Captcha verification required' });
        }

        // Verify with Google reCAPTCHA
        const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${captchaSecretKey}&response=${captchaToken}`,
        });

        const verifyResult = await verifyResponse.json() as { success: boolean };
        if (!verifyResult.success) {
          return res.status(400).json({ error: 'Captcha verification failed' });
        }
      }

      const parsed = insertContactSchema.safeParse(formData);
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

  // Get available time slots for a specific date
  app.get('/api/appointments/available-slots', async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      const requestedDate = new Date(date);
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      // Get all possible slots for the day
      const allSlots = getAvailableTimeSlots(requestedDate);

      // Get existing appointments for that day
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointments = await storage.getAppointmentsByDateRange(startOfDay, endOfDay);

      // Filter out already booked slots
      const bookedTimes = new Set(
        existingAppointments
          .filter(apt => apt.status !== 'cancelled')
          .map(apt => new Date(apt.appointmentDate).toISOString())
      );

      const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot));

      res.json({
        date: requestedDate.toISOString().split('T')[0],
        slots: availableSlots,
        businessHours: {
          monWedFri: { open: '08:00', close: '17:00', lastSlot: '16:00' },
          sat: { open: '08:00', close: '16:00', lastSlot: '15:00' },
        },
        daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
      });
    } catch (error: any) {
      console.error('Error fetching available slots:', error.message);
      res.status(500).json({ error: 'Failed to fetch available time slots' });
    }
  });

  // Book an appointment
  app.post('/api/appointments', async (req, res) => {
    try {
      const parsed = bookAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid form data', details: parsed.error.flatten() });
      }

      const data = parsed.data;
      const appointmentDate = new Date(data.appointmentDate);

      // Validate business hours
      if (!isValidBusinessTime(appointmentDate)) {
        return res.status(400).json({
          error: 'Invalid appointment time. Mon–Wed & Fri: last slot 4pm, Sat: last slot 3pm CT. Closed Thursday & Sunday.',
        });
      }

      // Check if the slot is already booked
      const startOfHour = new Date(appointmentDate);
      startOfHour.setMinutes(0, 0, 0);
      const endOfHour = new Date(appointmentDate);
      endOfHour.setMinutes(59, 59, 999);

      const existingAppointments = await storage.getAppointmentsByDateRange(startOfHour, endOfHour);
      const conflictingAppointment = existingAppointments.find(apt => apt.status !== 'cancelled');

      if (conflictingAppointment) {
        return res.status(409).json({
          error: 'This time slot is no longer available. Please select a different time.',
        });
      }

      // Create the appointment
      const appointmentData = {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        serviceName: data.serviceName,
        serviceId: data.serviceId || null,
        priceId: data.priceId || null,
        priceAmount: data.priceAmount || null,
        appointmentDate: appointmentDate,
        status: 'pending',
        paymentStatus: 'unpaid',
        notes: data.notes || null,
      };

      const appointment = await storage.createAppointment(appointmentData);
      console.log('Appointment created:', appointment.id);

      // If paying now, create Stripe checkout session
      if (data.payNow && data.priceId) {
        try {
          const stripe = await getUncachableStripeClient();
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: data.priceId, quantity: 1 }],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/checkout/success?appointment_id=${appointment.id}`,
            cancel_url: `${req.protocol}://${req.get('host')}/services?appointment_id=${appointment.id}&payment_cancelled=true`,
            metadata: {
              appointment_id: appointment.id,
            },
            customer_email: data.customerEmail,
          });

          // Update appointment with Stripe session ID
          await storage.updateAppointmentPayment(appointment.id, 'pending', session.id || undefined);

          // Send emails (without waiting for completion)
          sendAppointmentConfirmation({
            appointmentId: appointment.id,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            serviceName: data.serviceName,
            appointmentDate: appointmentDate,
            priceAmount: data.priceAmount,
            paymentStatus: 'pending',
          });

          sendAppointmentCalendarInvite({
            appointmentId: appointment.id,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            serviceName: data.serviceName,
            appointmentDate: appointmentDate,
            priceAmount: data.priceAmount,
            paymentStatus: 'pending',
            notes: data.notes,
          });

          return res.json({
            success: true,
            appointment: appointment,
            checkoutUrl: session.url,
          });
        } catch (stripeError: any) {
          console.error('Stripe checkout error:', stripeError.message);
          // Continue without payment if Stripe fails
        }
      }

      // Send confirmation emails
      sendAppointmentConfirmation({
        appointmentId: appointment.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        serviceName: data.serviceName,
        appointmentDate: appointmentDate,
        priceAmount: data.priceAmount,
        paymentStatus: 'unpaid',
      });

      sendAppointmentCalendarInvite({
        appointmentId: appointment.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        serviceName: data.serviceName,
        appointmentDate: appointmentDate,
        priceAmount: data.priceAmount,
        paymentStatus: 'unpaid',
        notes: data.notes,
      });

      res.json({
        success: true,
        appointment: appointment,
        message: 'Appointment booked successfully. A confirmation email has been sent.',
      });
    } catch (error: any) {
      console.error('Appointment booking error:', error.message);
      res.status(500).json({ error: 'Failed to book appointment' });
    }
  });

  // Update appointment payment status (called after successful payment)
  app.post('/api/appointments/:id/payment-complete', async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointment(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const updatedAppointment = await storage.updateAppointmentPayment(id, 'paid');

      res.json({
        success: true,
        appointment: updatedAppointment,
      });
    } catch (error: any) {
      console.error('Payment update error:', error.message);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  });

  // Get appointment details
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointment(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json({ appointment });
    } catch (error: any) {
      console.error('Error fetching appointment:', error.message);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  });

  // Test email endpoint — remove after confirming email works
  app.get('/api/test-email', async (req, res) => {
    const to = (req.query.to as string) || process.env.NOTIFICATION_EMAIL || 'info@lbsconnect.net';

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({
        success: false,
        error: 'SMTP_USER or SMTP_PASSWORD not set in environment variables',
      });
    }

    try {
      const result = await sendEmail({
        to,
        subject: 'LBS Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1e3a6e;">LBS Email Test</h2>
            <p>This is a test email from LBS Test & Exam Center.</p>
            <p>If you received this, email notifications are working correctly.</p>
            <p style="color: #6b7280; font-size: 12px;">Sent via Microsoft 365 SMTP from ${smtpUser}</p>
          </div>
        `,
      });

      if (result) {
        res.json({ success: true, message: `Test email sent to ${to}` });
      } else {
        res.status(500).json({ success: false, error: 'Email sending failed — check server logs for details' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return httpServer;
}
