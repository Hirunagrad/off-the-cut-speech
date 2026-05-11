import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
});

// Protect with a secret token — set CRON_SECRET in your .env.local and Vercel env vars
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: Request) {
  // ── Security: verify the cron secret ──────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[Cron] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting challenge settlement...');
  const now = new Date();
  const results: Record<string, any>[] = [];

  try {
    // ── Step 1: Find all active challenges that have ended ─────────────────
    // Use collectionGroup to query across all users/{userId}/challenges subcollections
    const expiredSnapshot = await adminDb
      .collectionGroup('challenges')
      .where('status', '==', 'active')
      .where('endDate', '<=', now)
      .get();

    if (expiredSnapshot.empty) {
      console.log('[Cron] No expired challenges to settle.');
      return NextResponse.json({ settled: 0, results: [] });
    }

    console.log(`[Cron] Found ${expiredSnapshot.size} challenge(s) to settle.`);

    for (const challengeDoc of expiredSnapshot.docs) {
      const challenge = challengeDoc.data();
      const {
        challengeType,
        totalDays,
        totalCost,
        startDate,
        endDate,
        stripeSetupIntentId,
        stripeCustomerId,
      } = challenge;

      // Derive userId from the document path: users/{userId}/challenges/{docId}
      const userId = challengeDoc.ref.parent.parent?.id;
      if (!userId) {
        console.error(`[Cron] Could not derive userId from path: ${challengeDoc.ref.path}`);
        continue;
      }

      const result: Record<string, any> = {
        challengeId: challengeDoc.id,
        userId,
        challengeType,
      };

      try {
        // ── Step 2: Count how many unique days the user practiced ────────────
        const sessionsSnapshot = await adminDb
          .collection(`users/${userId}/sessions`)
          .where('date', '>=', startDate)
          .where('date', '<=', endDate)
          .get();

        const uniqueDays = new Set<string>();
        sessionsSnapshot.forEach((doc) => {
          const sessionDate = doc.data().date?.toDate?.();
          if (sessionDate) {
            uniqueDays.add(sessionDate.toISOString().split('T')[0]);
          }
        });

        const daysCompleted = Math.min(uniqueDays.size, totalDays);
        const discount      = daysCompleted;
        const finalCharge   = Math.max(0, totalCost - discount);
        const chargeInCents = finalCharge * 100;

        console.log(
          `[Cron] User ${userId}: ${daysCompleted}/${totalDays} days, ` +
          `charging $${finalCharge} (was $${totalCost}, -$${discount} discount)`
        );

        result.daysCompleted = daysCompleted;
        result.finalCharge   = finalCharge;

        // ── Step 3: Retrieve the saved payment method from the SetupIntent ──
        let paymentMethodId: string | null = null;

        if (stripeSetupIntentId) {
          const setupIntent = await stripe.setupIntents.retrieve(stripeSetupIntentId);
          paymentMethodId   = setupIntent.payment_method as string | null;
        }

        // ── Step 4: Charge the customer ──────────────────────────────────────
        if (chargeInCents > 0 && paymentMethodId && stripeCustomerId) {
          const paymentIntent = await stripe.paymentIntents.create({
            amount:         chargeInCents,
            currency:       'usd',
            customer:       stripeCustomerId,
            payment_method: paymentMethodId,
            confirm:        true,
            off_session:    true,
            description:
              `Off The Cuff — ${challengeType} Challenge final charge ` +
              `($${totalCost} - $${discount} reward)`,
            metadata: {
              userId,
              challengeType,
              challengeId:   challengeDoc.id,
              daysCompleted: String(daysCompleted),
            },
          });

          result.paymentIntentId     = paymentIntent.id;
          result.paymentIntentStatus = paymentIntent.status;
          console.log(`[Cron] PaymentIntent created: ${paymentIntent.id} (${paymentIntent.status})`);
        } else if (chargeInCents === 0) {
          console.log(`[Cron] User ${userId} completed all days — no charge.`);
          result.paymentIntentId = 'WAIVED_FULL_COMPLETION';
        } else {
          console.error(`[Cron] Could not charge: paymentMethod=${paymentMethodId}, customer=${stripeCustomerId}`);
          result.error = 'Missing payment method or customer ID';
        }

        // ── Step 5: Mark challenge as settled in Firestore ───────────────────
        await challengeDoc.ref.update({
          status:        'completed',
          daysCompleted,
          finalCharge,
          settledAt:     FieldValue.serverTimestamp(),
        });

        await adminDb.collection('users').doc(userId).update({
          activeChallenge:   null,
          role:              'free',
          lastChallengeType: challengeType,
          lastChallengeDays: daysCompleted,
        });

        result.status = 'settled';
      } catch (err: any) {
        console.error(`[Cron] Error processing challenge ${challengeDoc.id}: ${err.message}`);
        result.status = 'error';
        result.error  = err.message;

        await challengeDoc.ref.update({
          status:       'settlement_failed',
          errorMessage: err.message,
          failedAt:     FieldValue.serverTimestamp(),
        });
      }

      results.push(result);
    }

    console.log(`[Cron] Settlement complete. Processed: ${results.length}`);
    return NextResponse.json({ settled: results.length, results });

  } catch (err: any) {
    console.error(`[Cron] Fatal error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
