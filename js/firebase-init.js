(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyDEz-XYOs4HFboJKknVWKnRnaZptvNwxaA",
    authDomain: "arizona-bland-drop-7a218.firebaseapp.com",
    projectId: "arizona-bland-drop-7a218",
    storageBucket: "arizona-bland-drop-7a218.firebasestorage.app",
    messagingSenderId: "200802712663",
    appId: "1:200802712663:web:df09108ede77e376ac7712",
    measurementId: "G-1L32J2619G"
  };

  if (!window.firebase) {
    window.ABD_FB_ERROR = "Firebase SDK не загрузился";
    return;
  }

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();

  function doc(database, col, id) {
    return database.collection(col).doc(id);
  }

  async function getDoc(ref) {
    const s = await ref.get();
    return { exists: function () { return s.exists; }, data: function () { return s.data(); }, id: s.id };
  }

  function setDoc(ref, data, opt) {
    return ref.set(data, { merge: !!(opt && opt.merge) });
  }

  function collection(database, name) {
    return database.collection(name);
  }

  function addDoc(col, data) {
    return col.add(data);
  }

  async function getDocs(q) {
    const s = await q.get();
    return {
      forEach: function (fn) {
        s.forEach(function (d) { fn({ id: d.id, data: function () { return d.data(); } }); });
      }
    };
  }

  function orderBy(field, dir) { return { type: "ob", field: field, dir: dir || "desc" }; }
  function limit(n) { return { type: "lim", n: n }; }
  function query(col) {
    let q = col;
    for (let i = 1; i < arguments.length; i++) {
      const p = arguments[i];
      if (p && p.type === "ob") q = q.orderBy(p.field, p.dir);
      if (p && p.type === "lim") q = q.limit(p.n);
    }
    return q;
  }

  function onSnapshot(q, cb) {
    return q.onSnapshot(cb);
  }

  function serverTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  async function nextPublicId() {
    const ref = db.collection("counters").doc("publicId");
    try {
      const n = await db.runTransaction(async function (tx) {
        const snap = await tx.get(ref);
        const cur = snap.exists ? Number((snap.data() || {}).next || 1) : 1;
        tx.set(ref, { next: cur + 1 }, { merge: true });
        return cur;
      });
      return n;
    } catch (e) {
      const snap = await ref.get();
      const cur = snap.exists ? Number((snap.data() || {}).next || 1) : 1;
      await ref.set({ next: cur + 1 }, { merge: true });
      return cur;
    }
  }

  async function upsertUserDoc(user, extra) {
    extra = extra || {};
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();
    let data;
    if (snap.exists) {
      data = Object.assign({}, snap.data(), extra, {
        uid: user.uid,
        email: String(user.email || extra.email || "").toLowerCase()
      });
      await ref.set(data, { merge: true });
    } else {
      const publicId = extra.publicId || await nextPublicId();
      data = {
        uid: user.uid,
        email: String(user.email || "").toLowerCase(),
        nick: extra.nick || user.displayName || String(user.email || "player").split("@")[0],
        publicId: publicId,
        balance: extra.balance != null ? extra.balance : 0,
        luckMul: extra.luckMul || 1,
        role: extra.role || "user",
        inventory: extra.inventory || [],
        bestDrop: extra.bestDrop || null,
        createdAt: Date.now()
      };
      await ref.set(data);
    }
    try {
      await db.collection("profiles").doc(data.email).set({
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

  window.ABD_FB = {
    auth: auth,
    db: db,
    createUserWithEmailAndPassword: function (_a, email, pass) {
      return auth.createUserWithEmailAndPassword(email, pass);
    },
    signInWithEmailAndPassword: function (_a, email, pass) {
      return auth.signInWithEmailAndPassword(email, pass);
    },
    signOut: function () { return auth.signOut(); },
    updateProfile: function (user, info) { return user.updateProfile(info); },
    onAuthStateChanged: function (_a, cb) { return auth.onAuthStateChanged(cb); },
    doc: doc,
    getDoc: getDoc,
    setDoc: setDoc,
    collection: collection,
    addDoc: addDoc,
    getDocs: getDocs,
    query: query,
    orderBy: orderBy,
    limit: limit,
    onSnapshot: onSnapshot,
    serverTimestamp: serverTimestamp,
    nextPublicId: nextPublicId,
    upsertUserDoc: upsertUserDoc
  };
  window.ABD_FIREBASE_READY = true;
})();
