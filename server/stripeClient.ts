import Stripe from 'stripe';

// Get Stripe credentials from environment variables (works on any platform)
function getCredentials() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  return {
    publishableKey: publishableKey || '',
    secretKey: secretKey || '',
  };
}

let stripeWarningLogged = false;

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = getCredentials();

  if (!secretKey) {
    if (!stripeWarningLogged) {
      console.warn('STRIPE_SECRET_KEY not set, Stripe features will be disabled');
      stripeWarningLogged = true;
    }
    throw new Error('Stripe not configured');
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia' as any,
  });
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = getCredentials();
  if (!secretKey) {
    throw new Error('Stripe not configured');
  }
  return secretKey;
}

export function isStripeConfigured(): boolean {
  const { secretKey } = getCredentials();
  return !!secretKey;
}
