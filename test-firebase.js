const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "off-the-cuff-speech",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

async function run() {
  const db = admin.firestore();
  const users = await db.collection('users').get();
  users.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

run().catch(console.error);
