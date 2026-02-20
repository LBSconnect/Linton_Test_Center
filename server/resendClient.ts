import { Resend } from 'resend';

// Get Resend credentials from environment variables (works on any platform)
function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@lbs4.com';

  return { apiKey, fromEmail };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = getCredentials();

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set, email features will be disabled');
    return null;
  }

  return {
    client: new Resend(apiKey),
    fromEmail
  };
}
