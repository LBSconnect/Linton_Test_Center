import { getUncachableResendClient } from './resendClient';

const NOTIFICATION_EMAIL = 'info@lbsconnect.net';
const BUSINESS_NAME = 'LBS Test & Exam Center';
const BUSINESS_ADDRESS = '616 FM 1960 Road West, Suite 575, Houston, TX 77090';

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
    const resend = await getUncachableResendClient();
    if (!resend) {
      console.log('Email skipped (Resend not configured): Contact notification for', data.name);
      return;
    }

    const { client, fromEmail } = resend;
    await client.emails.send({
      from: fromEmail,
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
    const resend = await getUncachableResendClient();
    if (!resend) {
      console.log('Email skipped (Resend not configured): Payment notification for session', data.sessionId);
      return;
    }

    const { client, fromEmail } = resend;
    const formattedAmount = (data.amount / 100).toFixed(2);
    const currencySymbol = data.currency.toUpperCase() === 'USD' ? '$' : data.currency.toUpperCase();

    await client.emails.send({
      from: fromEmail,
      to: NOTIFICATION_EMAIL,
      subject: `New Payment Received - ${currencySymbol}${formattedAmount}${data.productName ? ` for ${data.productName}` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - Payment Received</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 20px;">
              <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">${currencySymbol}${formattedAmount} ${data.currency.toUpperCase()}</p>
              <p style="margin: 4px 0 0 0; color: #047857;">Payment Successful</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.productName ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 140px;">Service:</td><td style="padding: 8px 12px;">${data.productName}</td></tr>` : ''}
              ${data.customerName ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Customer Name:</td><td style="padding: 8px 12px;">${data.customerName}</td></tr>` : ''}
              ${data.customerEmail ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Customer Email:</td><td style="padding: 8px 12px;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>` : ''}
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
}) {
  try {
    const resend = await getUncachableResendClient();
    if (!resend) {
      console.log('Email skipped (Resend not configured): Appointment confirmation for', data.customerName);
      return;
    }

    const { client, fromEmail } = resend;
    const appointmentDateTime = new Date(data.appointmentDate);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const priceDisplay = data.priceAmount ? `$${(data.priceAmount / 100).toFixed(2)}` : 'To be determined';
    const paymentBadge = data.paymentStatus === 'paid'
      ? '<span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PAID</span>'
      : '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px;">Pay at Visit</span>';

    await client.emails.send({
      from: fromEmail,
      to: data.customerEmail,
      subject: `Appointment Confirmed - ${data.serviceName} at LBS Test & Exam Center`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">Appointment Confirmed</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">Hello ${data.customerName},</p>
            <p style="margin: 0 0 20px 0;">Your appointment has been confirmed. Here are your appointment details:</p>

            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e; width: 120px;">Service:</td>
                  <td style="padding: 8px 0;">${data.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Date:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Time:</td>
                  <td style="padding: 8px 0;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Price:</td>
                  <td style="padding: 8px 0;">${priceDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Payment:</td>
                  <td style="padding: 8px 0;">${paymentBadge}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e3a6e;">Location:</p>
              <p style="margin: 0; color: #374151;">${BUSINESS_NAME}<br>${BUSINESS_ADDRESS}</p>
            </div>

            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              If you need to reschedule or cancel, please contact us at <a href="mailto:${NOTIFICATION_EMAIL}">${NOTIFICATION_EMAIL}</a> or call (281) 836-5357.
            </p>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
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
    const resend = await getUncachableResendClient();
    if (!resend) {
      console.log('Email skipped (Resend not configured): Calendar invite for appointment', data.appointmentId);
      return;
    }

    const { client, fromEmail } = resend;
    const appointmentDateTime = new Date(data.appointmentDate);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

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
      durationMinutes: 60,
      notes: data.notes,
    });

    // Convert to base64 for attachment
    const icsBase64 = Buffer.from(icsContent).toString('base64');

    await client.emails.send({
      from: fromEmail,
      to: NOTIFICATION_EMAIL,
      subject: `New Appointment: ${data.serviceName} - ${data.customerName} on ${formattedDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">New Appointment Booked</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 16px 0; color: #1e3a6e; font-size: 18px;">${data.serviceName}</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e; width: 120px;">Customer:</td>
                  <td style="padding: 8px 0;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td>
                </tr>
                ${data.customerPhone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${data.customerPhone}">${data.customerPhone}</a></td></tr>` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Date:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Time:</td>
                  <td style="padding: 8px 0;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Price:</td>
                  <td style="padding: 8px 0;">${priceDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Payment:</td>
                  <td style="padding: 8px 0;">${paymentBadge}</td>
                </tr>
                ${data.notes ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #1e3a6e;">Notes:</td><td style="padding: 8px 0;">${data.notes}</td></tr>` : ''}
              </table>
            </div>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              A calendar invite is attached to this email. Open the attachment to add this appointment to your calendar.
            </p>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `appointment-${data.appointmentId}.ics`,
          content: icsBase64,
          content_type: 'text/calendar',
        },
      ],
    });
    console.log('Calendar invite email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send calendar invite email:', error.message);
  }
}
