import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { insertContactSchema } from "@shared/schema";
import { sendContactNotification, sendAppointmentConfirmation, sendAppointmentCalendarInvite } from "./emailService";
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

// Business hours validation
// Mon-Thu: 8am-4pm, Fri: 8am-5pm, Sat: 9am-5pm, Sun: closed
function isValidBusinessTime(date: Date): boolean {
  const dayOfWeek = date.getDay();
  const hours = date.getHours();

  // Sunday (0) - closed
  if (dayOfWeek === 0) {
    return false;
  }

  // Saturday (6): 9am-5pm
  if (dayOfWeek === 6) {
    return hours >= 9 && hours <= 17;
  }

  // Friday (5): 8am-5pm
  if (dayOfWeek === 5) {
    return hours >= 8 && hours <= 17;
  }

  // Monday-Thursday (1-4): 8am-4pm
  return hours >= 8 && hours <= 16;
}

// Generate available time slots for a given date
// Mon-Thu: 8am-4pm, Fri: 8am-5pm, Sat: 9am-5pm, Sun: closed
function getAvailableTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const dayOfWeek = date.getDay();

  // Sunday - no slots
  if (dayOfWeek === 0) {
    return slots;
  }

  let startHour: number;
  let endHour: number;

  if (dayOfWeek === 6) {
    // Saturday: 9am-5pm
    startHour = 9;
    endHour = 17;
  } else if (dayOfWeek === 5) {
    // Friday: 8am-5pm
    startHour = 8;
    endHour = 17;
  } else {
    // Monday-Thursday: 8am-4pm
    startHour = 8;
    endHour = 16;
  }

  for (let hour = startHour; hour <= endHour; hour++) {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    slots.push(slotDate.toISOString());
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
          monThu: { start: '08:00', end: '16:00' },
          fri: { start: '08:00', end: '17:00' },
          sat: { start: '09:00', end: '17:00' },
        },
        daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
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
          error: 'Invalid appointment time. Appointments are only available Monday-Friday, 8am-4pm.',
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

  return httpServer;
}
