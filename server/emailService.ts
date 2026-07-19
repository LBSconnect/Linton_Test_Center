import { sendEmail, createOutlookCalendarEvent } from './smtpClient';

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@lbsconnect.net';
const BUSINESS_NAME = 'LBS Test & Exam Center';
const BUSINESS_ADDRESS = '616 FM 1960 Rd W, Ste 101, Houston, TX 77090-3048';
const LBS_PHONE = '(281) 836-5357';

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${BUSINESS_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#0d1b35;border-radius:10px 10px 0 0;padding:28px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${BUSINESS_NAME}</div>
              <div style="color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">Notary &amp; Testing Services</div>
            </td>
            <td align="right">
              <div style="color:#94a3b8;font-size:11px;">Linton Business Solutions LLC</div>
              <div style="color:#94a3b8;font-size:11px;">JPMorgan Chase Building, Houston TX</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:24px 36px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
          <strong style="color:#0d1b35;">${BUSINESS_NAME}</strong><br />
          ${BUSINESS_ADDRESS}<br />
          ${LBS_PHONE} &nbsp;|&nbsp; <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a><br />
          Mon-Fri 8 AM-5 PM &nbsp;|&nbsp; Sat 8 AM-4 PM
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// Extracts "Exam: <name>" from the notes field and returns { exam, remainingNotes }
function parseExamFromNotes(notes?: string): { exam: string | null; remainingNotes: string | null } {
  if (!notes) return { exam: null, remainingNotes: null };
  const match = notes.match(/^Exam: (.+?)(?:\n\n|$)([\s\S]*)?/);
  if (match) {
    return {
      exam: match[1].trim(),
      remainingNotes: match[2]?.trim() || null,
    };
  }
  return { exam: null, remainingNotes: notes };
}

// Extracts "Duration: X hours" from notes and returns duration in minutes
function parseDurationFromNotes(notes?: string): number {
  if (!notes) return 60;
  const match = notes.match(/Duration: (\d+) hours/);
  return match ? parseInt(match[1], 10) * 60 : 60;
}

// Generate ICS calendar file content
function generateICSContent(data: {
  appointmentId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  appointmentDate: Date;
  durationMinutes?: number;
  notes?: string;
}): string {
  const startDate = new Date(data.appointmentDate);
  const endDate = new Date(startDate.getTime() + (data.durationMinutes || 60) * 60 * 1000);

  // Format date as YYYYMMDDTHHMMSS
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const uid = `${data.appointmentId}@lbs-test-center.onrender.com`;
  const now = formatICSDate(new Date());
  const start = formatICSDate(startDate);
  const end = formatICSDate(endDate);

  const description = `Service: ${data.serviceName}\\nCustomer: ${data.customerName}\\nEmail: ${data.customerEmail}${data.customerPhone ? `\\nPhone: ${data.customerPhone}` : ''}${data.notes ? `\\nNotes: ${data.notes}` : ''}`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LBS Test & Exam Center//Appointment//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${data.serviceName} - ${data.customerName}
DESCRIPTION:${description}
LOCATION:${BUSINESS_ADDRESS}
ORGANIZER;CN=${BUSINESS_NAME}:mailto:${NOTIFICATION_EMAIL}
ATTENDEE;CN=${data.customerName};RSVP=TRUE:mailto:${data.customerEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message: string;
}) {
  try {
    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Contact Form Submission from ${data.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - New Contact Submission</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 120px;">Name:</td>
                <td style="padding: 8px 12px;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Email:</td>
                <td style="padding: 8px 12px;"><a href="mailto:${data.email}">${data.email}</a></td>
              </tr>
              ${data.phone ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Phone:</td><td style="padding: 8px 12px;">${data.phone}</td></tr>` : ''}
              ${data.service ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Service:</td><td style="padding: 8px 12px;">${data.service}</td></tr>` : ''}
            </table>
            <div style="margin-top: 16px; padding: 16px; background-color: white; border: 1px solid #e5e7eb; border-radius: 6px;">
              <p style="font-weight: bold; color: #1e3a6e; margin: 0 0 8px 0;">Message:</p>
              <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
            </div>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
    });
    console.log('Contact notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send contact notification email:', error.message);
  }
}

