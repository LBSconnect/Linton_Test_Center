import { Resend } from 'resend';

// Get Resend credentials from environment variables (works on any platform)
function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@lbs4.com';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }

  return { apiKey, fromEmail };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}
