import nodemailer from 'nodemailer';

// Microsoft 365 SMTP configuration
// Requires: SMTP_USER and SMTP_PASSWORD environment variables
//
// Setup:
//   1. Enable SMTP AUTH in Microsoft 365 Admin Center
//   2. Ensure Basic Auth is not blocked by Security Defaults
//   3. Set SMTP_USER=your@domain.com, SMTP_PASSWORD=your-password

function getCredentials() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME || 'LBS Test & Exam Center';

  return { user, pass, fromName };
}

function getSmtpConfig(email: string) {
  // Allow custom SMTP host override via environment variable
  const customHost = process.env.SMTP_HOST;
  if (customHost) {
    return {
      host: customHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: email, pass: process.env.SMTP_PASSWORD },
      tls: { minVersion: 'TLSv1.2' as const },
    };
  }

  // Microsoft 365 SMTP
  return {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: { user: email, pass: process.env.SMTP_PASSWORD },
    tls: { minVersion: 'TLSv1.2' as const },
  };
}

let transporter: nodemailer.Transporter | null = null;
let lastUser: string | null = null;

export async function getEmailTransporter() {
  const { user, pass, fromName } = getCredentials();

  if (!user || !pass) {
    console.warn('SMTP_USER or SMTP_PASSWORD not set, email features will be disabled');
    return null;
  }

  // Reuse existing transporter if same user
  if (transporter && lastUser === user) {
    return {
      transporter,
      fromEmail: `"${fromName}" <${user}>`
    };
  }

  // Create new transporter
  const config = getSmtpConfig(user);
  console.log('SMTP Config:', { host: config.host, port: config.port, user: config.auth.user });
  transporter = nodemailer.createTransport(config);
  lastUser = user;

  // Verify connection
  try {
    await transporter.verify();
    console.log('SMTP connection verified for', user);
  } catch (error: any) {
    console.error('SMTP connection failed:', error.message);
    transporter = null;
    lastUser = null;
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
