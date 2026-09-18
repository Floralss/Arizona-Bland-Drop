(function () {
  const OWNER = window.ABD_OWNER_EMAIL;
  const LS_KEY = "abd_local_user";
  const LS_ORDERS = "abd_orders";
  const LS_LIVE = "abd_live_real";
  const LS_USERS = "abd_users_index";
  const LS_NEXT = "abd_next_public_id";
  const LS_INBOX = "abd_inbox";

  function emptyUser(extra) {
    return Object.assign({
      uid: "local",
      email: "",
      nick: "",
      publicId: null,
      balance: 0,
      luckMul: 1,
      role: "user",
      inventory: [],
      bestDrop: null,
      createdAt: Date.now()
    }, extra || {});
  }

  function takeNextId() {
    let n = Number(localStorage.getItem(LS_NEXT) || "1");
    if (!n || n < 1) n = 1;
    localStorage.setItem(LS_NEXT, String(n + 1));
    return n;
  }

  function packKey(email) {
    return "abd_inv_" + email;
  }

  function mergeKeep(a, b) {
    a = a || {};
    b = b || {};
    const out = Object.assign({}, a, b);
    out.email = String(b.email || a.email || "").toLowerCase();
    out.uid = (b.uid && String(b.uid).indexOf("demo-") !== 0 && b.uid !== "local") ? b.uid : (a.uid || b.uid);
    out.nick = b.nick || a.nick || "";
    out.publicId = a.publicId || b.publicId || null;
    const balA = Number(a.balance || 0);
    const balB = Number(b.balance || 0);
    const atA = Number(a.balAt || a.updatedAt || 0);
    const atB = Number(b.balAt || b.updatedAt || 0);
    if (balB > balA) out.balance = balB;
    else if (atB >= atA) out.balance = balB;
    else out.balance = balA;
    out.balAt = Math.max(atA, atB, Date.now());
    out.totalDeposited = Math.max(Number(a.totalDeposited || 0), Number(b.totalDeposited || 0));
    out.luckMul = a.luckMul || b.luckMul || 1;
    out.role = a.role === "owner" || b.role === "owner" ? "owner" : (a.role === "worker" || b.role === "worker" ? "worker" : (b.role || a.role || "user"));
    const inv = [];
    const seen = {};
    (a.inventory || []).concat(b.inventory || []).forEach((it) => {
      if (!it) return;
      const k = it.uid || (it.itemId + ":" + it.at + ":" + it.name);
      if (seen[k]) return;
      seen[k] = 1;
      inv.push(it);
    });
    out.inventory = inv;
    const ba = a.bestDrop || null;
    const bb = b.bestDrop || null;
    out.bestDrop = ba && bb ? ((ba.price || 0) >= (bb.price || 0) ? ba : bb) : (ba || bb);
    out.depBonusPct = b.depBonusPct != null ? b.depBonusPct : a.depBonusPct;
    out.depGiftCase = b.depGiftCase || a.depGiftCase || "";
    return out;
  }

  const store = {
    user: null,
    live: [],
    orders: [],
    usersIndex: [],
    inbox: {},
    online: false,

    mergeKeep: mergeKeep,

    toast(msg) {
      const el = document.getElementById("toast");
      if (!el) return alert(msg);
      el.textContent = msg;
      el.classList.remove("hidden");
      clearTimeout(store._t);
      store._t = setTimeout(() => el.classList.add("hidden"), 2800);
    },

    roleOf(email, currentRole) {
      if ((email || "").toLowerCase() === OWNER.toLowerCase()) return "owner";
      return currentRole || "user";
    },

    saveLocal() {
      if (this.user) {
        this.user.balAt = Date.now();
        localStorage.setItem(LS_KEY, JSON.stringify(this.user));
        if (this.user.email) localStorage.setItem(packKey(this.user.email), JSON.stringify(this.user));
      }
      localStorage.setItem(LS_ORDERS, JSON.stringify(this.orders || []));
      localStorage.setItem(LS_LIVE, JSON.stringify((this.live || []).slice(0, 40)));
      localStorage.setItem(LS_USERS, JSON.stringify(this.usersIndex || []));
      localStorage.setItem(LS_INBOX, JSON.stringify(this.inbox || {}));
    },

    loadLocal() {
      this.user = null;
      localStorage.removeItem(LS_KEY);
      try { this.orders = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]"); } catch (e) { this.orders = []; }
      try { this.live = JSON.parse(localStorage.getItem(LS_LIVE) || "[]"); } catch (e) { this.live = []; }
      try { this.usersIndex = JSON.parse(localStorage.getItem(LS_USERS) || "[]"); } catch (e) { this.usersIndex = []; }
      try { this.inbox = JSON.parse(localStorage.getItem(LS_INBOX) || "{}"); } catch (e) { this.inbox = {}; }
      if (this.user) {
        if (this.user.email) {
          const pack = this.loadPack(this.user.email);
          if (pack) this.user = mergeKeep(pack, this.user);
        }
        this.user.role = this.roleOf(this.user.email, this.user.role);
        this.ensurePublicId(this.user);
        if (this.user.luckMul == null) this.user.luckMul = 1;
      }
    },

    idMap() {
      try { return JSON.parse(localStorage.getItem("abd_id_map") || "{}"); } catch (e) { return {}; }
    },

    saveIdMap(map) {
      localStorage.setItem("abd_id_map", JSON.stringify(map || {}));
    },

    ensurePublicId(u) {
      if (!u || !u.email) return;
      if (u.publicId) {
        const map = this.idMap();
        map[String(u.email).toLowerCase()] = Number(u.publicId);
        this.saveIdMap(map);
        return u.publicId;
      }
      const email = String(u.email).toLowerCase();
      const map = this.idMap();
      if (map[email]) {
        u.publicId = Number(map[email]);
        return u.publicId;
      }
      const pack = this.loadPack(email);
      if (pack && pack.publicId) {
        u.publicId = Number(pack.publicId);
        map[email] = u.publicId;
        this.saveIdMap(map);
        return u.publicId;
      }
      const known = this.usersIndex.find((x) => (x.email || "").toLowerCase() === email && x.publicId);
      if (known) {
        u.publicId = Number(known.publicId);
        map[email] = u.publicId;
        this.saveIdMap(map);
        return u.publicId;
      }
      u.publicId = takeNextId();
      map[email] = u.publicId;
      this.saveIdMap(map);
      return u.publicId;
    },

    upsertIndex(u) {
      if (!u || !u.email) return;
      this.ensurePublicId(u);
      const row = {
        email: u.email,
        nick: u.nick || "",
        role: u.role,
        balance: u.balance,
        uid: u.uid,
        publicId: u.publicId,
        luckMul: u.luckMul || 1
      };
      const i = this.usersIndex.findIndex((x) => x.email === u.email || x.publicId === u.publicId);
      if (i >= 0) this.usersIndex[i] = Object.assign({}, this.usersIndex[i], row);
      else this.usersIndex.push(row);
    },

    findTarget(q) {
      q = String(q || "").trim().toLowerCase().replace(/^#/, "");
      if (!q) return null;
      if (/^\d+$/.test(q)) {
        const id = Number(q);
        return this.usersIndex.find((x) => Number(x.publicId) === id) ||
          (this.user && Number(this.user.publicId) === id ? this.user : null);
      }
      return this.usersIndex.find((x) => (x.email || "").toLowerCase() === q || (x.nick || "").toLowerCase() === q) ||
        (this.user && ((this.user.email || "").toLowerCase() === q || (this.user.nick || "").toLowerCase() === q) ? this.user : null);
    },

    async findTargetAsync(q) {
      const local = this.findTarget(q);
      if (local && local.email) return local;
      const fb = window.ABD_FB;
      if (!fb || !fb.db) return local;
      q = String(q || "").trim().toLowerCase().replace(/^#/, "");
      if (!q) return null;
      try {
        const dirAll = await fb.db.collection("directory").limit(400).get();
        const rows = [];
        dirAll.forEach((doc) => rows.push(doc.data() || {}));
        rows.forEach((d) => { if (d.email) this.upsertIndex(d); });
        if (/^\d+$/.test(q)) {
          const hit = rows.find((d) => Number(d.publicId) === Number(q));
          if (hit) return hit;
        } else {
          const hit = rows.find((d) =>
            (d.email || "").toLowerCase() === q ||
            (d.nick || "").toLowerCase() === q
          );
          if (hit) return hit;
        }
        if (q.indexOf("@") >= 0) {
          const p = await fb.db.collection("profiles").doc(q).get();
          if (p.exists) {
            const d = p.data();
            this.upsertIndex(d);
            return d;
          }
          const us = await fb.db.collection("users").where("email", "==", q).limit(1).get();
          if (!us.empty) {
            const d = us.docs[0].data();
            this.upsertIndex(d);
            return d;
          }
        } else if (/^\d+$/.test(q)) {
          const id = Number(q);
          const us = await fb.db.collection("users").where("publicId", "==", id).limit(1).get();
          if (!us.empty) {
            const d = us.docs[0].data();
            this.upsertIndex(d);
            return d;
          }
          const ps = await fb.db.collection("profiles").where("publicId", "==", id).limit(1).get();
          if (!ps.empty) {
            const d = ps.docs[0].data();
            this.upsertIndex(d);
            return d;
          }
        } else {
          const us = await fb.db.collection("users").where("nick", "==", q).limit(1).get();
          if (!us.empty) {
            const d = us.docs[0].data();
            this.upsertIndex(d);
            return d;
          }
        }
      } catch (e) {
        console.warn("findTargetAsync", e && e.message);
      }
      return local;
    },

    async pullPlayers() {
      const fb = window.ABD_FB;
      if (!fb || !fb.db) return;
      try {
        const snap = await fb.db.collection("directory").limit(400).get();
        snap.forEach((doc) => {
          const d = doc.data() || {};
          if (d.email) this.upsertIndex(d);
        });
      } catch (e) {}
      try {
        const snap = await fb.db.collection("profiles").limit(200).get();
        snap.forEach((doc) => {
          const d = doc.data() || {};
          if (d.email) this.upsertIndex(d);
        });
      } catch (e) {}
      try {
        const snap = await fb.db.collection("users").limit(200).get();
        snap.forEach((doc) => {
          const d = doc.data() || {};
          if (d.email || d.uid) this.upsertIndex(Object.assign({ email: d.email || doc.id }, d));
        });
      } catch (e) {}
      this.saveLocal();
    },

    loadPack(email) {
      try { return JSON.parse(localStorage.getItem(packKey(email)) || "null"); } catch (e) { return null; }
    },

    savePack(email, data) {
      localStorage.setItem(packKey(email), JSON.stringify(data));
    },

    async persistUser() {
      this.saveLocal();
      this.upsertIndex(this.user);
      const fb = window.ABD_FB;
      if (!fb || !this.user || this.user.uid === "local" || String(this.user.uid).indexOf("demo-") === 0) return;
      try {
        await fb.setDoc(fb.doc(fb.db, "users", this.user.uid), {
          email: this.user.email,
          nick: this.user.nick,
          publicId: this.user.publicId,
          balance: this.user.balance,
          luckMul: this.user.luckMul || 1,
          role: this.user.role,
          inventory: this.user.inventory || [],
          bestDrop: this.user.bestDrop || null,
          totalDeposited: this.user.totalDeposited || 0,
          balAt: this.user.balAt || Date.now(),
          updatedAt: fb.serverTimestamp()
        }, { merge: true });
        await fb.db.collection("directory").doc(String(this.user.email).toLowerCase()).set({
          uid: this.user.uid,
          email: this.user.email,
          nick: this.user.nick,
          publicId: this.user.publicId,
          balance: this.user.balance,
          role: this.user.role,
          totalDeposited: this.user.totalDeposited || 0
        }, { merge: true });
        if (this.user.email) {
          await fb.setDoc(fb.doc(fb.db, "profiles", String(this.user.email).toLowerCase()), {
            uid: this.user.uid,
            email: this.user.email,
            nick: this.user.nick,
            publicId: this.user.publicId,
            balance: this.user.balance,
            role: this.user.role
          }, { merge: true });
        }
      } catch (e) {
        console.warn("firebase persist skip", e.message);
      }
    },

    async addOrder(order) {
      order.id = order.id || ("ord-" + Date.now());
      order.createdAt = Date.now();
      if (!order.status) order.status = "new";
      this.orders.unshift(order);
      this.saveLocal();
      const fb = window.ABD_FB;
      if (fb) {
        try { await fb.addDoc(fb.collection(fb.db, "orders"), order); } catch (e) {}
      }
    },

    addLive(drop) {
      this.live.unshift(drop);
      this.live = this.live.slice(0, 40);
      this.saveLocal();
      const fb = window.ABD_FB;
      if (fb) fb.addDoc(fb.collection(fb.db, "liveDrops"), drop).catch(() => {});
    },

    passHash(email, pass) {
      return btoa(unescape(encodeURIComponent(String(email || "").toLowerCase() + "|" + String(pass || ""))));
    },

    findByLogin(login) {
      login = String(login || "").trim().toLowerCase();
      if (!login) return null;
      const byEmail = this.usersIndex.find((u) => (u.email || "").toLowerCase() === login);
      if (byEmail) return byEmail;
      const byNick = this.usersIndex.find((u) => (u.nick || "").toLowerCase() === login);
      if (byNick) return byNick;
      if (login.indexOf("@") >= 0) {
        const pack = this.loadPack(login);
        if (pack) return pack;
      }
      return null;
    },

    registerLocal() {
      this.toast("Только Firebase. Локальные аккаунты выключены");
      return null;
    },
    registerLocalOff(email, nick, pass, refNick) {
      email = (email || "").trim().toLowerCase();
      nick = (nick || "").trim();
      if (!email || !pass || !nick) return { ok: false, err: "Заполни почту, ник и пароль" };
      if (pass.length < 6) return { ok: false, err: "Пароль минимум 6 символов" };
      const exists = this.loadPack(email) || this.usersIndex.find((u) => u.email === email);
      if (exists && exists.passHash) return { ok: false, err: "Эта почта уже занята — войди" };
      this.loginLocal(email, nick);
      this.user.passHash = this.passHash(email, pass);
      this.user.refNick = (refNick || "").trim() || null;
      this.savePack(email, this.user);
      this.upsertIndex(this.user);
      this.saveLocal();
      if (this.user.refNick) {
        const ref = this.usersIndex.find((u) => (u.nick || "").toLowerCase() === this.user.refNick.toLowerCase());
        if (ref && ref.email) this.notify(ref.email, "Реферал", "По твоей рефке зарегистрировался " + nick);
      }
      return { ok: true };
    },

    loginWithPass() {
      return { ok: false, err: "Только вход через Firebase" };
    },
    loginWithPassOff(login, pass) {
      const row = this.findByLogin(login);
      if (!row || !row.email) return { ok: false, err: "Аккаунт не найден" };
      const pack = this.loadPack(row.email) || row;
      const hash = this.passHash(pack.email || row.email, pass);
      if (pack.passHash && pack.passHash !== hash) return { ok: false, err: "Неверный пароль" };
      if (!pack.passHash && row.passHash && row.passHash !== hash) return { ok: false, err: "Неверный пароль" };
      this.loginLocal(row.email, pack.nick || row.nick);
      if (!this.user.passHash) {
        this.user.passHash = hash;
        this.savePack(this.user.email, this.user);
      }
      return { ok: true };
    },

    loginLocal() {
      this.toast("Только Firebase. Локальный вход выключен");
      return null;
    },
    loginLocalOff(email, nick) {
      email = (email || "").trim().toLowerCase();
      const known = this.usersIndex.find((u) => u.email === email);
      const saved = this.loadPack(email) || {};
      this.user = emptyUser({
        uid: "demo-" + btoa(unescape(encodeURIComponent(email))).replace(/=/g, "").slice(0, 12),
        email,
        nick: nick || saved.nick || (known && known.nick) || email.split("@")[0],
        role: this.roleOf(email, saved.role || (known && known.role)),
        balance: saved.balance != null ? saved.balance : 0,
        inventory: saved.inventory || [],
        bestDrop: saved.bestDrop || null,
        publicId: saved.publicId || (known && known.publicId) || null,
        luckMul: saved.luckMul || (known && known.luckMul) || 1,
        passHash: saved.passHash || null,
        refNick: saved.refNick || null
      });
      this.ensurePublicId(this.user);
      this.upsertIndex(this.user);
      this.saveLocal();
    },

    logout() {
      if (this.user && this.user.email) this.savePack(this.user.email, this.user);
      this.user = null;
      localStorage.removeItem(LS_KEY);
    },

    giveItem(itemId, fromCase) {
      const item = window.ABD_ITEMS[itemId];
      if (!item || !this.user) return null;
      const drop = {
        uid: "it-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
        itemId: item.id,
        name: item.name,
        file: item.file,
        type: item.type,
        rarity: item.rarity,
        price: item.price,
        fromCase: fromCase || null,
        at: Date.now()
      };
      this.user.inventory.unshift(drop);
      if (!this.user.bestDrop || drop.price > this.user.bestDrop.price) this.user.bestDrop = drop;
      this.persistUser();
      return drop;
    },

    parseDeposit(order) {
      const raw = String((order && order.amount) || "").replace(/\s/g, "").replace(/,/g, "");
      const n = Number(raw);
      if (order && order.rawType === "game") {
        if (!n || n < 1e9) return 0;
        return Math.floor(n / 1e9) * 10000;
      }
      if (!n || n <= 0) return 0;
      return Math.floor(n);
    },

    creditAz(email, amount) {
      amount = Math.floor(Number(amount) || 0);
      if (!email || !amount) return 0;
      email = String(email).toLowerCase();
      if (this.user && String(this.user.email || "").toLowerCase() === email) {
        this.user.balance = Math.max(0, (Number(this.user.balance) || 0) + amount);
        this.saveLocal();
        this.upsertIndex(this.user);
        this.persistUser();
      } else {
        const pack = this.loadPack(email) || emptyUser({ email: email });
        pack.balance = Math.max(0, (Number(pack.balance) || 0) + amount);
        this.savePack(email, pack);
        const row = this.usersIndex.find((x) => (x.email || "").toLowerCase() === email);
        if (row) row.balance = pack.balance;
        this.saveLocal();
      }
      const fb = window.ABD_FB;
      if (fb && fb.db) {
        const row = this.usersIndex.find((x) => (x.email || "").toLowerCase() === email);
        const inc = fb.increment ? fb.increment(amount) : amount;
        fb.db.collection("profiles").doc(email).set({
          email: email,
          balance: inc,
          updatedAt: Date.now()
        }, { merge: true }).catch(function () {});
        if (row && row.uid && String(row.uid).indexOf("demo-") !== 0) {
          fb.db.collection("users").doc(row.uid).set({
            email: email,
            balance: inc,
            updatedAt: Date.now()
          }, { merge: true }).catch(function () {});
        }
      }
      return amount;
    },

    setLuck(email, mul) {
      mul = Number(mul) || 1;
      email = String(email || "").toLowerCase();
      if (this.user && this.user.email === email) {
        this.user.luckMul = mul;
        this.persistUser();
      }
      const pack = this.loadPack(email);
      if (pack) {
        pack.luckMul = mul;
        this.savePack(email, pack);
      }
      const row = this.usersIndex.find((x) => x.email === email);
      if (row) row.luckMul = mul;
      this.saveLocal();
    },

    giveItemToEmail(email, itemId, fromCase) {
      const item = window.ABD_ITEMS[itemId];
      if (!item || !email) return null;
      if (this.user && this.user.email === email) return this.giveItem(itemId, fromCase);
      const pack = this.loadPack(email) || emptyUser({ email });
      const drop = {
        uid: "it-adm-" + Date.now(),
        itemId: item.id, name: item.name, file: item.file, type: item.type,
        rarity: item.rarity, price: item.price, fromCase: fromCase || "Админ", at: Date.now()
      };
      pack.inventory = pack.inventory || [];
      pack.inventory.unshift(drop);
      this.savePack(email, pack);
      const fb = window.ABD_FB;
      if (fb && fb.db) {
        fb.db.collection("gifts").add({
          email: String(email).toLowerCase(),
          itemId: item.id,
          drop: drop,
          at: Date.now()
        }).catch(function () {});
        const row = this.usersIndex.find((x) => (x.email || "").toLowerCase() === String(email).toLowerCase());
        if (row && row.uid && String(row.uid).indexOf("demo-") !== 0) {
          fb.db.collection("users").doc(row.uid).get().then(function (s) {
            const inv = ((s.exists && s.data().inventory) || []).slice();
            inv.unshift(drop);
            return fb.db.collection("users").doc(row.uid).set({ inventory: inv, updatedAt: Date.now() }, { merge: true });
          }).catch(function () {});
        }
      }
      return drop;
    },

    notify(email, title, text) {
      email = String(email || "").toLowerCase();
      if (!email) return;
      if (!this.inbox[email]) this.inbox[email] = [];
      this.inbox[email].unshift({
        id: "n-" + Date.now() + "-" + Math.floor(Math.random() * 999),
        title: title || "Сообщение",
        text: text || "",
        at: Date.now(),
        read: false
      });
      this.inbox[email] = this.inbox[email].slice(0, 40);
      this.saveLocal();
      const fb = window.ABD_FB;
      if (fb) {
        try {
          fb.addDoc(fb.collection(fb.db, "inbox"), {
            email: email, title: title, text: text, at: Date.now(), read: false
          });
        } catch (e) {}
      }
    },

    notifyAll(title, text) {
      const seen = {};
      (this.usersIndex || []).forEach((u) => {
        if (u && u.email && !seen[u.email]) {
          seen[u.email] = 1;
          this.notify(u.email, title, text);
        }
      });
      if (this.user && this.user.email && !seen[this.user.email]) {
        this.notify(this.user.email, title, text);
      }
    },

    myInbox() {
      const email = this.user && this.user.email;
      if (!email) return [];
      return this.inbox[String(email).toLowerCase()] || [];
    },

    unreadCount() {
      return this.myInbox().filter((n) => !n.read).length;
    },

    markRead() {
      const email = this.user && this.user.email;
      if (!email) return;
      const list = this.inbox[String(email).toLowerCase()] || [];
      list.forEach((n) => { n.read = true; });
      this.saveLocal();
    },

    removeOrder(id) {
      this.orders = (this.orders || []).filter((o) => o.id !== id);
      this.saveLocal();
    },

    listAccounts() {
      const map = {};
      (this.usersIndex || []).forEach((u) => {
        if (!u || !u.email) return;
        map[u.email] = Object.assign({}, u);
      });
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || k.indexOf("abd_inv_") !== 0) continue;
        try {
          const pack = JSON.parse(localStorage.getItem(k) || "null");
          if (pack && pack.email) {
            map[pack.email] = Object.assign({}, map[pack.email] || {}, pack);
          }
        } catch (e) {}
      }
      if (this.user && this.user.email) {
        map[this.user.email] = Object.assign({}, map[this.user.email] || {}, this.user);
      }
      return Object.keys(map).map((email) => map[email]).sort((a, b) => Number(a.publicId || 0) - Number(b.publicId || 0));
    },

    async deleteAccount(email) {
      email = String(email || "").toLowerCase();
      if (!email) return false;
      const row = this.usersIndex.find((x) => (x.email || "").toLowerCase() === email) || this.loadPack(email) || {};
      localStorage.removeItem("abd_inv_" + email);
      this.usersIndex = (this.usersIndex || []).filter((x) => (x.email || "").toLowerCase() !== email);
      if (this.inbox) delete this.inbox[email];
      this.orders = (this.orders || []).filter((o) => (o.email || "").toLowerCase() !== email);
      if (this.user && (this.user.email || "").toLowerCase() === email) {
        this.user = null;
        localStorage.removeItem("abd_local_user");
      }
      this.saveLocal();
      const fb = window.ABD_FB;
      if (fb) {
        try {
          await fb.setDoc(fb.doc(fb.db, "profiles", email), { deleted: true, email: email }, { merge: true });
        } catch (e) {}
        try {
          if (row.uid && String(row.uid).indexOf("demo-") !== 0 && row.uid !== "local") {
            await fb.setDoc(fb.doc(fb.db, "users", row.uid), { deleted: true, email: email }, { merge: true });
          }
        } catch (e) {}
      }
      return true;
    },

    resetAllBalances() {
      (this.usersIndex || []).forEach((u) => {
        if (!u || !u.email) return;
        u.balance = 0;
        const pack = this.loadPack(u.email);
        if (pack) {
          pack.balance = 0;
          this.savePack(u.email, pack);
        }
      });
      if (this.user) {
        this.user.balance = 0;
        this.persistUser();
      }
      this.saveLocal();
      this.notifyAll("Баланс обнулён", "Админ сбросил баланс всем игрокам.");
    }
  };

  store.loadLocal();
  store.live = (store.live || []).filter((d) => d && d.nick && d.at);
  window.ABD = store;
})();
