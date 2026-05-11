import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const CHALLENGE_CONFIG: Record<string, { days: number; totalCost: number }> = {
  '7-day':  { days: 7,  totalCost: 20 },
  '14-day': { days: 14, totalCost: 30 },
};

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

    // ── Handle card setup completion ─────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId       = session.metadata?.userId;
      const challengeType = session.metadata?.challengeType;

      if (!userId) {
        console.error('No userId found in session metadata');
        return NextResponse.json({ received: true });
      }

      // Legacy subscription flow (mode === 'subscription') — keep working
      if (session.mode === 'subscription') {
        console.log(`[Legacy] Upgrading user ${userId} to pro via subscription`);
        await adminDb.collection('users').doc(userId).update({ role: 'pro' });
        return NextResponse.json({ received: true });
      }

      // New Challenge Sprint flow (mode === 'setup')
      if (session.mode === 'setup' && challengeType) {
        const config = CHALLENGE_CONFIG[challengeType];
        if (!config) {
          console.error(`Unknown challengeType: ${challengeType}`);
          return NextResponse.json({ received: true });
        }

        // ── Bug fix 1: setup_intent can be a string OR an expanded object ──
        // Never cast directly — always extract the ID safely.
        const rawSetupIntent = session.setup_intent;
        const stripeSetupIntentId: string | null =
          typeof rawSetupIntent === 'string'
            ? rawSetupIntent
            : (rawSetupIntent as Stripe.SetupIntent | null)?.id ?? null;

        // ── Bug fix 2: session.customer is null on setup mode unless pre-created.
        // Retrieve the actual customer ID from the SetupIntent object itself.
        let stripeCustomerId: string | null =
          typeof session.customer === 'string' ? session.customer : null;

        if (!stripeCustomerId && stripeSetupIntentId) {
          try {
            const setupIntent = await stripe.setupIntents.retrieve(stripeSetupIntentId);
            stripeCustomerId =
              typeof setupIntent.customer === 'string'
                ? setupIntent.customer
                : (setupIntent.customer as Stripe.Customer | null)?.id ?? null;
            console.log(`[Webhook] Retrieved stripeCustomerId from SetupIntent: ${stripeCustomerId}`);
          } catch (e: any) {
            console.error(`[Webhook] Failed to retrieve SetupIntent: ${e.message}`);
          }
        }

        const startDate = new Date();
        const endDate   = new Date(startDate);
        endDate.setDate(endDate.getDate() + config.days);

        console.log(
          `[Webhook] Creating challenge for user ${userId}: ${challengeType}` +
          ` | setupIntentId=${stripeSetupIntentId} | customerId=${stripeCustomerId}`
        );

        // ── Bug fix 3: Split into separate try/catch so each op logs its own error ──

        // Step A: Update user document
        try {
          await adminDb.collection('users').doc(userId).update({
            role:               'pro',
            activeChallenge:    challengeType,
            challengeStartedAt: FieldValue.serverTimestamp(),
          });
          console.log(`[Webhook] User ${userId} updated to pro ✓`);
        } catch (e: any) {
          console.error(`[Webhook] FAILED to update user doc for ${userId}: ${e.message}`);
          // Don't return — still try to create the challenge doc
        }

        // Step B: Create challenge document in subcollection
        try {
          const challengeRef = await adminDb
            .collection('users').doc(userId)
            .collection('challenges').add({
              challengeType,
              startDate:          FieldValue.serverTimestamp(),
              endDate,
              status:             'active',
              stripeCustomerId:   stripeCustomerId,
              stripeSetupIntentId: stripeSetupIntentId,
              totalDays:          config.days,
              totalCost:          config.totalCost,
              daysCompleted:      0,
              createdAt:          FieldValue.serverTimestamp(),
            });
          console.log(`[Webhook] Challenge doc created at users/${userId}/challenges/${challengeRef.id} ✓`);
        } catch (e: any) {
          console.error(`[Webhook] FAILED to create challenge subcollection doc for ${userId}: ${e.message}`);
          console.error(`[Webhook] Attempted data: challengeType=${challengeType}, customerId=${stripeCustomerId}, setupIntentId=${stripeSetupIntentId}`);
        }
      }
    }

    // ── Handle setup_intent.succeeded (backup event) ─────────────────────────
    if (event.type === 'setup_intent.succeeded') {
      const setupIntent = event.data.object as Stripe.SetupIntent;
      console.log(`SetupIntent succeeded: ${setupIntent.id} — card saved for future charge.`);
      // No action needed here — checkout.session.completed already handles it
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook error: ${err.message}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
