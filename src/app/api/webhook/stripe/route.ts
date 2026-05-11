import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('Signature verified successfully');
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.log(`Webhook Event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        console.log(`Upgrading user: ${userId}`);
        try {
          await adminDb.collection('users').doc(userId).update({
            role: 'pro'
          });
          console.log(`User ${userId} upgraded to pro successfully.`);
        } catch (error: any) {
          console.error(`Firebase Admin Error: ${error.message}`);
        }
      } else {
        console.error('No userId found in session metadata');
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook error: ${err.message}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
