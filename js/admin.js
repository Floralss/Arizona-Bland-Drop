(function () {
  function can(min) {
    const u = window.ABD.user;
    if (!u) return false;
    const rank = { user: 0, worker: 1, owner: 2 };
    return (rank[u.role] || 0) >= (rank[min] || 0);
  }

  function targetOf(q) {
    return window.ABD.findTarget(q);
  }

  window.ABD_ADMIN = {
    can,
    render() {
      if (!this._pulled && window.ABD.pullPlayers) {
        this._pulled = true;
        window.ABD.pullPlayers().then(() => this.render()).catch(() => {});
      }
      const root = document.getElementById("adminPage");
      const u = window.ABD.user;
      if (!u || (u.role !== "owner" && u.role !== "worker")) {
        root.innerHTML = "<div class='panel'><h3>Нет доступа</h3></div>";
        return;
      }
      const orders = window.ABD.orders || [];
      const users = window.ABD.usersIndex || [];
      root.innerHTML = `
        <div class="section-title"><h3>Админ-панель</h3><span>роль: ${u.role}</span></div>
        <div class="admin-grid">
          <div class="panel">
            <h3>Заявки</h3>
            <table class="table">
              <tr><th>Тип</th><th>ID / игрок</th><th>Что</th><th>Статус</th><th></th></tr>
              ${orders.map((o) => {
                const t = window.ABD.usersIndex.find((x) => x.email === o.email);
                return `<tr>
                <td>${o.kind}</td>
                <td>#${(t && t.publicId) || "—"} ${o.nick || ""}<br><small>${o.email}</small></td>
                <td>${o.detail}${o.credited ? " · зачислено" : ""}</td>
                <td><span class="badge">${o.status}</span></td>
                <td>
                  <button class="btn" data-ord="${o.id}" data-st="done">Зачислить</button>
                  <button class="btn ghost" data-ord="${o.id}" data-st="reject">Отмена</button>
                </td>
              </tr>`;
              }).join("") || "<tr><td colspan='5'>Заявок нет</td></tr>"}
            </table>
          </div>
          <div class="panel">
            ${u.role === "owner" ? `
              <h3>Выдача по ID</h3>
              <p class="muted">Первый аккаунт = ID 1, следующий 2 и так дальше.</p>
              <div class="field"><label>ID / почта / ник</label><input id="admEmail" placeholder="4 или почта"></div>
              <div class="ava-row" id="admPeople">${(window.ABD.usersIndex || []).map((x) =>
                `<button class="btn ghost" type="button" data-pick-user="${x.email}">#${x.publicId || "?"} ${x.nick || x.email}</button>`
              ).join("") || "<span class='muted'>список подтянется из базы</span>"}</div>
              <div class="field"><label>Роль</label>
                <select id="admRole"><option value="user">Игрок</option><option value="worker">Работник</option><option value="owner">Владелец</option></select>
              </div>
              <button class="btn" id="admSetRole">Назначить роль</button>
              <div class="field" style="margin-top:12px"><label>Начислить BC</label><input id="admMoney" type="number" value="10000"></div>
              <button class="btn" id="admGiveMoney">Выдать коины</button>
              <div class="field" style="margin-top:12px"><label>Предмет</label>
                <select id="admItem">${Object.values(window.ABD_ITEMS).map((it) => `<option value="${it.id}">${it.name}</option>`).join("")}</select>
              </div>
              <button class="btn" id="admGiveItem">Выдать предмет</button>
              <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
              <h3>Подкрутка кейса</h3>
              <p class="muted">Редкие предметы из кейса выпадают чаще в N раз.</p>
              <div class="field"><label>Множитель</label>
                <select id="admLuck">
                  <option value="2">2x</option>
                  <option value="4">4x</option>
                  <option value="8">8x</option>
                  <option value="10">10x</option>
                </select>
              </div>
              <button class="btn" id="admLuckOn">Включить подкрутку</button>
              <button class="btn ghost" id="admLuckOff">Убрать подкрутку</button>
              <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
              <h3>Рассылка</h3>
              <div class="field"><label>Сообщение всем в колокольчик</label>
                <textarea id="admCast" rows="3" placeholder="Текст новости"></textarea>
              </div>
              <button class="btn" id="admCastBtn">Отправить рассылку</button>
              <div class="field" style="margin-top:14px">
                <button class="btn ghost" id="admResetBal">Обнулить всем баланс</button>
              </div>
              <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
              <h3>Промокоды</h3>
              <div class="field"><label>Код</label><input id="prCode" placeholder="START100"></div>
              <div class="field"><label>Вид промо</label>
                <select id="prKind">
                  <option value="free">1. Бесплатный — без условий</option>
                  <option value="dep1000">2. После пополнения от 1000 BC</option>
                  <option value="depbonus">3. Бонус к пополнению</option>
                </select>
              </div>
              <div class="field"><label>Награда (для вида 1 и 2)</label>
                <select id="prType"><option value="bc">BC</option><option value="item">Предмет</option></select>
                <input id="prVal" placeholder="1000">
                <select id="prItem">${Object.values(window.ABD_ITEMS).map((it) => `<option value="${it.id}">${it.name}</option>`).join("")}</select>
              </div>
              <div class="field"><label>Вид 3: процент к пополнению</label><input id="prPct" type="number" value="25"></div>
              <div class="field"><label>Вид 3: кейс в подарок</label>
                <select id="prGift"><option value="">без кейса</option>${window.ABD_CASES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select>
              </div>
              <div class="field"><label>Сколько активаций</label><input id="prMax" type="number" value="50"></div>
              <button class="btn" id="prMake">Создать промокод</button>
              <div class="muted" style="margin:8px 0">${(window.ABD_PROMO ? window.ABD_PROMO.list() : []).map((p) => p.code + " · " + (p.kind || "free") + " · " + p.used + "/" + p.max).join("<br>") || "пока нет"}</div>
              <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
              <h3>Розыгрыш</h3>
              <div class="field"><label>Название</label><input id="rfTitle" placeholder="Розыгрыш G63"></div>
              <div class="field"><label>Приз</label>
                <select id="rfType"><option value="item">Предмет</option><option value="bc">BC</option></select>
              </div>
              <div class="field">
                <select id="rfItem">${Object.values(window.ABD_ITEMS).map((it) => `<option value="${it.id}">${it.name}</option>`).join("")}</select>
                <input id="rfBc" type="number" value="5000" placeholder="BC">
              </div>
              <div class="field"><label>Через сколько часов итоги</label><input id="rfHours" type="number" value="24"></div>
              <button class="btn" id="rfMake">Создать розыгрыш</button>
              <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
              <h3>Удалить аккаунт</h3>
              <button class="btn" id="admShowDel">Открыть список игроков</button>
              <div id="admDelBox" class="hidden" style="margin-top:10px">
                <table class="table">
                  <tr><th>Ник в игре</th><th>ID</th><th>Почта</th><th></th></tr>
                  ${(window.ABD.listAccounts ? window.ABD.listAccounts() : users).map((x) => `<tr>
                    <td>${x.nick || "без ника"}</td>
                    <td>#${x.publicId || "—"}</td>
                    <td><small>${x.email || ""}</small></td>
                    <td><button class="btn ghost" data-del-acc="${x.email}">Удалить</button></td>
                  </tr>`).join("")}
                </table>
              </div>
              <h4 style="margin:18px 0 8px">Игроки</h4>
              <table class="table">
                <tr><th>ID</th><th>Ник</th><th>Роль</th><th>Удача</th><th>Баланс</th></tr>
                ${users.map((x) => `<tr><td>#${x.publicId || "—"}</td><td>${x.nick || x.email}</td><td>${x.role}</td><td>x${x.luckMul || 1}</td><td>${formatAZ(x.balance || 0)}</td></tr>`).join("")}
              </table>
            ` : `<h3>Работник</h3><p class="muted">Подтверждай заявки кнопкой «Зачислить» — BC упадут игроку.</p>`}
          </div>
        </div>`;
    },

    setStatus(id, status) {
      const o = window.ABD.orders.find((x) => x.id === id);
      if (!o) return;
      if (status === "reject") {
        window.ABD.notify(o.email, "Заявка отклонена", "Ваша заявка была отклонена");
        window.ABD.removeOrder(id);
        window.ABD.toast("Заявка удалена, игроку ушло сообщение");
        this.render();
        if (window.ABD_APP.refreshBell) window.ABD_APP.refreshBell();
        return;
      }
      if (status === "done" && o.kind === "deposit" && !o.credited) {
        const az = window.ABD.parseDeposit(o);
        if (o.rawType === "az" || o.rawType === "game") {
          if (!az) {
            window.ABD.toast("Не понял сумму. Для валюты минимум 1 млрд.");
            return;
          }
          window.ABD.creditAz(o.email, az);
          const pack = window.ABD.loadPack(o.email) || {};
          pack.totalDeposited = Number(pack.totalDeposited || 0) + az;
          let extra = 0;
          if (Number(pack.depBonusPct || 0) > 0) {
            extra = Math.floor(az * Number(pack.depBonusPct) / 100);
            if (extra) window.ABD.creditAz(o.email, extra);
            pack.depBonusPct = 0;
          }
          if (pack.depGiftCase) {
            const cc = window.ABD_CASES.find((x) => x.id === pack.depGiftCase);
            if (cc) {
              const hit = window.pickWeighted(cc.items);
              window.ABD.giveItemToEmail(o.email, hit.id, "Подарок к пополнению");
            }
            pack.depGiftCase = "";
          }
          window.ABD.savePack(o.email, pack);
          o.credited = true;
          window.ABD.toast("Зачислено " + formatAZ(az + extra) + (extra ? " с бонусом" : ""));
        } else {
          window.ABD.toast("Предмет принят. BC не начисляются — это депозит вещи.");
        }
      }
      o.status = status;
      window.ABD.saveLocal();
      this.render();
      window.ABD_APP.refreshHeader();
    },

    async setRole(q, role) {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      const t = await window.ABD.findTargetAsync(q);
      if (!t || !t.email) return window.ABD.toast("Игрок не найден в базе.");
      t.role = role;
      if (window.ABD.user && window.ABD.user.email === t.email) window.ABD.user.role = role;
      const pack = window.ABD.loadPack(t.email);
      if (pack) { pack.role = role; window.ABD.savePack(t.email, pack); }
      window.ABD.saveLocal();
      this.render();
      window.ABD.toast("Роль обновлена для #" + t.publicId);
    },

    async giveMoney(q, amount) {
      amount = Math.floor(Number(amount) || 0);
      if (!amount) return window.ABD.toast("Укажи сумму");
      const key = String(q) + ":" + amount;
      if (this._payLock === key) return;
      this._payLock = key;
      setTimeout(() => { if (this._payLock === key) this._payLock = null; }, 1500);
      if (!can("owner")) return window.ABD.toast("Только владелец");
      let t = await window.ABD.findTargetAsync(q);
      const raw = String(q || "").trim().toLowerCase();
      if ((!t || !t.email) && raw.indexOf("@") >= 0) t = { email: raw, nick: raw, publicId: "?" };
      if (!t || !t.email) return window.ABD.toast("Игрок не найден. Напиши почту целиком, не только ID");
      window.ABD.creditAz(t.email, amount);
      window.ABD.notify(t.email, "Начисление", "Админ выдал " + formatAZ(amount));
      this.render();
      window.ABD_APP.refreshHeader();
      window.ABD.toast("+" + formatAZ(amount) + " → " + (t.nick || t.email));
    },

    async giveItem(q, itemId) {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      const t = await window.ABD.findTargetAsync(q);
      if (!t || !t.email) return window.ABD.toast("Игрок не найден в базе. Проверь почту или ID");
      window.ABD.giveItemToEmail(t.email, itemId, "Админ-выдача");
      window.ABD.notify(t.email, "Предмет", "Админ выдал предмет");
      this.render();
      window.ABD.toast("Предмет выдан " + (t.nick || t.email));
    },

    toggleDelList() {
      const box = document.getElementById("admDelBox");
      if (!box) return;
      box.classList.toggle("hidden");
    },

    async wipe(email) {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      if (!email) return;
      if (!confirm("Удалить аккаунт " + email + " навсегда?")) return;
      const self = window.ABD.user && window.ABD.user.email === email;
      await window.ABD.deleteAccount(email);
      window.ABD.toast("Аккаунт удалён");
      if (self) {
        window.ABD_APP.refreshHeader();
        window.ABD_APP.go("home");
        return;
      }
      this.render();
    },

    broadcast() {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      const text = (document.getElementById("admCast").value || "").trim();
      if (!text) return window.ABD.toast("Напиши текст");
      window.ABD.notifyAll("Новость", text);
      document.getElementById("admCast").value = "";
      window.ABD.toast("Рассылка ушла всем");
      if (window.ABD_APP.refreshBell) window.ABD_APP.refreshBell();
    },

    resetBalances() {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      if (!confirm("Обнулить баланс всем игрокам?")) return;
      window.ABD.resetAllBalances();
      this.render();
      window.ABD_APP.refreshHeader();
      window.ABD.toast("Балансы обнулены");
    },

    luck(q, mul) {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      const t = targetOf(q);
      if (!t) return window.ABD.toast("Нет такого ID");
      window.ABD.setLuck(t.email, mul);
      this.render();
      window.ABD.toast(mul <= 1 ? "Подкрутка снята с #" + t.publicId : "Подкрутка x" + mul + " на #" + t.publicId);
    }
  };
})();