export async function sendPaymentNotification(data: {
  customerEmail?: string;
  customerName?: string;
  amount: number;
  currency: string;
  productName?: string;
  sessionId: string;
}) {
  try {
    const formattedAmount = `$${(data.amount / 100).toFixed(2)}`;
    const serviceName = data.productName || 'Service';

    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `A ${serviceName} has been purchased`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - New Purchase</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 20px;">
              <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">${formattedAmount}</p>
              <p style="margin: 4px 0 0 0; color: #047857;">Payment Successful</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 140px;">Service:</td><td style="padding: 8px 12px;">${serviceName}</td></tr>
              ${data.customerName ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Customer Name:</td><td style="padding: 8px 12px;">${data.customerName}</td></tr>` : ''}
              ${data.customerEmail ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Customer Email:</td><td style="padding: 8px 12px;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>` : ''}
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Amount:</td>
                <td style="padding: 8px 12px;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Session ID:</td>
                <td style="padding: 8px 12px; font-size: 12px; color: #6b7280;">${data.sessionId}</td>
              </tr>
            </table>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
    });
    console.log('Payment notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send payment notification email:', error.message);
  }
}

// Send appointment confirmation to customer
export async function sendAppointmentConfirmation(data: {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  appointmentDate: Date;
  priceAmount?: number;
  paymentStatus: string;
  notes?: string;
}) {
  try {
    const { exam } = parseExamFromNotes(data.notes);
    const durationMins = parseDurationFromNotes(data.notes);
    const durationDisplay = durationMins > 60 ? `${durationMins / 60} hours` : null;
    const appointmentDateTime = new Date(data.appointmentDate);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });

    const isNotaryService = data.serviceName.toLowerCase().includes('notary');
    const priceDisplay = data.priceAmount ? `$${(data.priceAmount / 100).toFixed(2)}` : 'To be determined';
    const paymentBadge = data.paymentStatus === 'paid'
      ? '<span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PAID</span>'
      : '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px;">Pay at Visit</span>';

    const content = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">Appointment Confirmed</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hello ${data.customerName}, your appointment has been confirmed. Please see the details below.</p>

      <div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #1e3a6e;">
        <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Appointment Details</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;width:40%;">Service:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${data.serviceName}</td></tr>
          ${exam ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Exam:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${exam}</td></tr>` : ''}
          ${durationDisplay ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Duration:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${durationDisplay}</td></tr>` : ''}
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Date:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${formattedDate}</td></tr>
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Time:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${formattedTime} CT</td></tr>
          ${!isNotaryService ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Price:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${priceDisplay}</td></tr>` : ''}
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Payment:</td><td style="font-size:14px;padding:4px 0;">${paymentBadge}</td></tr>
        </table>
      </div>

      <div style="background:#f8fafc;border-radius:8px;padding:18px 20px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">Location</p>
        <p style="margin:0;color:#374151;font-size:14px;">${BUSINESS_NAME}<br />${BUSINESS_ADDRESS}</p>
      </div>

      <p style="margin:0;color:#64748b;font-size:13px;">
        To reschedule or cancel, contact us at <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a> or call ${LBS_PHONE}.
      </p>
    `;

    await sendEmail({
      to: data.customerEmail,
      subject: `Appointment Confirmed: ${data.serviceName} at LBS Test & Exam Center`,
      html: emailWrapper(content),
    });
    console.log('Appointment confirmation email sent to', data.customerEmail);
  } catch (error: any) {
    console.error('Failed to send appointment confirmation email:', error.message);
  }
}

