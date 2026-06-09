import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqwGhkBL7VdFoSk72LnG7hRG848zUzoUs",
  authDomain: "tech-gadgets-kenya.firebaseapp.com",
  projectId: "tech-gadgets-kenya",
  storageBucket: "tech-gadgets-kenya.firebasestorage.app",
  messagingSenderId: "937704899601",
  appId: "1:937704899601:web:f2ddecafdfe118daf89db0",
  measurementId: "G-VKLHREQ9PN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (safeguarded for SSR/non-browser environments)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

export { app, analytics, db, auth, firebaseConfig };
