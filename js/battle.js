(function () {
  const LS = "abd_battles";
  function load() { try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch (e) { return []; } }
  function save(list) { localStorage.setItem(LS, JSON.stringify(list)); }
  function rollCase(caseDef) {
    const hit = window.pickWeighted(caseDef.items);
    return Object.assign({}, window.ABD_ITEMS[hit.id], { chance: hit.chance });
  }
  function avatar(nick) {
    const t = String(nick || "?").replace(/_/g, " ").slice(0, 2).toUpperCase();
    return `<span class="ava">${t}</span>`;
  }

  window.ABD_BATTLE = {
    current: null,

    listen() {
      const fb = window.ABD_FB;
      if (!fb || !fb.db || this._on) return;
      this._on = true;
      fb.db.collection("battles").onSnapshot((snap) => {
        const rows = [];
        snap.forEach((doc) => rows.push(Object.assign({ id: doc.id }, doc.data())));
        save(rows);
        const page = document.getElementById("battlePage");
        if (page && page.classList.contains("active") && !(this.current && this.current.status === "done")) this.render();
      }, function () {});
    },

    render() {
      const root = document.getElementById("battlePage");
      if (!root) return;
      this.listen();
      const u = window.ABD.user;
      const list = load().filter((b) => b.status === "wait").slice(0, 12);
      const cur = this.current;
      if (cur && (cur.status === "fight" || cur.status === "done")) {
        root.innerHTML = this.viewFight(cur);
        return;
      }
      root.innerHTML = `
        <div class="section-title"><h3>Битва кейсов</h3><span>победитель забирает весь дроп</span></div>
        <div class="panel">
          <p class="muted">Оба платят за кейс. У кого дроп дороже — забирает оба предмета.</p>
          <div class="field"><label>Кейс</label>
            <select id="btCase">${window.ABD_CASES.map((c) => `<option value="${c.id}">${c.name} · ${c.price} BC</option>`).join("")}</select>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn" id="btBot">Бой с ботом</button>
            <button class="btn purple" id="btCreate">Создать комнату</button>
          </div>
        </div>
        <div class="section-title" style="margin-top:18px"><h3>Открытые комнаты</h3></div>
        <div class="drop-grid">${list.map((b) => {
          const c = window.ABD_CASES.find((x) => x.id === b.caseId);
          return `<div class="inv-card">
            <b>${(c && c.name) || b.caseId}</b>
            <span class="price">${(c && c.price) || 0} BC</span>
            <p class="muted">${b.hostNick} ждёт соперника</p>
            <button class="btn" data-bt-join="${b.id}">Войти в бой</button>
          </div>`;
        }).join("") || "<p class='muted'>Комнат нет — создай свою или бей бота</p>"}</div>`;
    },

    viewFight(b) {
      const c = window.ABD_CASES.find((x) => x.id === b.caseId);
      const left = b.hostDrop;
      const right = b.guestDrop;
      const winL = b.winnerEmail && b.winnerEmail === b.hostEmail;
      const winR = b.winnerEmail && b.winnerEmail === b.guestEmail;
      return `
        <div class="section-title"><h3>Бой · ${(c && c.name) || ""}</h3>
          <button class="btn ghost" data-go="battle">К списку</button></div>
        <div class="battle-grid">
          <div class="panel ${winL ? "win-card" : ""}">
            ${avatar(b.hostNick)} <b>${b.hostNick}</b>
            ${left ? `<img src="${itemImg(left)}" alt=""><h4>${left.name}</h4><p>${formatAZ(left.price)}</p>` : "<p class='muted'>крутится...</p>"}
          </div>
          <div class="vs">VS</div>
          <div class="panel ${winR ? "win-card" : ""}">
            ${avatar(b.guestNick)} <b>${b.guestNick}</b>
            ${right ? `<img src="${itemImg(right)}" alt=""><h4>${right.name}</h4><p>${formatAZ(right.price)}</p>` : "<p class='muted'>крутится...</p>"}
          </div>
        </div>
        <p class="muted" style="text-align:center;margin-top:12px">${b.status === "done" ? ("Победитель: " + (winL ? b.hostNick : b.guestNick) + " забрал оба дропа") : "Считаем дроп..."}</p>`;
    },

    startBot() {
      const u = window.ABD.user;
      if (!u) return window.ABD.toast("Сначала войди");
      const caseDef = window.ABD_CASES.find((c) => c.id === (document.getElementById("btCase") || {}).value) || window.ABD_CASES[0];
      if ((u.balance || 0) < caseDef.price) return window.ABD.toast("Не хватает BC");
      window.ABD.creditAz(u.email, -caseDef.price);
      const hostDrop = rollCase(caseDef);
      const guestDrop = rollCase(caseDef);
      const winHost = (hostDrop.price || 0) >= (guestDrop.price || 0);
      const b = {
        id: "bt-" + Date.now(),
        caseId: caseDef.id,
        hostEmail: u.email,
        hostNick: u.nick || u.email,
        guestEmail: "bot",
        guestNick: "Бот",
        hostDrop: hostDrop,
        guestDrop: guestDrop,
        winnerEmail: winHost ? u.email : "bot",
        status: "done"
      };
      if (winHost) {
        window.ABD.giveItem(hostDrop.id, "Битва");
        window.ABD.giveItem(guestDrop.id, "Битва");
      }
      this.current = b;
      this.render();
      window.ABD_APP.refreshHeader();
      window.ABD.toast(winHost ? "Ты забрал оба дропа" : "Бот выиграл, дроп сгорел");
    },

    create() {
      const u = window.ABD.user;
      if (!u) return window.ABD.toast("Сначала войди");
      const caseDef = window.ABD_CASES.find((c) => c.id === (document.getElementById("btCase") || {}).value) || window.ABD_CASES[0];
      if ((u.balance || 0) < caseDef.price) return window.ABD.toast("Не хватает BC");
      window.ABD.creditAz(u.email, -caseDef.price);
      const b = {
        id: "bt-" + Date.now(),
        caseId: caseDef.id,
        price: caseDef.price,
        hostEmail: u.email,
        hostNick: u.nick || u.email,
        status: "wait"
      };
      const list = load();
      list.unshift(b);
      save(list);
      const fb = window.ABD_FB;
      if (fb && fb.db) fb.db.collection("battles").doc(b.id).set(b).catch(function () {});
      window.ABD.toast("Комната создана. Ждём второго игрока");
      window.ABD_APP.refreshHeader();
      this.render();
    },

    join(id) {
      const u = window.ABD.user;
      if (!u) return window.ABD.toast("Сначала войди");
      const list = load();
      const b = list.find((x) => x.id === id);
      if (!b || b.status !== "wait") return window.ABD.toast("Комната закрыта");
      if (b.hostEmail === u.email) return window.ABD.toast("Это твоя комната");
      const caseDef = window.ABD_CASES.find((c) => c.id === b.caseId);
      if (!caseDef) return;
      if ((u.balance || 0) < caseDef.price) return window.ABD.toast("Не хватает BC");
      window.ABD.creditAz(u.email, -caseDef.price);
      b.guestEmail = u.email;
      b.guestNick = u.nick || u.email;
      b.hostDrop = rollCase(caseDef);
      b.guestDrop = rollCase(caseDef);
      const winHost = (b.hostDrop.price || 0) >= (b.guestDrop.price || 0);
      b.winnerEmail = winHost ? b.hostEmail : b.guestEmail;
      b.status = "done";
      save(list);
      if (b.winnerEmail === u.email) {
        window.ABD.giveItem(b.hostDrop.id, "Битва");
        window.ABD.giveItem(b.guestDrop.id, "Битва");
      } else {
        window.ABD.giveItemToEmail(b.hostEmail, b.hostDrop.id, "Битва");
        window.ABD.giveItemToEmail(b.hostEmail, b.guestDrop.id, "Битва");
      }
      window.ABD.notify(b.hostEmail, "Битва", b.winnerEmail === b.hostEmail ? "Ты выиграл битву" : "Ты проиграл битву");
      const fb = window.ABD_FB;
      if (fb && fb.db) fb.db.collection("battles").doc(b.id).set(b).catch(function () {});
      this.current = b;
      window.ABD_APP.refreshHeader();
      this.render();
    }
  };
})();
