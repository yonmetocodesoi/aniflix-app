import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCdf2R-8RGf2XJ6X1vDdXpzD_O24szQUOA",
    authDomain: "anizero-afc63.firebaseapp.com",
    projectId: "anizero-afc63",
    storageBucket: "anizero-afc63.firebasestorage.app",
    messagingSenderId: "810591056153",
    appId: "1:810591056153:web:1e6100fba8c4e4a52f1588",
    measurementId: "G-G76V64HR8Y"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
