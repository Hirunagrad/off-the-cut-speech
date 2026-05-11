const Stripe = require('stripe');

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function run() {
  const payload = {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        metadata: {
          userId: '2XUnuGxcKoOOP7sQErit1ieO9ym1' // test4 UID
        }
      }
    }
  };

  const payloadString = JSON.stringify(payload, null, 2);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: webhookSecret,
  });

  console.log("Sending webhook...");
  const res = await fetch('http://localhost:3000/api/webhook/stripe', {
    method: 'POST',
    headers: {
      'stripe-signature': signature,
      'Content-Type': 'application/json'
    },
    body: payloadString
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

run().catch(console.error);
