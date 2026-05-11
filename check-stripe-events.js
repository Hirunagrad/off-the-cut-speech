const Stripe = require('stripe');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

async function run() {
  console.log("Fetching recent Stripe events...");
  const events = await stripe.events.list({
    limit: 5,
  });

  for (const event of events.data) {
    console.log(`\nEvent: ${event.type} (ID: ${event.id})`);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log(`  - Session ID: ${session.id}`);
      console.log(`  - Metadata: ${JSON.stringify(session.metadata)}`);
      console.log(`  - Payment Status: ${session.payment_status}`);
    }
  }
}

run().catch(console.error);
