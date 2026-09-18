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
  onSnapshot,
  increment,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDdPwaB8mH9TsM5hyXFbF0fNpFaWXjmV0",
  authDomain: "novus-roleplay.firebaseapp.com",
  projectId: "novus-roleplay",
  storageBucket: "novus-roleplay.firebasestorage.app",
  messagingSenderId: "207082104048",
  appId: "1:207082104048:web:bbf438aba78c9a7e79ce35",
  measurementId: "G-V0LK42BXRT"
};

const app = initializeApp(firebaseConfig);
isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});

const auth = getAuth(app);
const db = getFirestore(app);

async function nextPublicId() {
  const ref = doc(db, "counters", "publicId");
  try {
    const n = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.exists() ? Number(snap.data().next || 1) : 1;
      tx.set(ref, { next: cur + 1 }, { merge: true });
      return cur;
    });
    return n;
  } catch (e) {
    const snap = await getDoc(ref);
    const cur = snap.exists() ? Number(snap.data().next || 1) : 1;
    await setDoc(ref, { next: cur + 1 }, { merge: true });
    return cur;
  }
}

async function upsertUserDoc(user, extra) {
  extra = extra || {};
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  let data;
  if (snap.exists()) {
    data = Object.assign({}, snap.data(), extra, {
      uid: user.uid,
      email: (user.email || extra.email || "").toLowerCase(),
      updatedAt: serverTimestamp()
    });
    await setDoc(ref, data, { merge: true });
  } else {
    const publicId = extra.publicId || await nextPublicId();
    data = {
      uid: user.uid,
      email: (user.email || "").toLowerCase(),
      nick: extra.nick || user.displayName || (user.email || "player").split("@")[0],
      publicId,
      balance: extra.balance != null ? extra.balance : 0,
      luckMul: extra.luckMul || 1,
      role: extra.role || "user",
      inventory: extra.inventory || [],
      bestDrop: extra.bestDrop || null,
      createdAt: Date.now(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, data);
  }
  try {
    await setDoc(doc(db, "profiles", data.email), {
      uid: data.uid,
      email: data.email,
      nick: data.nick,
      publicId: data.publicId,
      balance: data.balance || 0,
      role: data.role || "user"
    }, { merge: true });
  } catch (e) {}
  return data;
}

const fb = {
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
  onSnapshot,
  increment,
  runTransaction,
  nextPublicId,
  upsertUserDoc
};

window.ABD_FB = fb;
window.ABD_FIREBASE_READY = true;
