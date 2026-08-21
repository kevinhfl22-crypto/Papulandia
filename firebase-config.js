import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIkZWxYmsdTXsNT7XyiY_fvTNgtG6P0TY",
  authDomain: "papulandia-b3297.firebaseapp.com",
  projectId: "papulandia-b3297",
  storageBucket: "papulandia-b3297.firebasestorage.app",
  messagingSenderId: "257939482826",
  appId: "1:257939482826:web:d6598450f0ae884e676c33",
  measurementId: "G-T87LZPG3N6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
