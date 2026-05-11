'use server';

import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
});

type ChallengeType = '7-day' | '14-day';

export async function createCheckoutSession(userId: string, challengeType: ChallengeType) {
  try {
    console.log('Creating setup session for UID:', userId, 'challenge:', challengeType);

    const getBaseUrl = async () => {
      if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
      
      try {
        const headersList = await headers();
        const host = headersList.get('host');
        if (host) {
          const protocol = host.includes('localhost') ? 'http' : 'https';
          return `${protocol}://${host}`;
        }
      } catch (e) {
        // Fallback if headers are not available
      }

      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      return 'http://localhost:3000';
    };

    const baseUrl = await getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'setup',
      customer_creation: 'always',
      success_url: `${baseUrl}/dashboard?challenge_started=${challengeType}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId: userId,
        challengeType: challengeType,
      },
    });

    return { url: session.url };
  } catch (error: any) {
    console.error("Error creating stripe session:", error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}