// Send calendar invite to business email
export async function sendAppointmentCalendarInvite(data: {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  appointmentDate: Date;
  priceAmount?: number;
  paymentStatus: string;
  notes?: string;
}) {
  try {
    const { exam, remainingNotes } = parseExamFromNotes(data.notes);
    const durationMins = parseDurationFromNotes(data.notes);
    const durationDisplay = durationMins > 60 ? `${durationMins / 60} hours` : null;
    const appointmentDateTime = new Date(data.appointmentDate);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });

    const isNotaryService = data.serviceName.toLowerCase().includes('notary');
    const priceDisplay = data.priceAmount ? `$${(data.priceAmount / 100).toFixed(2)}` : 'To be determined';
    const paymentBadge = data.paymentStatus === 'paid'
      ? '<span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PAID</span>'
      : '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px;">UNPAID</span>';

    // Generate ICS content
    const icsContent = generateICSContent({
      appointmentId: data.appointmentId,
      serviceName: data.serviceName,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      appointmentDate: data.appointmentDate,
      durationMinutes: parseDurationFromNotes(data.notes),
      notes: data.notes,
    });

    const startISO = appointmentDateTime.toISOString();
    const endISO = new Date(appointmentDateTime.getTime() + durationMins * 60 * 1000).toISOString();

    const adminContent = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:22px;font-weight:700;">New Appointment Booked</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A new appointment has been scheduled. Open the attached .ics file to add it to your calendar.</p>

      <div style="background:#fff7ed;border-radius:8px;padding:20px 24px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <div style="color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">Appointment Summary</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;width:40%;">Service:</td><td style="font-size:14px;padding:4px 0;font-weight:700;color:#0d1b35;">${data.serviceName}</td></tr>
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Customer:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${data.customerName}</td></tr>
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Email:</td><td style="font-size:14px;padding:4px 0;"><a href="mailto:${data.customerEmail}" style="color:#1e3a6e;">${data.customerEmail}</a></td></tr>
          ${data.customerPhone ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Phone:</td><td style="font-size:14px;padding:4px 0;"><a href="tel:${data.customerPhone}" style="color:#1e3a6e;">${data.customerPhone}</a></td></tr>` : ''}
          ${exam ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Exam:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${exam}</td></tr>` : ''}
          ${durationDisplay ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Duration:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${durationDisplay}</td></tr>` : ''}
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Date:</td><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">${formattedDate}</td></tr>
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Time:</td><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">${formattedTime} CT</td></tr>
          ${!isNotaryService ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Price:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${priceDisplay}</td></tr>` : ''}
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Payment:</td><td style="font-size:14px;padding:4px 0;">${paymentBadge}</td></tr>
          ${remainingNotes ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Notes:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${remainingNotes}</td></tr>` : ''}
        </table>
      </div>
      <span style="display:none;overflow:hidden;max-height:0">APPTSTART:${startISO}|APPTEND:${endISO}|APPTSERVICE:${data.serviceName}|APPTCUSTOMER:${data.customerName}</span>
    `;

    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Appointment: ${data.serviceName} - ${data.customerName} on ${formattedDate}`,
      html: emailWrapper(adminContent),
      attachments: [
        {
          filename: `appointment-${data.appointmentId}.ics`,
          content: icsContent,
          contentType: 'text/calendar',
        },
      ],
    });
    console.log('Calendar invite email sent to', NOTIFICATION_EMAIL);

    // Create the event directly on the Outlook calendar (requires Calendars.ReadWrite on the Azure AD app)
    createOutlookCalendarEvent({
      subject: `${data.serviceName}: ${data.customerName}`,
      bodyHtml: `
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Email:</strong> ${data.customerEmail}</p>
        ${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
        ${exam ? `<p><strong>Exam:</strong> ${exam}</p>` : ''}
        ${remainingNotes ? `<p><strong>Notes:</strong> ${remainingNotes}</p>` : ''}
        <p><strong>Payment:</strong> ${data.paymentStatus === 'paid' ? 'Paid Online' : 'Pay at Visit'}</p>
      `,
      startDateTime: appointmentDateTime,
      durationMinutes: durationMins,
      attendeeEmail: data.customerEmail,
      attendeeName: data.customerName,
    });
  } catch (error: any) {
    console.error('Failed to send calendar invite email:', error.message);
  }
}

