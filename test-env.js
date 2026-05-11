const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
console.log(JSON.stringify(process.env.FIREBASE_PRIVATE_KEY));
