(function () {
  const OWNER = window.ABD_OWNER_EMAIL;
  const LS_KEY = "abd_local_user";
  const LS_ORDERS = "abd_orders";
  const LS_LIVE = "abd_live_real";
  const LS_USERS = "abd_users_index";
  const LS_NEXT = "abd_next_public_id";

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

  const store = {
    user: null,
    live: [],
    orders: [],
    usersIndex: [],
    online: false,

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
        localStorage.setItem(LS_KEY, JSON.stringify(this.user));
        if (this.user.email) localStorage.setItem(packKey(this.user.email), JSON.stringify(this.user));
      }
      localStorage.setItem(LS_ORDERS, JSON.stringify(this.orders || []));
      localStorage.setItem(LS_LIVE, JSON.stringify((this.live || []).slice(0, 40)));
      localStorage.setItem(LS_USERS, JSON.stringify(this.usersIndex || []));
    },

    loadLocal() {
      try { this.user = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { this.user = null; }
      try { this.orders = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]"); } catch (e) { this.orders = []; }
      try { this.live = JSON.parse(localStorage.getItem(LS_LIVE) || "[]"); } catch (e) { this.live = []; }
      try { this.usersIndex = JSON.parse(localStorage.getItem(LS_USERS) || "[]"); } catch (e) { this.usersIndex = []; }
      if (this.user) {
        this.user.role = this.roleOf(this.user.email, this.user.role);
        this.ensurePublicId(this.user);
        if (this.user.luckMul == null) this.user.luckMul = 1;
      }
    },

    ensurePublicId(u) {
      if (!u) return;
      if (u.publicId) return u.publicId;
      const known = this.usersIndex.find((x) => x.email === u.email && x.publicId);
      if (known) {
        u.publicId = known.publicId;
        return u.publicId;
      }
      u.publicId = takeNextId();
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
      return this.usersIndex.find((x) => (x.email || "").toLowerCase() === q) ||
        (this.user && this.user.email === q ? this.user : null);
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
          inventory: this.user.inventory,
          bestDrop: this.user.bestDrop,
          updatedAt: fb.serverTimestamp()
        }, { merge: true });
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

    loginLocal(email, nick) {
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
        luckMul: saved.luckMul || (known && known.luckMul) || 1
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
      if (!email || amount <= 0) return 0;
      email = String(email).toLowerCase();
      if (this.user && this.user.email === email) {
        this.user.balance = (Number(this.user.balance) || 0) + amount;
        this.persistUser();
        return amount;
      }
      const pack = this.loadPack(email) || emptyUser({ email: email });
      pack.balance = (Number(pack.balance) || 0) + amount;
      this.savePack(email, pack);
      const row = this.usersIndex.find((x) => x.email === email);
      if (row) row.balance = pack.balance;
      this.saveLocal();
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
      return drop;
    }
  };

  store.loadLocal();
  store.live = (store.live || []).filter((d) => d && d.nick && d.at);
  window.ABD = store;
})();
