import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEz-XYOs4HFboJKknVWKnRnaZptvNwxaA",
  authDomain: "arizona-bland-drop-7a218.firebaseapp.com",
  projectId: "arizona-bland-drop-7a218",
  storageBucket: "arizona-bland-drop-7a218.firebasestorage.app",
  messagingSenderId: "200802712663",
  appId: "1:200802712663:web:df09108ede77e376ac7712",
  measurementId: "G-1L32J2619G"
};

const app = initializeApp(firebaseConfig);
isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});

export const auth = getAuth(app);
export const db = getFirestore(app);

export const fb = {
  auth,
  db,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
};

window.ABD_FB = fb;
window.ABD_FIREBASE_READY = true;
