(function () {
  const pages = ["home", "case", "upgrade", "profile", "admin", "fair", "wheel", "battle", "raffle"];

  function $(id) { return document.getElementById(id); }

  function go(name) {
    pages.forEach((p) => {
      const el = $(p + "Page");
      if (el) el.classList.toggle("active", p === name);
    });
    document.querySelectorAll("[data-go]").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("data-go") === name);
    });
    if (name === "upgrade") window.ABD_UP.render();
    if (name === "profile") renderProfile();
    if (name === "admin") window.ABD_ADMIN.render();
    if (name === "wheel") window.ABD_WHEEL.render();
    if (name === "battle") window.ABD_BATTLE.render();
    if (name === "raffle") window.ABD_RAFFLE.render();
    if (name === "case" && window.ABD_CASES_UI.current) window.ABD_CASES_UI.renderPage();
    history.replaceState(null, "", "#" + name);
  }

  function renderLive() {
    const track = $("liveTrack");
    if (!track) return;
    const drops = (window.ABD.live || []).filter((d) => d && d.name && d.nick);
    if (!drops.length) {
      track.innerHTML = "<div class='live-empty'>Ждём первый дроп — здесь появятся реальные открытия игроков</div>";
      return;
    }
    const loop = drops.concat(drops);
    const moving = drops.length > 8 ? " moving" : "";
    track.innerHTML = `<div class="live-row${moving}">${loop.map((d) => `
      <div class="live-chip r-${d.rarity || "common"}" title="${d.nick || ""}">
        <img src="${itemImg(d)}" alt="">
        <b>${d.name}</b>
        <small>${d.nick || ""}</small>
      </div>`).join("")}</div>`;
  }


  function refreshBell() {
    const dot = $("bellDot");
    if (!dot) return;
    const n = window.ABD.unreadCount ? window.ABD.unreadCount() : 0;
    if (n > 0) {
      dot.classList.remove("hidden");
      dot.textContent = n > 9 ? "9+" : String(n);
    } else {
      dot.classList.add("hidden");
    }
  }

  function toggleBell() {
    const panel = $("bellPanel");
    if (!panel) return;
    const open = panel.classList.contains("hidden");
    if (!open) {
      panel.classList.add("hidden");
      return;
    }
    const list = window.ABD.myInbox ? window.ABD.myInbox() : [];
    panel.classList.remove("hidden");
    panel.innerHTML = "<div class='bell-head'>Уведомления</div>" + (list.length ? list.map((n) => (
      "<div class='bell-item " + (n.read ? "" : "unread") + "'><b>" + n.title + "</b><p>" + n.text + "</p><small>" + new Date(n.at).toLocaleString("ru-RU") + "</small></div>"
    )).join("") : "<div class='bell-item'><p>Пока пусто</p></div>");
    window.ABD.markRead();
    refreshBell();
  }

  function refreshHeader() {
    const u = window.ABD.user;
    $("authButtons").classList.toggle("hidden", !!u);
    $("userBox").classList.toggle("hidden", !u);
    if (u) {
      $("hdrBal").textContent = formatAZ(u.balance);
      $("hdrNick").textContent = (u.nick || u.email) + (u.publicId ? " · #" + u.publicId : "");
      $("navAdmin").classList.toggle("hidden", u.role !== "owner" && u.role !== "worker");
    } else {
      $("navAdmin").classList.add("hidden");
    }
    refreshBell();
  }

  function renderProfile() {
    const u = window.ABD.user;
    const box = $("profileBody");
    if (!u) {
      box.innerHTML = `
        <div class="panel" style="max-width:420px">
          <h3>Профиль</h3>
          <p style="color:var(--mute);margin:8px 0 14px">Сначала войди в аккаунт.</p>
          <button class="btn purple" data-open-auth="login">Войти</button>
        </div>`;
      return;
    }
    const best = u.bestDrop;
    box.innerHTML = `
      <div class="profile-top">
        <div class="panel">
          <h3>${u.nick || "Без ника"}</h3>
          <p style="color:var(--mute)">${u.email}</p>
          <p style="margin:8px 0">ID аккаунта: <span class="badge">#${u.publicId || "—"}</span> · роль: <span class="badge">${u.role}</span>${(u.luckMul||1)>1 ? " · удача x"+u.luckMul : ""}</p>
          <p>Баланс: <b style="color:var(--gold)">${formatAZ(u.balance)}</b></p>
          <p style="color:var(--mute);font-size:12px;margin:6px 0">Firebase UID: ${u.uid && String(u.uid).indexOf("demo-")===0 ? "НЕТ, это локальный аккаунт" : (u.uid || "—")}</p>
          ${u.uid && String(u.uid).indexOf("demo-")===0 ? `
          <div class="field"><label>Пароль чтобы записать этот акк в Firebase</label><input id="bindPass" type="password" placeholder="минимум 6 символов"></div>
          <button class="btn purple" id="bindFb" type="button">Записать в базу</button>` : ""}
          <div class="field" style="margin-top:12px"><label>Ник в игре</label>
            <input id="nickEdit" value="${u.nick || ""}">
          </div>
          <button class="btn" id="saveNick">Сохранить ник</button>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn" data-open-dep>Пополнение</button>
            <button class="btn ghost" id="btnLogout">Выйти</button>
          </div>
        </div>
        <div class="panel">
          <h3>Лучший дроп</h3>
          ${best ? `<div class="best-drop">
            <img src="${itemImg(best)}" alt="">
            <h4 style="margin-top:8px">${best.name}</h4>
            <p>${ABD_TYPE[best.type] || best.type} · с кейса «${best.fromCase || "—"}»</p>
            <p style="color:var(--gold)">${formatAZ(best.price)}</p>
          </div>` : "<p style='color:var(--mute)'>Пока пусто — открой первый кейс.</p>"}
        </div>
      </div>
      <div class="panel" style="margin:12px 0">
        <h3>Промокод</h3>
        <div class="field"><input id="promoCode" placeholder="BLAND2026"></div>
        <button class="btn" id="promoGo">Активировать</button>
      </div>
      <div class="section-title"><h3>Инвентарь</h3><span>${u.inventory.length} предметов</span></div>
      <div class="inv-pick">${u.inventory.map((d) => `
        <div class="inv-card">
          <img src="${itemImg(d)}" alt="">
          <b>${d.name}</b>
          <span class="price">${formatAZ(d.price)}</span>
          <button class="btn ghost" style="margin-top:8px;width:100%" data-wd="${d.uid}">Вывести</button>
        </div>`).join("") || "<p style='color:var(--mute)'>Инвентарь пуст</p>"}</div>
    `;
  }

  function openDeposit() {
    $("depModal").classList.remove("hidden");
  }

  function sendDeposit() {
    const u = window.ABD.user;
    if (!u) {
      window.ABD.toast("Сначала войди");
      return;
    }
    const btn = $("sendDep");
    if (btn && btn.dataset.busy === "1") return;
    const type = $("depType").value;
    const amount = ($("depAmount").value || "").trim();
    const comment = ($("depComment").value || "").trim();
    if (!amount) {
      window.ABD.toast("Напиши сумму или название предмета");
      return;
    }
    let detail = type + " · " + amount;
    if (type === "game") {
      const n = Number(String(amount).replace(/\s/g, "").replace(/,/g, ""));
      if (!n || n < 1e9) {
        window.ABD.toast("Минимум игровой валюты — 1 млрд = 10 000 BC");
        return;
      }
      detail = "Игровая валюта " + n.toLocaleString("ru-RU") + " → " + formatAZ(Math.floor(n / 1e9) * 10000);
    }
    if (type === "az" || type === "game") {
      const az = window.ABD.parseDeposit({ rawType: type, amount: amount });
      if (!az) {
        window.ABD.toast(type === "game" ? "Минимум 1 млрд игровой валюты" : "Укажи сумму BC числом");
        return;
      }
      detail = type === "game" ? detail : ("BC " + formatAZ(az));
    }
    const order = {
      kind: "deposit",
      email: u.email,
      nick: u.nick,
      publicId: u.publicId,
      detail: detail + (comment ? " · " + comment : ""),
      rawType: type,
      amount: amount,
      status: "new",
      credited: false
    };
    if (btn) {
      btn.dataset.busy = "1";
      btn.textContent = "Заявка отправлена";
    }
    window.ABD.addOrder(order);
    if (document.getElementById("profilePage") && !document.getElementById("profilePage").classList.contains("hidden")) {
      renderProfile();
    }
    $("depAmount").value = "";
    $("depComment").value = "";
    $("depModal").classList.add("hidden");
    window.ABD.toast("Заявка отправлена. Баланс пополнится после подтверждения админа");
    setTimeout(() => {
      if (btn) {
        btn.dataset.busy = "0";
        btn.textContent = "Создать заявку";
      }
    }, 800);
  }

  async function withdraw(uid) {
    const u = window.ABD.user;
    const item = u.inventory.find((x) => x.uid === uid);
    if (!item) return;
    await window.ABD.addOrder({
      kind: "withdraw",
      email: u.email,
      nick: u.nick,
      detail: item.name + " (" + item.full + ")",
      itemId: item.itemId,
      invUid: uid
    });
    window.ABD.toast("Заявка на вывод создана. Скин/предмет выдадут на игровой аккаунт.");
  }

  function fbError(e) {
    const code = (e && e.code) || "";
    if (code === "auth/operation-not-allowed") return "В Firebase не включена почта: Authentication → Sign-in method → Email/Password";
    if (code === "auth/unauthorized-domain") return "Добавь домен сайта в Authentication → Settings → Authorized domains";
    if (code === "auth/email-already-in-use") return "Эта почта уже зарегистрирована — жми Войти";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "Неверная почта или пароль";
    if (code === "auth/weak-password") return "Пароль минимум 6 символов";
    if (code === "auth/invalid-email") return "Некорректная почта";
    return (e && (e.message || e.code)) || "Ошибка Firebase";
  }

  async function bindLocalToFirebase() {
    const u = window.ABD.user;
    const pass = ($("bindPass") && $("bindPass").value) || "";
    if (!u || !u.email) return window.ABD.toast("Нет почты на аккаунте");
    if (pass.length < 6) return window.ABD.toast("Пароль минимум 6 символов");
    const fb = await waitFirebase(5000);
    if (!fb) return window.ABD.toast("Firebase не загрузился");
    try {
      let cred;
      try {
        cred = await fb.createUserWithEmailAndPassword(fb.auth, u.email, pass);
      } catch (e) {
        if (e && e.code === "auth/email-already-in-use") {
          cred = await fb.signInWithEmailAndPassword(fb.auth, u.email, pass);
        } else {
          throw e;
        }
      }
      const profile = await fb.upsertUserDoc(cred.user, {
        nick: u.nick,
        balance: u.balance || 0,
        inventory: u.inventory || [],
        bestDrop: u.bestDrop || null,
        role: window.ABD.roleOf(u.email, u.role),
        publicId: u.publicId,
        luckMul: u.luckMul || 1
      });
      window.ABD.user = Object.assign({}, u, profile, { uid: cred.user.uid, email: u.email });
      window.ABD.saveLocal();
      refreshHeader();
      renderProfile();
      window.ABD.toast("Аккаунт записан в Firebase");
    } catch (e) {
      window.ABD.toast(fbError(e));
    }
  }

  async function waitFirebase(ms) {
    const until = Date.now() + (ms || 5000);
    while (!window.ABD_FB && Date.now() < until) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return window.ABD_FB;
  }

  function showAuth(mode) {
    const modal = $("authModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    const login = $("authLogin");
    const reg = $("authReg");
    const title = $("authTitle");
    if (mode === "reg") {
      login.classList.add("hidden");
      reg.classList.remove("hidden");
      if (title) title.textContent = "Регистрация";
    } else {
      reg.classList.add("hidden");
      login.classList.remove("hidden");
      if (title) title.textContent = "Вход";
    }
  }

  function closeAuth() {
    const modal = $("authModal");
    if (modal) modal.classList.add("hidden");
  }

  async function tryFirebaseAuth(mode) {
    if (mode === "reg") {
      const email = ($("regEmail").value || "").trim().toLowerCase();
      const nick = ($("regNick").value || "").trim();
      const pass = $("regPass").value || "";
      const pass2 = $("regPass2").value || "";
      const ref = ($("regRef").value || "").trim();
      if (!email || !nick || !pass) return window.ABD.toast("Заполни почту, ник и пароль");
      if (pass !== pass2) return window.ABD.toast("Пароли не совпадают");
      const fb = await waitFirebase(5000);
      if (!fb) return window.ABD.toast("Firebase не загрузился. Локальные аккаунты отключены");
      try {
        const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, pass);
        if (nick) {
          try { await fb.updateProfile(cred.user, { displayName: nick }); } catch (e) {}
        }
        let profile = {
          uid: cred.user.uid,
          email: email,
          nick: nick,
          balance: 0,
          role: window.ABD.roleOf(email, "user"),
          inventory: [],
          bestDrop: null,
          refNick: ref || null
        };
        try {
          profile = Object.assign(profile, await fb.upsertUserDoc(cred.user, profile));
        } catch (e) {
          console.warn("profile write", e);
        }
        window.ABD.user = Object.assign({}, profile, { uid: cred.user.uid, email: email, nick: nick });
        window.ABD.ensurePublicId(window.ABD.user);
        window.ABD.saveLocal();
        closeAuth();
        refreshHeader();
        renderProfile();
        go("profile");
        window.ABD.toast("Добро пожаловать, " + nick);
      } catch (e) {
        if (e && e.code === "auth/email-already-in-use") {
          try {
            const cred = await fb.signInWithEmailAndPassword(fb.auth, email, pass);
            const profile = await fb.upsertUserDoc(cred.user, { nick: nick });
            window.ABD.user = Object.assign({}, profile, { uid: cred.user.uid, email: email });
            window.ABD.saveLocal();
            closeAuth();
            refreshHeader();
            renderProfile();
            go("profile");
            window.ABD.toast("Снова вошли в аккаунт");
            return;
          } catch (e2) {
            window.ABD.toast(fbError(e2));
            return;
          }
        }
        window.ABD.toast(fbError(e));
      }
      return;
    }

    const login = ($("loginEmail").value || "").trim();
    const pass = $("loginPass").value || "";
    if (!login || !pass) return window.ABD.toast("Напиши почту/ник и пароль");
    const fb = await waitFirebase(5000);
    if (!fb) return window.ABD.toast("Firebase не загрузился. Локальный вход отключён");
    const email = login.indexOf("@") >= 0 ? login.toLowerCase() : null;
    if (!email) return window.ABD.toast("Для входа нужна почта, не только ник");
    try {
      const cred = await fb.signInWithEmailAndPassword(fb.auth, email, pass);
      const profile = await fb.upsertUserDoc(cred.user, {});
      window.ABD.user = Object.assign({}, profile, { uid: cred.user.uid, email: (cred.user.email || email).toLowerCase() });
      window.ABD.saveLocal();
      closeAuth();
      refreshHeader();
      renderProfile();
      go("profile");
      window.ABD.toast("Вход выполнен");
    } catch (e) {
      window.ABD.toast(fbError(e));
    }
  }

  function bind() {
    document.body.addEventListener("submit", (e) => {
      if (e.target && (e.target.id === "loginForm" || e.target.id === "regForm")) {
        e.preventDefault();
        tryFirebaseAuth(e.target.id === "regForm" ? "reg" : "login");
      }
    });
    document.body.addEventListener("click", (e) => {
      const goEl = e.target.closest("[data-go]");
      if (goEl) { e.preventDefault(); go(goEl.getAttribute("data-go")); }
      const caseEl = e.target.closest("[data-open-case]");
      if (caseEl) window.ABD_CASES_UI.open(caseEl.getAttribute("data-open-case"));
      if (e.target.closest("[data-close-case]")) $("caseModal").classList.add("hidden");
      if (e.target.id === "spinCase") window.ABD_CASES_UI.spin();
      if (e.target.id === "spinWheel") window.ABD_WHEEL.spin();
      const from = e.target.closest("[data-up-from]");
      if (from) window.ABD_UP.pickFrom(from.getAttribute("data-up-from"));
      const to = e.target.closest("[data-up-to]");
      if (to) window.ABD_UP.pickTo(to.getAttribute("data-up-to"));
      if (e.target.id === "doUpgrade") window.ABD_UP.run();
      const multi = e.target.closest("[data-multi]");
      if (multi) window.ABD_UP.setMulti(multi.getAttribute("data-multi"));
      if (e.target.id === "admLuckOn") window.ABD_ADMIN.luck($("admEmail").value, $("admLuck").value);
      if (e.target.id === "admLuckOff") window.ABD_ADMIN.luck($("admEmail").value, 1);
      if (e.target.id === "admCastBtn") window.ABD_ADMIN.broadcast();
      if (e.target.id === "admResetBal") window.ABD_ADMIN.resetBalances();
      if (e.target.id === "promoGo") {
        window.ABD_PROMO.redeem(($("promoCode") && $("promoCode").value) || "").then((err) => {
          window.ABD.toast(err || "Промокод активирован");
          refreshHeader();
          renderProfile();
        });
      }
      if (e.target.id === "prMake") {
        const type = $("prType").value;
        const val = type === "item" ? $("prItem").value : $("prVal").value;
        const err = window.ABD_PROMO.create($("prCode").value, ($("prKind")&&$("prKind").value)||"free", type, val, $("prMax").value, { bonusPct: ($("prPct")&&$("prPct").value)||0, giftCase: ($("prGift")&&$("prGift").value)||"" });
        window.ABD.toast(err || "Промокод создан");
        window.ABD_ADMIN.render();
      }
      if (e.target.id === "rfMake") {
        const type = $("rfType").value;
        const val = type === "item" ? $("rfItem").value : $("rfBc").value;
        const err = window.ABD_RAFFLE.create($("rfTitle").value, type, val, $("rfHours").value);
        window.ABD.toast(err || "Розыгрыш создан");
      }
      if (e.target.id === "btBot") window.ABD_BATTLE.startBot();
      if (e.target.id === "btCreate") window.ABD_BATTLE.create();
      const joinBt = e.target.closest("[data-bt-join]");
      if (joinBt) window.ABD_BATTLE.join(joinBt.getAttribute("data-bt-join"));
      const rfOpen = e.target.closest("[data-rf-open]");
      if (rfOpen) window.ABD_RAFFLE.open(rfOpen.getAttribute("data-rf-open"));
      const rfJoin = e.target.closest("[data-rf-join]");
      if (rfJoin) window.ABD_RAFFLE.join(rfJoin.getAttribute("data-rf-join"));
      if (e.target.id === "admShowDel") window.ABD_ADMIN.toggleDelList();
      const del = e.target.closest("[data-del-acc]");
      if (del) window.ABD_ADMIN.wipe(del.getAttribute("data-del-acc"));
      const pick = e.target.closest("[data-pick-user]");
      if (pick && $("admEmail")) $("admEmail").value = pick.getAttribute("data-pick-user");
      const qtyBtn = e.target.closest("[data-spin-qty]");
      if (qtyBtn && window.ABD_CASES_UI) {
        window.ABD_CASES_UI.qty = Number(qtyBtn.getAttribute("data-spin-qty")) || 1;
        window.ABD_CASES_UI.renderPage();
      }
      if (e.target.id === "spinFast") window.ABD_CASES_UI.fast = !!e.target.checked;
      if (e.target.id === "bellBtn" || e.target.closest("#bellBtn")) toggleBell();
      if (e.target.closest("[data-open-auth]")) {
        e.preventDefault();
        showAuth(e.target.closest("[data-open-auth]").getAttribute("data-open-auth") || "login");
      }
      if (e.target.closest("[data-close-auth]")) closeAuth();
      if (e.target.id === "toReg") showAuth("reg");
      if (e.target.id === "toLogin") showAuth("login");
      if (e.target.id === "btnLogin") tryFirebaseAuth("login");
      if (e.target.id === "btnReg") tryFirebaseAuth("reg");
      if (e.target.id === "bindFb") bindLocalToFirebase();
      if (e.target.id === "btnLogout") {
        if (window.ABD_FB) window.ABD_FB.signOut(window.ABD_FB.auth).catch(() => {});
        window.ABD.logout();
        refreshHeader();
        renderProfile();
      }
      if (e.target.id === "saveNick") {
        window.ABD.user.nick = $("nickEdit").value.trim();
        window.ABD.persistUser();
        refreshHeader();
        window.ABD.toast("Ник сохранён");
      }
      if (e.target.closest("[data-open-dep]")) openDeposit();
      if (e.target.closest("[data-close-dep]")) $("depModal").classList.add("hidden");
      if (e.target.id === "sendDep" || e.target.closest("#sendDep")) sendDeposit();
      const wd = e.target.closest("[data-wd]");
      if (wd) withdraw(wd.getAttribute("data-wd"));
      const ord = e.target.closest("[data-ord]");
      if (ord) window.ABD_ADMIN.setStatus(ord.getAttribute("data-ord"), ord.getAttribute("data-st"));
      if (e.target.id === "admSetRole") window.ABD_ADMIN.setRole($("admEmail").value, $("admRole").value);
      if (e.target.id === "admGiveMoney") window.ABD_ADMIN.giveMoney($("admEmail").value, $("admMoney").value);
      if (e.target.id === "admGiveItem") window.ABD_ADMIN.giveItem($("admEmail").value, $("admItem").value);
    });

    document.body.addEventListener("input", (e) => {
      if (e.target.id === "upSearch") window.ABD_UP.setFilter(e.target.value);
    });

    $("depType").addEventListener("change", () => {
      const t = $("depType").value;
      $("depHint").textContent = t === "game"
        ? "Минимум 1 000 000 000 игровой валюты = 10 000 BC на сайте."
        : t === "az"
          ? "BC коины начислят после подтверждения в игре."
          : "Укажи название предмета. Работник выдаст / снимет его в игре.";
    });
  }

  function hookFirebase() {
    const fb = window.ABD_FB;
    if (!fb) {
      setTimeout(hookFirebase, 250);
      return;
    }
    try {
      const q = fb.query(fb.collection(fb.db, "liveDrops"), fb.orderBy("at", "desc"), fb.limit(30));
      fb.onSnapshot(q, (snap) => {
        const rows = [];
        snap.forEach((doc) => rows.push(doc.data()));
        if (rows.length) {
          window.ABD.live = rows;
          renderLive();
        }
      });
    } catch (e) {}
    fb.onAuthStateChanged(fb.auth, async (user) => {
      if (!user) return;
      const email = (user.email || "").toLowerCase();
      let profile = {
        uid: user.uid,
        email: email,
        nick: user.displayName || email.split("@")[0],
        balance: 0,
        role: window.ABD.roleOf(email, "user"),
        inventory: [],
        bestDrop: null
      };
      try {
        const saved = await fb.upsertUserDoc(user, profile);
        if (saved) profile = Object.assign(profile, saved);
      } catch (e) {
        console.warn("firestore user", e && e.message);
      }
      profile.role = window.ABD.roleOf(profile.email, profile.role);
      if (window.ABD.user && window.ABD.user.email === email && window.ABD.user.publicId) {
        profile.publicId = window.ABD.user.publicId;
      }
      window.ABD.user = Object.assign({}, profile, { uid: user.uid, email: email, publicId: profile.publicId || (window.ABD.user && window.ABD.user.publicId) });
      window.ABD.ensurePublicId(window.ABD.user);
      window.ABD.saveLocal();
      refreshHeader();
      closeAuth();
      if ($("profilePage") && $("profilePage").classList.contains("active")) renderProfile();
      try {
        fb.db.collection("users").doc(user.uid).onSnapshot((s) => {
          if (!s.exists || !window.ABD.user) return;
          const d = s.data() || {};
          if (d.balance != null) window.ABD.user.balance = d.balance;
          if (d.inventory) window.ABD.user.inventory = d.inventory;
          if (d.nick) window.ABD.user.nick = d.nick;
          window.ABD.saveLocal();
          refreshHeader();
          if ($("profilePage") && $("profilePage").classList.contains("active")) renderProfile();
        });
      } catch (e) {}
      try {
        fb.db.collection("gifts").where("email", "==", email).onSnapshot((snap) => {
          if (!window.ABD.user) return;
          snap.forEach((doc) => {
            const g = doc.data() || {};
            if (!g.itemId && !g.drop) return;
            const exists = (window.ABD.user.inventory || []).some((x) => x.uid === (g.drop && g.drop.uid));
            if (!exists && g.drop) {
              window.ABD.user.inventory = window.ABD.user.inventory || [];
              window.ABD.user.inventory.unshift(g.drop);
            }
          });
          window.ABD.saveLocal();
          if ($("profilePage") && $("profilePage").classList.contains("active")) renderProfile();
        });
      } catch (e) {}
    });
  }

  function sessionId() {
    let s = sessionStorage.getItem("abd_sid");
    if (!s) {
      s = "s" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("abd_sid", s);
    }
    return s;
  }

  function paintOnline(n) {
    const el = $("onlineCount");
    if (el) el.textContent = String(Math.max(1, n || 1));
  }

  function countLocalPresence() {
    const now = Date.now();
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf("abd_presence_") !== 0) continue;
      try {
        const rec = JSON.parse(localStorage.getItem(k));
        if (rec && now - rec.at < 120000) n++;
      } catch (e) {}
    }
    return n;
  }

  async function beatPresence() {
    const sid = sessionId();
    const u = window.ABD.user;
    const rec = { at: Date.now(), nick: (u && (u.nick || u.email)) || "guest", sid: sid };
    localStorage.setItem("abd_presence_" + sid, JSON.stringify(rec));
    paintOnline(countLocalPresence());
    const fb = window.ABD_FB;
    if (!fb) return;
    try {
      await fb.setDoc(fb.doc(fb.db, "presence", sid), {
        at: Date.now(),
        nick: rec.nick,
        email: u && u.email || null
      });
      const snap = await fb.getDocs(fb.collection(fb.db, "presence"));
      let n = 0;
      const cut = Date.now() - 120000;
      snap.forEach((d) => {
        const row = d.data() || {};
        if (Number(row.at) > cut) n++;
      });
      paintOnline(n);
    } catch (e) {}
  }

  window.ABD_APP = { go, renderLive, refreshHeader, renderProfile, refreshBell };

  document.addEventListener("DOMContentLoaded", () => {
    window.ABD_CASES_UI.renderGrid();
    renderLive();
    refreshHeader();
    bind();
    hookFirebase();
    const hash = (location.hash || "#home").slice(1);
    if (hash === "case" && !window.ABD_CASES_UI.current) go("home");
    else go(pages.includes(hash) ? hash : "home");
    beatPresence();
    setInterval(beatPresence, 20000);
  });
})();
