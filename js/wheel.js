(function () {
  const REWARDS = [
    { id: "az-300", label: "300 AZ", type: "az", amount: 300 },
    { id: "az-800", label: "800 AZ", type: "az", amount: 800 },
    { id: "az-1500", label: "1 500 AZ", type: "az", amount: 1500 },
    { id: "case-acc", label: "Кейс аксы", type: "case", caseId: "acc" },
    { id: "acc-cap", label: "Arizona Cap", type: "item", itemId: "acc-cap" },
    { id: "az-2500", label: "2 500 AZ", type: "az", amount: 2500 },
    { id: "skin-hoodie", label: "Street Hoodie", type: "item", itemId: "skin-hoodie" },
    { id: "az-500", label: "500 AZ", type: "az", amount: 500 }
  ];

  function todayKey(email) {
    const d = new Date();
    return "abd_wheel_" + (email || "guest") + "_" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function usedToday(email) {
    return localStorage.getItem(todayKey(email)) === "1";
  }

  function markUsed(email) {
    localStorage.setItem(todayKey(email), "1");
  }

  function placeSlots() {
    const wheel = document.getElementById("bonusWheel");
    if (!wheel) return;
    const slots = REWARDS.map((r, i) => {
      const item = r.itemId ? window.ABD_ITEMS[r.itemId] : null;
      const img = item ? itemImg(item) : "assets/cases/case-acc.png";
      const angle = (i / REWARDS.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 38;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      return `<div class="wheel-slot" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%)">
        <img src="${img}" alt="${r.label}" title="${r.label}">
      </div>`;
    }).join("");
    const hub = wheel.parentElement.querySelector(".wheel-hub");
    wheel.innerHTML = slots;
    if (hub && !wheel.contains(hub)) {
      /* hub is sibling */
    }
  }

  window.ABD_WHEEL = {
    render() {
      placeSlots();
      const u = window.ABD.user;
      const note = document.getElementById("wheelNote");
      const btn = document.getElementById("spinWheel");
      if (!u) {
        note.textContent = "Войди, чтобы крутить колесо раз в сутки.";
        btn.disabled = true;
        return;
      }
      if (usedToday(u.email)) {
        note.textContent = "Колесо уже крутили сегодня. Завтра снова будет доступно.";
        btn.disabled = true;
      } else {
        note.textContent = "Одно вращение в сутки на аккаунт.";
        btn.disabled = false;
      }
    },

    async spin() {
      const u = window.ABD.user;
      if (!u) return window.ABD.toast("Сначала войди");
      if (usedToday(u.email)) return window.ABD.toast("Уже крутили сегодня");
      const idx = Math.floor(Math.random() * REWARDS.length);
      const reward = REWARDS[idx];
      const wheel = document.getElementById("bonusWheel");
      const skip = document.getElementById("skipWheelAnim").checked;
      const slice = 360 / REWARDS.length;
      const extra = 360 * 6;
      const deg = extra + (360 - idx * slice);
      if (skip) {
        await this.give(reward);
        return;
      }
      wheel.style.transition = "none";
      wheel.style.transform = "rotate(0deg)";
      void wheel.offsetWidth;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          wheel.style.transition = "transform 4.8s cubic-bezier(.12,.7,.08,1)";
          wheel.style.transform = "rotate(" + deg + "deg)";
        });
      });
      setTimeout(() => this.give(reward), 5000);
    },

    async give(reward) {
      const u = window.ABD.user;
      markUsed(u.email);
      if (reward.type === "az") {
        u.balance += reward.amount;
        await window.ABD.persistUser();
        window.ABD.toast("Колесо: +" + reward.label);
      } else if (reward.type === "item") {
        window.ABD.giveItem(reward.itemId, "Колесо бонус");
        const it = window.ABD_ITEMS[reward.itemId];
        window.ABD.addLive({
          nick: u.nick || u.email.split("@")[0],
          itemId: it.id, name: it.name, file: it.file, rarity: it.rarity,
          caseName: "Колесо", at: Date.now()
        });
        window.ABD.toast("Колесо: " + it.name);
        window.ABD_APP.renderLive();
      } else if (reward.type === "case") {
        u.balance += window.ABD_CASES.find((c) => c.id === reward.caseId).price;
        await window.ABD.persistUser();
        window.ABD.toast("Колесо: AZ на кейс «Аксессуары»");
      }
      window.ABD_APP.refreshHeader();
      this.render();
    }
  };
})();
