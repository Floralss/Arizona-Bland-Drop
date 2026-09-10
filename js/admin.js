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
              <div class="field"><label>ID игрока или почта</label><input id="admEmail" placeholder="1"></div>
              <div class="field"><label>Роль</label>
                <select id="admRole"><option value="user">Игрок</option><option value="worker">Работник</option><option value="owner">Владелец</option></select>
              </div>
              <button class="btn" id="admSetRole">Назначить роль</button>
              <div class="field" style="margin-top:12px"><label>Начислить AZ</label><input id="admMoney" type="number" value="10000"></div>
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
              <h4 style="margin:18px 0 8px">Игроки</h4>
              <table class="table">
                <tr><th>ID</th><th>Ник</th><th>Роль</th><th>Удача</th><th>Баланс</th></tr>
                ${users.map((x) => `<tr><td>#${x.publicId || "—"}</td><td>${x.nick || x.email}</td><td>${x.role}</td><td>x${x.luckMul || 1}</td><td>${formatAZ(x.balance || 0)}</td></tr>`).join("")}
              </table>
            ` : `<h3>Работник</h3><p class="muted">Подтверждай заявки кнопкой «Зачислить» — AZ упадут игроку.</p>`}
          </div>
        </div>`;
    },

    setStatus(id, status) {
      const o = window.ABD.orders.find((x) => x.id === id);
      if (!o) return;
      if (status === "done" && o.kind === "deposit" && !o.credited) {
        const az = window.ABD.parseDeposit(o);
        if (o.rawType === "az" || o.rawType === "game") {
          if (!az) {
            window.ABD.toast("Не понял сумму. Для валюты минимум 1 млрд.");
            return;
          }
          window.ABD.creditAz(o.email, az);
          o.credited = true;
          window.ABD.toast("Зачислено " + formatAZ(az) + " на #" + ((window.ABD.findTarget(o.email) || {}).publicId || "?"));
        } else {
          window.ABD.toast("Предмет принят. AZ не начисляются — это депозит вещи.");
        }
      }
      o.status = status;
      window.ABD.saveLocal();
      this.render();
      window.ABD_APP.refreshHeader();
    },

    setRole(q, role) {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      const t = targetOf(q);
      if (!t) return window.ABD.toast("Игрок не найден. Сначала пусть войдёт.");
      t.role = role;
      if (window.ABD.user && window.ABD.user.email === t.email) window.ABD.user.role = role;
      const pack = window.ABD.loadPack(t.email);
      if (pack) { pack.role = role; window.ABD.savePack(t.email, pack); }
      window.ABD.saveLocal();
      this.render();
      window.ABD.toast("Роль обновлена для #" + t.publicId);
    },

    giveMoney(q, amount) {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      const t = targetOf(q);
      if (!t) return window.ABD.toast("Нет такого ID. Игрок должен один раз войти.");
      window.ABD.creditAz(t.email, amount);
      this.render();
      window.ABD_APP.refreshHeader();
      window.ABD.toast("+" + formatAZ(amount) + " игроку #" + t.publicId);
    },

    giveItem(q, itemId) {
      if (!can("owner")) return window.ABD.toast("Только владелец");
      const t = targetOf(q);
      if (!t) return window.ABD.toast("Нет такого ID");
      window.ABD.giveItemToEmail(t.email, itemId, "Админ-выдача");
      this.render();
      window.ABD.toast("Предмет выдан #" + t.publicId);
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
