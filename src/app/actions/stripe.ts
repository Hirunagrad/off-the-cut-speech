'use server';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
});

export async function createCheckoutSession(userId: string) {
  try {
    console.log('Creating checkout for UID:', userId);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: { interval: 'month' },
            product_data: {
              name: 'Pro Tier Subscription',
              description: 'Unlimited practice sessions for Off The Cuff Speech',
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      metadata: {
        userId: userId,
      },
    });

    return { url: session.url };
  } catch (error: any) {
    console.error("Error creating stripe session:", error);
    throw new Error(error.message);
  }
}
