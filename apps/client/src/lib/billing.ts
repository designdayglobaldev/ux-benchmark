import { supabase } from './supabase';

export interface BillingStatus {
  tier: 'FREE' | 'PRO';
  creditsBalance: number;
  entitledUntil: string | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
}

export interface SubscribeResponse {
  subscriptionId: string;
  razorpaySubscriptionId: string;
  keyId: string;
  amount: number;
  currency: string;
  planName: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/api/v1/billing/status`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch billing status');
  }

  return res.json();
}

export async function createSubscription(planCode: 'PRO_MONTHLY' | 'PRO_ANNUAL' = 'PRO_MONTHLY'): Promise<SubscribeResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to upgrade');
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/api/v1/billing/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ planCode }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to initiate subscription');
  }

  return res.json();
}

export async function verifyPaymentSignature(payload: {
  razorpayPaymentId?: string;
  razorpaySubscriptionId?: string;
  razorpaySignature?: string;
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  const paymentId = payload.razorpayPaymentId || payload.razorpay_payment_id;
  const subscriptionId = payload.razorpaySubscriptionId || payload.razorpay_subscription_id;
  const signature = payload.razorpaySignature || payload.razorpay_signature;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/api/v1/billing/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature,
      razorpayPaymentId: paymentId,
      razorpaySubscriptionId: subscriptionId,
      razorpaySignature: signature,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Verification failed');
  }

  return res.json();
}

/**
 * Polls /api/v1/billing/status until tier becomes PRO or timeout (30 seconds)
 */
export async function pollSubscriptionUntilActive(
  onSuccess: (status: BillingStatus) => void,
  onTimeout: () => void,
  maxAttempts = 15,
  intervalMs = 2000
) {
  let attempts = 0;

  const poll = async () => {
    try {
      const status = await fetchBillingStatus();
      if (status && (status.tier === 'PRO' || status.subscription?.status === 'ACTIVE')) {
        onSuccess(status);
        return;
      }
    } catch (e) {
      console.warn('Billing polling error:', e);
    }

    attempts++;
    if (attempts >= maxAttempts) {
      onTimeout();
      return;
    }

    setTimeout(poll, intervalMs);
  };

  setTimeout(poll, 1500);
}

