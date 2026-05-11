import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import * as fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function logToFile(msg: string) {
  try {
    fs.appendFileSync('webhook.log', new Date().toISOString() + ' - ' + msg + '\n');
  } catch (e) {}
}

export async function POST(req: Request) {
  logToFile('Received a POST request to webhook');
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      logToFile('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logToFile('Signature verified successfully');
    } catch (err: any) {
      logToFile(`Webhook signature verification failed: ${err.message}`);
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logToFile(`Webhook Event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        logToFile(`Upgrading user: ${userId}`);
        try {
          await adminDb.collection('users').doc(userId).update({
            role: 'pro'
          });
          logToFile(`User ${userId} upgraded to pro successfully.`);
        } catch (error: any) {
          logToFile(`Firebase Admin Error: ${error.message}`);
        }
      } else {
        logToFile('No userId found in session metadata');
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    logToFile(`Webhook error: ${err.message}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
