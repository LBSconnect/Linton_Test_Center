import nodemailer from 'nodemailer';

// Microsoft 365 / Outlook SMTP configuration
// Requires: SMTP_USER and SMTP_PASSWORD environment variables
// For Office 365: Use your Microsoft account email and password
// If you have 2FA enabled, create an app password at:
// https://account.microsoft.com/security (Security > App passwords)

function getCredentials() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME || 'LBS Test & Exam Center';

  return { user, pass, fromName };
}

let transporter: nodemailer.Transporter | null = null;

export async function getEmailTransporter() {
  const { user, pass, fromName } = getCredentials();

  if (!user || !pass) {
    console.warn('SMTP_USER or SMTP_PASSWORD not set, email features will be disabled');
    return null;
  }

  // Reuse existing transporter if available
  if (transporter) {
    return {
      transporter,
      fromEmail: `"${fromName}" <${user}>`
    };
  }

  // Microsoft 365 / Outlook.com SMTP settings
  transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user,
      pass,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('Microsoft SMTP connection verified');
  } catch (error: any) {
    console.error('Microsoft SMTP connection failed:', error.message);
    transporter = null;
    return null;
  }

  return {
    transporter,
    fromEmail: `"${fromName}" <${user}>`
  };
}

// Send email using SMTP
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
  const smtp = await getEmailTransporter();
  if (!smtp) {
    console.log('Email skipped (SMTP not configured):', options.subject);
    return false;
  }

  const { transporter, fromEmail } = smtp;

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
