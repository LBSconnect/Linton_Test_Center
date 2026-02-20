import { getUncachableResendClient } from './resendClient';

const NOTIFICATION_EMAIL = 'info@lbsconnect.net';

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
            LBS Test &amp; Exam Center | 616 FM 1960 Road West, Suite 575, Houston, TX 77090
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
            LBS Test &amp; Exam Center | 616 FM 1960 Road West, Suite 575, Houston, TX 77090
          </div>
        </div>
      `,
    });
    console.log('Payment notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send payment notification email:', error.message);
  }
}
