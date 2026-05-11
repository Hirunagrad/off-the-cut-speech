import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJslFB3dOyPICjw2PZUaKbJVQhO5yHAQc",
  authDomain: "off-the-cuff-speech.firebaseapp.com",
  projectId: "off-the-cuff-speech",
  storageBucket: "off-the-cuff-speech.firebasestorage.app",
  messagingSenderId: "400233216085",
  appId: "1:400233216085:web:b82aac214a4b4320eabcdc",
  measurementId: "G-SG8H840K5X"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, googleProvider, db };
