import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { insertContactSchema } from "@shared/schema";
import { sendContactNotification, sendAppointmentConfirmation, sendAppointmentCalendarInvite, sendClassRegistrationNotification, sendClassRegistrationConfirmation } from "./emailService";
import { sendEmail } from "./smtpClient";
import { z } from "zod";
import { CLASS_DEFINITIONS, MAX_CLASS_CAPACITY, getClassDatesForMonth, isValidClassType } from "@shared/classes";

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
  tutoringHours: z.number().int().min(2).max(6).optional(),
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
      if (data.payNow && (data.priceId || data.priceAmount)) {
        try {
          const stripe = await getUncachableStripeClient();

          const lineItems = data.priceId
            ? [{ price: data.priceId, quantity: 1 }]
            : [{
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: data.tutoringHours
                      ? `${data.serviceName} (${data.tutoringHours} hours)`
                      : data.serviceName,
                  },
                  unit_amount: data.priceAmount!,
                },
                quantity: 1,
              }];

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
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
            notes: data.notes,
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
        notes: data.notes,
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

  // ── Group Study Classes ─────────────────────────────────────────────────────

  // GET /api/classes/upcoming-sessions?classType=&weeks=10
  app.get('/api/classes/upcoming-sessions', async (req, res) => {
    try {
      const { classType } = req.query;
      const weeks = Math.min(parseInt(req.query.weeks as string) || 10, 26);

      if (!classType || typeof classType !== 'string' || !isValidClassType(classType)) {
        return res.status(400).json({ error: 'Valid classType is required' });
      }

      const classDef = CLASS_DEFINITIONS[classType as keyof typeof CLASS_DEFINITIONS];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming: any[] = [];
      const cursor = new Date(today);

      // Walk day by day for `weeks` weeks, collect Fri/Sat
      for (let d = 0; d < weeks * 7; d++) {
        const dow = cursor.getDay();
        if (dow === 5 || dow === 6) {
          const y = cursor.getFullYear();
          const m = cursor.getMonth() + 1;
          const day = cursor.getDate();
          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const regCount = await storage.getClassRegistrationCount(classType, dateStr);
          if (regCount < MAX_CLASS_CAPACITY) {
            upcoming.push({
              date: dateStr,
              dayOfWeek: dow === 5 ? 'Friday' : 'Saturday',
              startTime: classDef.startTime,
              endTime: classDef.endTime,
              registrationCount: regCount,
              availableSpots: MAX_CLASS_CAPACITY - regCount,
            });
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      res.json({ sessions: upcoming, classType, title: classDef.title });
    } catch (error: any) {
      console.error('Error fetching upcoming sessions:', error.message);
      res.status(500).json({ error: 'Failed to fetch upcoming sessions' });
    }
  });

  // GET /api/classes/sessions?year=YYYY&month=MM
  app.get('/api/classes/sessions', async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Valid year and month (1-12) are required' });
      }

      const classDates = getClassDatesForMonth(year, month);
      const sessions: any[] = [];

      for (const { date, dayOfWeek } of classDates) {
        for (const [classType, def] of Object.entries(CLASS_DEFINITIONS)) {
          const regCount = await storage.getClassRegistrationCount(classType, date);
          sessions.push({
            date,
            dayOfWeek,
            classType,
            title: def.title,
            shortTitle: def.shortTitle,
            startTime: def.startTime,
            endTime: def.endTime,
            durationHours: def.durationHours,
            priceAmount: def.priceAmount,
            registrationCount: regCount,
            availableSpots: Math.max(0, MAX_CLASS_CAPACITY - regCount),
            isFull: regCount >= MAX_CLASS_CAPACITY,
          });
        }
      }

      res.json({ sessions });
    } catch (error: any) {
      console.error('Error fetching class sessions:', error.message);
      res.status(500).json({ error: 'Failed to fetch class sessions' });
    }
  });

  // GET /api/classes/session-count?classType=&classDate=
  app.get('/api/classes/session-count', async (req, res) => {
    try {
      const { classType, classDate } = req.query;
      if (!classType || !classDate || typeof classType !== 'string' || typeof classDate !== 'string') {
        return res.status(400).json({ error: 'classType and classDate are required' });
      }
      const regCount = await storage.getClassRegistrationCount(classType, classDate);
      res.json({
        registrationCount: regCount,
        availableSpots: Math.max(0, MAX_CLASS_CAPACITY - regCount),
        isFull: regCount >= MAX_CLASS_CAPACITY,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch session count' });
    }
  });

  // POST /api/classes/register
  const classRegisterSchema = z.object({
    classType: z.string().refine(isValidClassType, { message: 'Invalid class type' }),
    classDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().optional(),
  });

  app.post('/api/classes/register', async (req, res) => {
    try {
      const parsed = classRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
      }

      const { classType, classDate, customerName, customerEmail, customerPhone } = parsed.data;
      const classDef = CLASS_DEFINITIONS[classType as keyof typeof CLASS_DEFINITIONS];

      // Check capacity
      const count = await storage.getClassRegistrationCount(classType, classDate);
      if (count >= MAX_CLASS_CAPACITY) {
        return res.status(409).json({ error: 'This session is full. Please select another date.' });
      }

      // Create pending registration
      const registration = await storage.createClassRegistration({
        classType,
        classDate,
        classTime: classDef.startTime,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        paymentStatus: 'unpaid',
      });

      // Create Stripe checkout session
      const stripe = await getUncachableStripeClient();
      const [year, monthStr, day] = classDate.split('-');
      const friendlyDate = new Date(parseInt(year), parseInt(monthStr) - 1, parseInt(day))
        .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: classDef.title,
              description: `${friendlyDate} · ${classDef.startTime === '08:00' ? '8:00 AM' : '10:00 AM'} – ${classDef.endTime === '10:00' ? '10:00 AM' : '12:00 PM'} CT`,
            },
            unit_amount: classDef.priceAmount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/checkout/success?registration_id=${registration.id}&source=class`,
        cancel_url: `${req.protocol}://${req.get('host')}/calendar`,
        metadata: { registration_id: registration.id, type: 'class_registration' },
        customer_email: customerEmail,
      });

      await storage.updateClassRegistrationPayment(registration.id, 'unpaid', session.id!);

      res.json({ checkoutUrl: session.url, registrationId: registration.id });
    } catch (error: any) {
      console.error('Class registration error:', error.message);
      res.status(500).json({ error: 'Failed to register for class' });
    }
  });

  // POST /api/classes/registrations/:id/payment-complete
  app.post('/api/classes/registrations/:id/payment-complete', async (req, res) => {
    try {
      const { id } = req.params;
      const registration = await storage.getClassRegistration(id);
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }
      if (registration.paymentStatus === 'paid') {
        return res.json({ success: true, registration });
      }

      const updated = await storage.updateClassRegistrationPayment(id, 'paid');
      if (!updated) return res.status(500).json({ error: 'Failed to update registration' });

      const classDef = CLASS_DEFINITIONS[updated.classType as keyof typeof CLASS_DEFINITIONS];

      // Send emails
      sendClassRegistrationNotification({
        registrationId: updated.id,
        classTitle: classDef.title,
        classDate: updated.classDate,
        classTime: updated.classTime,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        customerPhone: updated.customerPhone ?? undefined,
        priceAmount: classDef.priceAmount,
      });

      sendClassRegistrationConfirmation({
        registrationId: updated.id,
        classTitle: classDef.title,
        classDate: updated.classDate,
        classTime: updated.classTime,
        endTime: classDef.endTime,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        priceAmount: classDef.priceAmount,
      });

      res.json({ success: true, registration: updated });
    } catch (error: any) {
      console.error('Class payment complete error:', error.message);
      res.status(500).json({ error: 'Failed to update payment' });
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
