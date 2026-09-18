(function () {
  const LS = "abd_raffles";
  function avatar(nick) {
    const t = String(nick || "?").replace(/_/g, " ").slice(0, 2).toUpperCase();
    return `<span class="ava">${t}</span>`;
  }
  function prizeText(r) {
    if (r.prizeType === "bc") return formatAZ(r.amount || 0);
    const it = window.ABD_ITEMS[r.itemId];
    return it ? it.name : "Предмет";
  }
  function cache(list) {
    window.ABD.raffles = list || [];
    try { localStorage.setItem(LS, JSON.stringify(window.ABD.raffles)); } catch (e) {}
  }
  function load() {
    if (window.ABD.raffles && window.ABD.raffles.length) return window.ABD.raffles;
    try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch (e) { return []; }
  }
  async function push(row) {
    const fb = window.ABD_FB;
    if (fb && fb.db && row && row.id) {
      await fb.db.collection("raffles").doc(row.id).set(row, { merge: true });
    }
  }

  window.ABD_RAFFLE = {
    list() { return load(); },

    async pull() {
      const fb = window.ABD_FB;
      if (!fb || !fb.db) return load();
      try {
        const snap = await fb.db.collection("raffles").get();
        const rows = [];
        snap.forEach((doc) => {
          const d = doc.data() || {};
          d.id = d.id || doc.id;
          if (d.status !== "done") rows.push(d);
        });
        cache(rows);
      } catch (e) {}
      return load();
    },

    listen() {
      const fb = window.ABD_FB;
      if (!fb || !fb.db || this._on) return;
      this._on = true;
      fb.db.collection("raffles").onSnapshot((snap) => {
        const rows = [];
        snap.forEach((doc) => {
          const d = doc.data() || {};
          d.id = d.id || doc.id;
          if (d.status !== "done") rows.push(d);
        });
        cache(rows);
        const page = document.getElementById("rafflePage");
        if (page && page.classList.contains("active")) this.render();
      }, function () {});
    },

    create(title, prizeType, value, hours) {
      title = String(title || "").trim();
      if (!title) return "Напиши название";
      const endsAt = Date.now() + Math.max(0.1, Number(hours) || 1) * 3600 * 1000;
      const row = {
        id: "rf-" + Date.now(),
        title: title,
        prizeType: prizeType === "item" ? "item" : "bc",
        itemId: prizeType === "item" ? value : null,
        amount: prizeType === "item" ? 0 : Math.max(1, Number(value) || 0),
        endsAt: endsAt,
        users: [],
        status: "open"
      };
      const list = load();
      list.unshift(row);
      cache(list);
      push(row).catch(function () {});
      return null;
    },

    render() {
      const root = document.getElementById("rafflePage");
      if (!root) return;
      this.listen();
      this.tick();
      const open = load().filter((r) => r.status === "open");
      root.innerHTML = `
        <div class="section-title"><h3>Розыгрыши</h3><span>${open.length} активных</span></div>
        <div class="drop-grid">${open.map((r) => `
          <article class="panel raffle-card" data-rf-open="${r.id}">
            <h4>${r.title}</h4>
            <p>Приз: <b>${prizeText(r)}</b></p>
            <p class="muted">Итоги: ${new Date(r.endsAt).toLocaleString("ru-RU")}</p>
            <div class="ava-row">${(r.users || []).slice(0, 8).map((p) => avatar(p.nick)).join("")}</div>
            <p>${(r.users || []).length} участников</p>
          </article>`).join("") || "<p class='muted'>Сейчас розыгрышей нет</p>"}</div>
        <div id="raffleDetail"></div>`;
      this.pull().then(() => {
        if (load().length && root.dataset.drawn !== String(load().length)) {
          root.dataset.drawn = String(load().length);
          this.render();
        }
      });
    },

    open(id) {
      this.tick();
      const r = load().find((x) => x.id === id);
      const box = document.getElementById("raffleDetail");
      if (!box) return;
      if (!r || r.status !== "open") {
        this.render();
        return;
      }
      const left = Math.max(0, r.endsAt - Date.now());
      const mm = Math.floor(left / 60000);
      box.innerHTML = `
        <div class="panel" style="margin-top:16px">
          <h3>${r.title}</h3>
          <p>На что розыгрыш: <b>${prizeText(r)}</b></p>
          <p>Итоги: ${new Date(r.endsAt).toLocaleString("ru-RU")} · осталось ${mm} мин</p>
          <p>Участников: <b>${(r.users || []).length}</b></p>
          <div class="ava-row">${(r.users || []).map((p) => `<div class="ava-wrap">${avatar(p.nick)}<small>${p.nick}</small></div>`).join("") || "<span class='muted'>Пока никого</span>"}</div>
          <button class="btn purple" data-rf-join="${r.id}" style="margin-top:12px">Участвовать</button>
        </div>`;
    },

    async join(id) {
      const u = window.ABD.user;
      if (!u) return window.ABD.toast("Сначала войди");
      await this.pull();
      const list = load();
      const r = list.find((x) => x.id === id);
      if (!r || r.status !== "open") return window.ABD.toast("Розыгрыш уже завершён");
      r.users = r.users || [];
      if (r.users.some((p) => p.email === u.email)) return window.ABD.toast("Ты уже в розыгрыше");
      r.users.push({ email: u.email, nick: u.nick || u.email });
      cache(list);
      await push(r);
      window.ABD.toast("Ты в деле");
      this.render();
      this.open(id);
    },

    finish(r) {
      if (!r || r.status !== "open") return;
      const users = r.users || [];
      r.status = "done";
      if (users.length) {
        const w = users[Math.floor(Math.random() * users.length)];
        r.winner = w;
        if (r.prizeType === "item" && r.itemId) window.ABD.giveItemToEmail(w.email, r.itemId, "Розыгрыш");
        else window.ABD.creditAz(w.email, r.amount || 0);
        window.ABD.notify(w.email, "Розыгрыш", "Ты выиграл: " + prizeText(r));
      }
      cache(load().filter((x) => x.id !== r.id));
      const fb = window.ABD_FB;
      if (fb && fb.db) fb.db.collection("raffles").doc(r.id).set(r, { merge: true }).catch(function () {});
    },

    tick() {
      load().filter((r) => r.status === "open" && Date.now() >= r.endsAt).forEach((r) => this.finish(r));
    }
  };
})();
