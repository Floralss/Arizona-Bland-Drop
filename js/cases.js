(function () {
  const ITEM_W = 148;

  window.ABD_CASES_UI = {
    current: null,
    spinning: false,
    timer: null,
    qty: 1,
    fast: false,

    renderGrid() {
      const root = document.getElementById("casesGrid");
      if (!root) return;
      root.innerHTML = window.ABD_CASES.map((c) => `
        <article class="case-card" data-open-case="${c.id}">
          <div class="thumb"><img src="${c.image}" alt="${c.name}"></div>
          <h4>${c.name}</h4>
          <span class="price-btn">${c.price.toLocaleString("ru-RU")} BC</span>
        </article>
      `).join("");
    },

    open(caseId) {
      const caseDef = window.ABD_CASES.find((c) => c.id === caseId);
      if (!caseDef) return;
      this.current = caseDef;
      this.spinning = false;
      if (this.timer) clearTimeout(this.timer);
      window.ABD_APP.go("case");
      this.renderPage();
    },

    previewStrip(c) {
      const strip = [];
      for (let i = 0; i < 24; i++) {
        const e = c.items[i % c.items.length];
        strip.push(window.ABD_ITEMS[e.id]);
      }
      return strip.map((it) => this.cell(it)).join("");
    },

    cell(it) {
      return `<div class="roulette-item r-${it.rarity}">
        <img src="${itemImg(it)}" alt="">
        <span>${it.name}</span>
      </div>`;
    },

    renderPage() {
      const c = this.current;
      const root = document.getElementById("casePage");
      if (!c || !root) return;
      const user = window.ABD.user;
      const need = c.price;
      const have = user ? user.balance : 0;
      const miss = Math.max(0, need - have);
      const canOpen = !!user && have >= need && !this.spinning;

      root.innerHTML = `
        <div class="case-page-head">
          <div><button class="btn ghost" data-go="home">Назад</button></div>
          <h2>Кейс: ${c.name}</h2>
          <div></div>
        </div>
        <div class="roulette-wrap big-roul">
          <div class="roul-fade left"></div>
          <div class="roul-fade right"></div>
          <div class="pointer"></div>
          <div class="roulette" id="roulette">${this.previewStrip(c)}</div>
        </div>
        <div class="case-center case-under">
          <div class="art pulse-art"><img src="${c.image}" alt="${c.name}"></div>
          <div id="caseResult" class="hidden"></div>
          ${user && miss > 0 ? `<div class="warn-bal"><b>${need.toLocaleString("ru-RU")} BC — не хватает ${miss.toLocaleString("ru-RU")} BC</b></div>` : ""}
          ${canOpen ? `
            <div class="qty-row">
              ${[1,3,5].map((n) => `<button class="btn ${this.qty===n?"purple":"ghost"}" data-spin-qty="${n}">x${n}</button>`).join("")}
              <label class="skip"><input type="checkbox" id="spinFast" ${this.fast?"checked":""}> Быстрая крутка</label>
            </div>
            <button class="btn green btn-lg" id="spinCase">Открыть x${this.qty} за ${(need*this.qty).toLocaleString("ru-RU")} BC</button>
          ` : user
              ? `<button class="btn green btn-lg" data-open-dep>Пополнить баланс</button>`
              : `<button class="btn green btn-lg" data-go="profile">Войти, чтобы открыть</button>`}
        </div>
        <div class="contents-h">
          <h3>СОДЕРЖИМОЕ КЕЙСА</h3>
        </div>
        <div class="drop-grid">
          ${c.items.map((e) => {
            const it = window.ABD_ITEMS[e.id];
            const ch = e.chance < 0.01 ? e.chance.toFixed(3) : String(e.chance);
            return `<div class="drop-mini r-${it.rarity}">
              <div class="ch">${ch}%<small>ШАНС</small></div>
              <img src="${itemImg(it)}" alt="">
              <b>${it.name}</b>
              <i>${ABD_TYPE[it.type]} · ${formatAZ(it.price)}</i>
            </div>`;
          }).join("")}
        </div>`;
    },

    async spin() {
      const c = this.current;
      const user = window.ABD.user;
      const roul = document.getElementById("roulette");
      if (!c || !user || this.spinning || !roul) return;
      const qty = Math.max(1, Number(this.qty) || 1);
      const cost = c.price * qty;
      if (user.balance < cost) {
        window.ABD.toast("Недостаточно BC на x" + qty);
        return;
      }

      this.spinning = true;
      const btn = document.getElementById("spinCase");
      if (btn) btn.disabled = true;
      user.balance -= cost;
      window.ABD.persistUser();
      window.ABD_APP.refreshHeader();

      const wins = [];
      for (let n = 0; n < qty; n++) {
        const winEntry = pickWithLuck(c.items, user.luckMul || 1, c.price);
        wins.push(window.ABD_ITEMS[winEntry.id]);
      }
      const winItem = wins[wins.length - 1];

      const strip = [];
      for (let i = 0; i < 80; i++) {
        const e = c.items[Math.floor(Math.random() * c.items.length)];
        strip.push(window.ABD_ITEMS[e.id]);
      }
      const winPos = 62;
      strip[winPos] = winItem;

      roul.style.transition = "none";
      roul.style.transform = "translate3d(0,0,0)";
      roul.innerHTML = strip.map((it) => this.cell(it)).join("");
      void roul.offsetWidth;

      const wrap = document.querySelector(".roulette-wrap");
      const center = wrap.clientWidth / 2;
      const jitter = Math.random() * 36 - 18;
      const target = winPos * ITEM_W + ITEM_W / 2 - center + jitter;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          roul.style.transition = this.fast ? "transform .35s linear" : "transform 5.2s cubic-bezier(.15,.72,.05,.99)";
          roul.style.transform = "translate3d(" + (-target) + "px,0,0)";
        });
      });

      const result = document.getElementById("caseResult");
      if (result) result.classList.add("hidden");

      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        wins.forEach((it) => {
          window.ABD.giveItem(it.id, c.name);
          window.ABD.addLive({
            nick: user.nick || user.email.split("@")[0],
            itemId: it.id,
            name: it.name,
            file: it.file,
            rarity: it.rarity,
            caseName: c.name,
            at: Date.now()
          });
        });
        if (result) {
          result.classList.remove("hidden");
          result.innerHTML = wins.map((it) => `
            <div class="result-card pop">
              <img src="${itemImg(it)}" alt="">
              <h3>${it.name}</h3>
              <p>${ABD_RARITY[it.rarity].label} · ${formatAZ(it.price)}</p>
            </div>`).join("");
        }
        this.spinning = false;
        window.ABD_APP.renderLive();
        window.ABD_APP.refreshHeader();
        if (btn) btn.disabled = false;
      }, this.fast ? 420 : 5400);
    }
  };
})();
