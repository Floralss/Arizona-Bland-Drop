(function () {
  const state = { from: null, to: null, multi: 2, busy: false, filter: "" };

  function chance() {
    if (!state.from || !state.to) return 0;
    const want = state.to.price;
    const have = state.from.price;
    if (want <= have) return 85;
    const raw = (have / want) * 78;
    return Math.max(1, Math.min(75, Math.round(raw * 10) / 10));
  }

  function nearestByMulti() {
    if (!state.from) return;
    const targetVal = state.from.price * state.multi;
    const list = Object.values(window.ABD_ITEMS).filter((x) => x.id !== "admin-helper");
    list.sort((a, b) => Math.abs(a.price - targetVal) - Math.abs(b.price - targetVal));
    state.to = list[0];
  }

  window.ABD_UP = {
    render() {
      const root = document.getElementById("upgradeStage");
      if (!root) return;
      const p = chance();
      const from = state.from;
      const to = state.to;
      root.innerHTML = `
        <div class="up-hero">
          <div class="up-title">
            <h2>Апгрейд</h2>
            <p>Положи предмет слева, цель справа. Стрелка покажет, где остановилась.</p>
          </div>
          <div class="up-table">
            <div class="up-slot" data-side="from">
              <div class="up-lab">Твой предмет</div>
              ${from ? `<img src="${itemImg(from)}" alt=""><b>${from.name}</b><span>${formatAZ(from.price)}</span>` : `<div class="up-empty">Выбери слева снизу</div>`}
            </div>
            <div class="up-monitor">
              <div class="dial">
                <svg viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r="88" class="dial-bg"/>
                  <circle cx="110" cy="110" r="88" class="dial-lose"/>
                  <circle cx="110" cy="110" r="88" class="dial-win" id="dialWin"
                    stroke-dasharray="${(2*Math.PI*88)*p/100} ${2*Math.PI*88}"/>
                </svg>
                <div class="needle" id="upNeedle"></div>
                <div class="dial-center">
                  <strong id="upChance">${p.toFixed(1)}%</strong>
                  <small>шанс</small>
                </div>
              </div>
              <div class="dial-legend"><span class="win-dot"></span> успех <span class="lose-dot"></span> проигрыш</div>
            </div>
            <div class="up-slot" data-side="to">
              <div class="up-lab">Цель</div>
              ${to ? `<img src="${itemImg(to)}" alt=""><b>${to.name}</b><span>${formatAZ(to.price)}</span>` : `<div class="up-empty">Выбери справа снизу</div>`}
            </div>
          </div>
          <div class="up-controls">
            <div class="stepper">
              <span>${from ? formatAZ(from.price) : "0 AZ"}</span>
            </div>
            <button class="btn gold-wide" id="doUpgrade">АПГРЕЙД</button>
            <div class="multis">
              ${[1.5,2,5,10].map((m) => `<button class="multi ${state.multi===m?"on":""}" data-multi="${m}">X${m}</button>`).join("")}
            </div>
          </div>
        </div>
        <div class="up-cols">
          <div class="panel">
            <h3>Твои предметы</h3>
            <div class="inv-pick" id="upInvFrom"></div>
          </div>
          <div class="panel">
            <h3>Предметы для апгрейда</h3>
            <input class="up-search" id="upSearch" placeholder="Поиск" value="${state.filter}">
            <div class="inv-pick" id="upInvTo"></div>
          </div>
        </div>`;

      const user = window.ABD.user;
      const fromBox = document.getElementById("upInvFrom");
      const toBox = document.getElementById("upInvTo");
      if (!user) {
        fromBox.innerHTML = "<p class='muted'>Войди, чтобы апгрейдить.</p>";
      } else if (!user.inventory.length) {
        fromBox.innerHTML = "<p class='muted'>Пока пусто — открой кейс.</p>";
      } else {
        fromBox.innerHTML = user.inventory.map((d) => `
          <div class="inv-card ${from && from.uid===d.uid?"selected":""}" data-up-from="${d.uid}">
            <img src="${itemImg(d)}" alt=""><b>${d.name}</b><span class="price">${formatAZ(d.price)}</span>
          </div>`).join("");
      }
      const q = (state.filter || "").toLowerCase();
      const list = Object.values(window.ABD_ITEMS).filter((it) => it.id !== "admin-helper" && (!q || it.name.toLowerCase().indexOf(q) >= 0));
      toBox.innerHTML = list.map((it) => `
        <div class="inv-card ${to && to.id===it.id?"selected":""}" data-up-to="${it.id}">
          <img src="${itemImg(it)}" alt=""><b>${it.name}</b><span class="price">${formatAZ(it.price)}</span>
        </div>`).join("");
    },

    pickFrom(uid) {
      const d = window.ABD.user && window.ABD.user.inventory.find((x) => x.uid === uid);
      state.from = d || null;
      if (state.from) nearestByMulti();
      this.render();
    },
    pickTo(id) {
      state.to = window.ABD_ITEMS[id] || null;
      this.render();
    },
    setMulti(m) {
      state.multi = Number(m);
      nearestByMulti();
      this.render();
    },
    setFilter(v) {
      state.filter = v;
      this.render();
      const s = document.getElementById("upSearch");
      if (s) { s.focus(); s.selectionStart = s.value.length; }
    },

    async run() {
      const user = window.ABD.user;
      if (!user) return window.ABD.toast("Войди в аккаунт");
      if (!state.from || !state.to) return window.ABD.toast("Выбери оба предмета");
      if (state.busy) return;
      state.busy = true;
      const p = chance();
      const win = Math.random() * 100 < p;
      const needle = document.getElementById("upNeedle");
      const stop = win ? (Math.random() * p) : (p + Math.random() * (100 - p));
      const deg = 360 * 5 + stop * 3.6;
      if (needle) {
        needle.style.transition = "transform 3.2s cubic-bezier(.12,.7,.08,1)";
        needle.style.transform = "rotate(" + deg + "deg)";
      }
      setTimeout(async () => {
        user.inventory = user.inventory.filter((x) => x.uid !== state.from.uid);
        if (win) {
          const drop = window.ABD.giveItem(state.to.id, "Апгрейд");
          window.ABD.addLive({
            nick: user.nick || user.email.split("@")[0],
            itemId: drop.itemId, name: drop.name, file: drop.file, rarity: drop.rarity,
            caseName: "Апгрейд", at: Date.now()
          });
          window.ABD.toast("Апгрейд зашёл: " + drop.name);
          window.ABD_APP.renderLive();
        } else {
          await window.ABD.persistUser();
          window.ABD.toast("Стрелка в красной зоне. Предмет сгорел.");
        }
        state.from = null;
        state.busy = false;
        this.render();
        window.ABD_APP.refreshHeader();
      }, 3300);
    }
  };
})();
