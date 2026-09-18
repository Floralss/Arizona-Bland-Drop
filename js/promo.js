(function () {
  const LS = "abd_promos";
  const USED = "abd_promo_used";

  function load() {
    try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch (e) { return []; }
  }
  function save(list) { localStorage.setItem(LS, JSON.stringify(list)); }
  function usedMap() {
    try { return JSON.parse(localStorage.getItem(USED) || "{}"); } catch (e) { return {}; }
  }
  function saveUsed(m) { localStorage.setItem(USED, JSON.stringify(m)); }

  window.ABD_PROMO = {
    list() { return load(); },

    create(code, kind, type, value, maxUses, extra) {
      extra = extra || {};
      code = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
      if (!code) return "Напиши код";
      const list = load();
      if (list.some((p) => p.code === code)) return "Такой код уже есть";
      const row = {
        code: code,
        kind: kind || "free",
        type: type === "item" ? "item" : "bc",
        itemId: type === "item" ? value : null,
        amount: type === "item" ? 0 : Math.max(0, Number(value) || 0),
        max: Math.max(1, Number(maxUses) || 1),
        used: 0,
        active: true,
        bonusPct: Number(extra.bonusPct || 0),
        giftCase: extra.giftCase || ""
      };
      list.unshift(row);
      save(list);
      const fb = window.ABD_FB;
      if (fb && fb.db) fb.db.collection("promos").doc(code).set(row).catch(function () {});
      return null;
    },

    remove(code) {
      save(load().filter((p) => p.code !== code));
      const fb = window.ABD_FB;
      if (fb && fb.db) fb.db.collection("promos").doc(code).delete().catch(function () {});
    },

    async redeem(code) {
      const u = window.ABD.user;
      if (!u) return "Сначала войди";
      code = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
      if (!code) return "Введи промокод";
      const used = usedMap();
      const key = (u.email || "") + ":" + code;
      if (used[key]) return "Ты уже активировал этот код";
      let promo = load().find((p) => p.code === code);
      const fb = window.ABD_FB;
      if (!promo && fb && fb.db) {
        try {
          const s = await fb.db.collection("promos").doc(code).get();
          if (s.exists) promo = s.data();
        } catch (e) {}
      }
      if (!promo || promo.active === false) return "Код не найден";
      if (Number(promo.used || 0) >= Number(promo.max || 1)) return "Код уже закончился";
      const kind = promo.kind || "free";
      if (kind === "dep1000" && Number(u.totalDeposited || 0) < 1000) {
        return "Нужно пополнить сайт минимум на 1000 BC";
      }
      if (kind === "depbonus") {
        u.depBonusPct = Number(promo.bonusPct || 0);
        u.depGiftCase = promo.giftCase || "";
        window.ABD.persistUser();
        window.ABD.notify(u.email, "Промокод", "Бонус к пополнению активирован");
      } else if (promo.type === "item" && promo.itemId) {
        window.ABD.giveItem(promo.itemId, "Промо " + code);
      } else {
        window.ABD.creditAz(u.email, promo.amount || 0);
      }
      promo.used = Number(promo.used || 0) + 1;
      const list = load();
      const i = list.findIndex((p) => p.code === code);
      if (i >= 0) list[i] = promo; else list.unshift(promo);
      save(list);
      used[key] = Date.now();
      saveUsed(used);
      if (fb && fb.db) {
        fb.db.collection("promos").doc(code).set(promo, { merge: true }).catch(function () {});
        fb.db.collection("promoUsed").doc(key.replace(/[@.]/g, "_")).set({
          email: u.email, code: code, at: Date.now()
        }).catch(function () {});
      }
      window.ABD.notify(u.email, "Промокод", "Код " + code + " активирован");
      return null;
    }
  };
})();
