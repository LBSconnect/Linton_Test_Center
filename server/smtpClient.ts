import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';
import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Microsoft Graph API (primary — requires Azure AD app registration)
// ---------------------------------------------------------------------------
let graphClient: Client | null = null;

function getGraphClient(): Client | null {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) return null;
  if (graphClient) return graphClient;

  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });
    graphClient = Client.initWithMiddleware({ authProvider });
    console.log('Microsoft Graph client initialized');
    return graphClient;
  } catch (error: any) {
    console.error('Failed to initialize Graph client:', error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// SMTP / Nodemailer (fallback — works with Gmail, Outlook, Office 365, etc.)
// Required env vars: SMTP_HOST, SMTP_USER, SMTP_PASS
// Optional:         SMTP_PORT (default 587), SMTP_FROM_NAME
// ---------------------------------------------------------------------------
function getSmtpTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

// ---------------------------------------------------------------------------
// Unified sendEmail — tries Graph API first, then SMTP
// ---------------------------------------------------------------------------
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}): Promise<boolean> {
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'LBS Test & Exam Center';

  // ── Try Microsoft Graph API ──────────────────────────────────────────────
  const graphCli = getGraphClient();
  if (graphCli && fromAddress) {
    try {
      const message: any = {
        subject: options.subject,
        body: { contentType: 'HTML', content: options.html },
        toRecipients: [{ emailAddress: { address: options.to } }],
        from: { emailAddress: { address: fromAddress, name: fromName } },
      };

      if (options.attachments?.length) {
        message.attachments = options.attachments.map((att) => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.filename,
          contentType: att.contentType || 'application/octet-stream',
          contentBytes: typeof att.content === 'string'
            ? Buffer.from(att.content).toString('base64')
            : att.content.toString('base64'),
        }));
      }

      console.log('Sending email via Graph API to:', options.to);
      await graphCli.api(`/users/${fromAddress}/sendMail`).post({ message, saveToSentItems: true });
      console.log('Email sent via Graph API to', options.to);
      return true;
    } catch (error: any) {
      console.error('Graph API send failed, trying SMTP fallback:', error.message);
    }
  }

  // ── Try SMTP / Nodemailer ────────────────────────────────────────────────
  const transporter = getSmtpTransporter();
  if (transporter && fromAddress) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      };

      if (options.attachments?.length) {
        mailOptions.attachments = options.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        }));
      }

      console.log('Sending email via SMTP to:', options.to);
      await transporter.sendMail(mailOptions);
      console.log('Email sent via SMTP to', options.to);
      return true;
    } catch (error: any) {
      console.error('SMTP send failed:', error.message);
      return false;
    }
  }

  console.warn(
    'No email provider configured. Set Azure credentials (AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET) ' +
    'OR SMTP credentials (SMTP_HOST / SMTP_USER / SMTP_PASS).'
  );
  return false;
}

// ---------------------------------------------------------------------------
// Create a calendar event directly on the business Outlook calendar
// Requires: Calendars.ReadWrite application permission on the Azure AD app
// ---------------------------------------------------------------------------
export async function createOutlookCalendarEvent(options: {
  subject: string;
  bodyHtml: string;
  startDateTime: Date;
  durationMinutes: number;
  attendeeEmail?: string;
  attendeeName?: string;
}): Promise<boolean> {
  const graphCli = getGraphClient();
  const calendarOwner = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;

  if (!graphCli || !calendarOwner) {
    console.warn('Graph client not configured — skipping calendar event creation');
    return false;
  }

  const start = new Date(options.startDateTime);
  const end = new Date(start.getTime() + options.durationMinutes * 60 * 1000);
  const toUTC = (d: Date) => d.toISOString().replace('Z', '');

  const event: any = {
    subject: options.subject,
    body: { contentType: 'HTML', content: options.bodyHtml },
    start: { dateTime: toUTC(start), timeZone: 'UTC' },
    end:   { dateTime: toUTC(end),   timeZone: 'UTC' },
    location: { displayName: '616 FM 1960 Rd W, Ste 101, Houston, TX 77090-3048' },
    isReminderOn: true,
    reminderMinutesBeforeStart: 30,
  };

  if (options.attendeeEmail) {
    event.attendees = [{
      emailAddress: { address: options.attendeeEmail, name: options.attendeeName || options.attendeeEmail },
      type: 'required',
    }];
  }

  try {
    await graphCli.api(`/users/${calendarOwner}/events`).post(event);
    console.log('Outlook calendar event created:', options.subject);
    return true;
  } catch (error: any) {
    console.error('Failed to create Outlook calendar event:', error.message);
    if (error.body) {
      try {
        const body = JSON.parse(error.body);
        console.error('Graph API calendar error:', body.error?.message || body);
      } catch {
        console.error('Graph API calendar error body:', error.body);
      }
    }
    return false;
  }
}

// Legacy shim — kept for compatibility
export async function getEmailTransporter() {
  return null;
}
