import nodemailer from 'nodemailer';

// Gmail SMTP configuration
// Requires: GMAIL_USER and GMAIL_APP_PASSWORD environment variables
// To get an App Password:
// 1. Go to https://myaccount.google.com/apppasswords
// 2. Select "Mail" and your device
// 3. Copy the 16-character password (no spaces)

function getCredentials() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const fromName = process.env.GMAIL_FROM_NAME || 'LBS Test & Exam Center';

  return { user, pass, fromName };
}

let transporter: nodemailer.Transporter | null = null;

export async function getGmailTransporter() {
  const { user, pass, fromName } = getCredentials();

  if (!user || !pass) {
    console.warn('GMAIL_USER or GMAIL_APP_PASSWORD not set, email features will be disabled');
    return null;
  }

  // Reuse existing transporter if available
  if (transporter) {
    return {
      transporter,
      fromEmail: `"${fromName}" <${user}>`
    };
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('Gmail SMTP connection verified');
  } catch (error: any) {
    console.error('Gmail SMTP connection failed:', error.message);
    transporter = null;
    return null;
  }

  return {
    transporter,
    fromEmail: `"${fromName}" <${user}>`
  };
}

// Send email using Gmail SMTP
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  const gmail = await getGmailTransporter();
  if (!gmail) {
    console.log('Email skipped (Gmail not configured):', options.subject);
    return false;
  }

  const { transporter, fromEmail } = gmail;

  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    if (options.attachments) {
      mailOptions.attachments = options.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      }));
    }

    await transporter.sendMail(mailOptions);
    console.log('Email sent to', options.to);
    return true;
  } catch (error: any) {
    console.error('Failed to send email:', error.message);
    return false;
  }
}
