import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';

// Microsoft Graph API configuration for sending emails
// Requires: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, MAIL_FROM_ADDRESS
//
// Setup in Azure:
//   1. Register an app in Azure AD (Entra ID)
//   2. Create a client secret
//   3. Grant Mail.Send application permission
//   4. Admin consent for the permission

let graphClient: Client | null = null;

function getGraphClient(): Client | null {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.warn('Azure credentials not set (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET). Email features disabled.');
    return null;
  }

  if (graphClient) {
    return graphClient;
  }

  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    graphClient = Client.initWithMiddleware({
      authProvider,
    });

    console.log('Microsoft Graph client initialized');
    return graphClient;
  } catch (error: any) {
    console.error('Failed to initialize Graph client:', error.message);
    return null;
  }
}

// Send email using Microsoft Graph API
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}): Promise<boolean> {
  const client = getGraphClient();
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'LBS Test & Exam Center';

  if (!client) {
    console.log('Email skipped (Graph API not configured):', options.subject);
    return false;
  }

  if (!fromAddress) {
    console.error('MAIL_FROM_ADDRESS not set');
    return false;
  }

  try {
    const message: any = {
      subject: options.subject,
      body: {
        contentType: 'HTML',
        content: options.html,
      },
      toRecipients: [
        {
          emailAddress: {
            address: options.to,
          },
        },
      ],
      from: {
        emailAddress: {
          address: fromAddress,
          name: fromName,
        },
      },
    };

    // Handle attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      message.attachments = options.attachments.map((att) => {
        const contentBytes = typeof att.content === 'string'
          ? Buffer.from(att.content).toString('base64')
          : att.content.toString('base64');

        return {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.filename,
          contentType: att.contentType || 'application/octet-stream',
          contentBytes,
        };
      });
    }

    console.log('Sending email via Graph API to:', options.to);

    await client
      .api(`/users/${fromAddress}/sendMail`)
      .post({ message, saveToSentItems: true });

    console.log('Email sent successfully to', options.to);
    return true;
  } catch (error: any) {
    console.error('Failed to send email via Graph API:', error.message);
    if (error.body) {
      try {
        const errorBody = JSON.parse(error.body);
        console.error('Graph API error details:', errorBody.error?.message || errorBody);
      } catch {
        console.error('Graph API error body:', error.body);
      }
    }
    return false;
  }
}

// Directly create a calendar event on the business Outlook calendar via Graph API.
// Requires Calendars.ReadWrite application permission on the Azure AD app registration.
export async function createOutlookCalendarEvent(options: {
  subject: string;
  bodyHtml: string;
  startDateTime: Date;
  durationMinutes: number;
  attendeeEmail?: string;
  attendeeName?: string;
}): Promise<boolean> {
  const client = getGraphClient();
  const calendarOwner = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;

  if (!client || !calendarOwner) {
    console.warn('Graph client not configured — skipping calendar event creation');
    return false;
  }

  const startDate = new Date(options.startDateTime);
  const endDate = new Date(startDate.getTime() + options.durationMinutes * 60 * 1000);

  const toUTCISO = (d: Date) => d.toISOString().replace('Z', '');

  const event: any = {
    subject: options.subject,
    body: { contentType: 'HTML', content: options.bodyHtml },
    start: { dateTime: toUTCISO(startDate), timeZone: 'UTC' },
    end:   { dateTime: toUTCISO(endDate),   timeZone: 'UTC' },
    location: { displayName: '616 FM 1960 Rd W, Ste 101, Houston, TX 77090-3048' },
    isReminderOn: true,
    reminderMinutesBeforeStart: 30,
  };

  if (options.attendeeEmail) {
    event.attendees = [{
      emailAddress: {
        address: options.attendeeEmail,
        name: options.attendeeName || options.attendeeEmail,
      },
      type: 'required',
    }];
  }

  try {
    await client.api(`/users/${calendarOwner}/events`).post(event);
    console.log('Outlook calendar event created:', options.subject);
    return true;
  } catch (error: any) {
    console.error('Failed to create Outlook calendar event:', error.message);
    if (error.body) {
      try {
        const body = JSON.parse(error.body);
        console.error('Graph API error:', body.error?.message || body);
      } catch {
        console.error('Graph API error body:', error.body);
      }
    }
    return false;
  }
}

// Legacy function for compatibility - no longer needed with Graph API
export async function getEmailTransporter() {
  const client = getGraphClient();
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'LBS Test & Exam Center';

  if (!client || !fromAddress) {
    return null;
  }

  return {
    transporter: null, // Not used with Graph API
    fromEmail: `"${fromName}" <${fromAddress}>`,
  };
}
