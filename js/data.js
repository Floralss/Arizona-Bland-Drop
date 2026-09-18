/* Bland Case — каталог предметов и кейсов.
   Картинка ищется в assets/predmeti/ по полю file.
   Положи свой PNG с ТОЧНО таким же именем — и он подхватится. */

window.ABD_OWNER_EMAIL = "strepoomich27@gmail.com";

window.ABD_ITEMS = {
  "car-amg": {
    id: "car-amg",
    name: "Mercedes AMG",
    full: "Машина - Mercedes AMG (0000)",
    file: "i-0000.png",
    type: "car",
    rarity: "rare",
    price: 18500
  },
  "car-m5": {
    id: "car-m5",
    name: "BMW M5 F90",
    full: "Машина - BMW M5 F90 (0001)",
    file: "i-0001.png",
    type: "car",
    rarity: "epic",
    price: 29000
  },
  "car-camry": {
    id: "car-camry",
    name: "Toyota Camry",
    full: "Машина - Toyota Camry (0002)",
    file: "i-0002.png",
    type: "car",
    rarity: "common",
    price: 3600
  },
  "car-priora": {
    id: "car-priora",
    name: "Lada Priora",
    full: "Машина - Lada Priora (0003)",
    file: "i-0003.png",
    type: "car",
    rarity: "common",
    price: 1600
  },
  "car-urus": {
    id: "car-urus",
    name: "Lamborghini Urus",
    full: "Машина - Lamborghini Urus (0004)",
    file: "i-0004.png",
    type: "car",
    rarity: "legendary",
    price: 96000
  },
  "car-rolls": {
    id: "car-rolls",
    name: "Rolls-Royce Cullinan",
    full: "Машина - Rolls-Royce Cullinan (0005)",
    file: "i-0005.png",
    type: "car",
    rarity: "legendary",
    price: 145000
  },
  "car-tesla": {
    id: "car-tesla",
    name: "Tesla Model S",
    full: "Машина - Tesla Model S (0006)",
    file: "i-0006.png",
    type: "car",
    rarity: "epic",
    price: 34000
  },
  "car-gtr": {
    id: "car-gtr",
    name: "Nissan GTR",
    full: "Машина - Nissan GTR (0007)",
    file: "i-0007.png",
    type: "car",
    rarity: "rare",
    price: 24000
  },
  "moto-r1": {
    id: "moto-r1",
    name: "Yamaha R1",
    full: "Мото - Yamaha R1 (1000)",
    file: "i-1000.png",
    type: "moto",
    rarity: "epic",
    price: 21000
  },
  "moto-cbr": {
    id: "moto-cbr",
    name: "Honda CBR 1000",
    full: "Мото - Honda CBR 1000 (1001)",
    file: "i-1001.png",
    type: "moto",
    rarity: "rare",
    price: 12500
  },
  "moto-ninja": {
    id: "moto-ninja",
    name: "Kawasaki Ninja",
    full: "Мото - Kawasaki Ninja (1002)",
    file: "i-1002.png",
    type: "moto",
    rarity: "rare",
    price: 14000
  },
  "moto-harley": {
    id: "moto-harley",
    name: "Harley Davidson",
    full: "Мото - Harley Davidson (1003)",
    file: "i-1003.png",
    type: "moto",
    rarity: "epic",
    price: 26000
  },
  "moto-gsx": {
    id: "moto-gsx",
    name: "Suzuki GSX-R",
    full: "Мото - Suzuki GSX-R (1004)",
    file: "i-1004.png",
    type: "moto",
    rarity: "common",
    price: 3200
  },
  "skin-biz": {
    id: "skin-biz",
    name: "Business Black",
    full: "Скин - Business Black (2000)",
    file: "i-2000.png",
    type: "skin",
    rarity: "rare",
    price: 3600
  },
  "skin-hoodie": {
    id: "skin-hoodie",
    name: "Street Hoodie",
    full: "Скин - Street Hoodie (2001)",
    file: "i-2001.png",
    type: "skin",
    rarity: "common",
    price: 700
  },
  "skin-police": {
    id: "skin-police",
    name: "Police Officer",
    full: "Скин - Police Officer (2002)",
    file: "i-2002.png",
    type: "skin",
    rarity: "epic",
    price: 8200
  },
  "skin-cowboy": {
    id: "skin-cowboy",
    name: "Desert Cowboy",
    full: "Скин - Desert Cowboy (2003)",
    file: "i-2003.png",
    type: "skin",
    rarity: "rare",
    price: 4200
  },
  "skin-neon": {
    id: "skin-neon",
    name: "Neon Night",
    full: "Скин - Neon Night (2004)",
    file: "i-2004.png",
    type: "skin",
    rarity: "legendary",
    price: 18500
  },
  "skin-winter": {
    id: "skin-winter",
    name: "Winter Parka",
    full: "Скин - Winter Parka (2005)",
    file: "i-2005.png",
    type: "skin",
    rarity: "common",
    price: 850
  },
  "acc-rolex": {
    id: "acc-rolex",
    name: "Rolex Daytona",
    full: "Акс - Rolex Daytona (3000)",
    file: "i-3000.png",
    type: "acc",
    rarity: "legendary",
    price: 28000
  },
  "acc-chain": {
    id: "acc-chain",
    name: "Chrome Chain",
    full: "Акс - Chrome Chain (3001)",
    file: "i-3001.png",
    type: "acc",
    rarity: "rare",
    price: 4800
  },
  "acc-glasses": {
    id: "acc-glasses",
    name: "Black Glasses",
    full: "Акс - Black Glasses (3002)",
    file: "i-3002.png",
    type: "acc",
    rarity: "common",
    price: 650
  },
  "acc-ring": {
    id: "acc-ring",
    name: "Gold Ring",
    full: "Акс - Gold Ring (3003)",
    file: "i-3003.png",
    type: "acc",
    rarity: "epic",
    price: 9000
  },
  "acc-cap": {
    id: "acc-cap",
    name: "Bland Cap",
    full: "Акс - Bland Cap (3004)",
    file: "i-3004.png",
    type: "acc",
    rarity: "common",
    price: 450
  },
  "car-g63": {
    id: "car-g63",
    name: "G63 AMG",
    full: "Машина - G63 AMG (0008)",
    file: "i-0008.png",
    type: "car",
    rarity: "legendary",
    price: 88000
  },
  "car-supra": {
    id: "car-supra",
    name: "Toyota Supra",
    full: "Машина - Toyota Supra (0009)",
    file: "i-0009.png",
    type: "car",
    rarity: "epic",
    price: 42000
  },
  "car-e63": {
    id: "car-e63",
    name: "Mercedes E63s",
    full: "Машина - Mercedes E63s (0010)",
    file: "i-0010.png",
    type: "car",
    rarity: "epic",
    price: 38000
  },
  "car-2107": {
    id: "car-2107",
    name: "ВАЗ 2107",
    full: "Машина - ВАЗ 2107 (0011)",
    file: "i-0011.png",
    type: "car",
    rarity: "common",
    price: 1200
  },
  "donat-vip": {
    id: "donat-vip",
    name: "VIP статус",
    full: "Донат - VIP (4000)",
    file: "i-4000.png",
    type: "donate",
    rarity: "epic",
    price: 25000
  },
  "donat-bp": {
    id: "donat-bp",
    name: "Боевой пропуск",
    full: "Донат - Боевой пропуск (4001)",
    file: "i-4001.png",
    type: "donate",
    rarity: "rare",
    price: 8000
  },
  "donat-prem": {
    id: "donat-prem",
    name: "Premium донат",
    full: "Донат - Premium (4002)",
    file: "i-4002.png",
    type: "donate",
    rarity: "legendary",
    price: 60000
  },
  "admin-helper": {
    id: "admin-helper",
    name: "Helper Rights",
    full: "Админ - Helper Rights (9999)",
    file: "i-9999.png",
    type: "admin",
    rarity: "mythic",
    price: 500000
  }
};

window.ABD_CASES = [
  {
    id: "auto",
    name: "Автомобильный",
    desc: "Машины Bland Russia — от ВАЗ 2107 до G63 AMG.",
    price: 2500,
    image: "assets/cases/case-auto.png",
    color: "#ff2a2a",
    items: [
      { id: "car-2107", chance: 28 },
      { id: "car-priora", chance: 22 },
      { id: "car-camry", chance: 16 },
      { id: "car-amg", chance: 10 },
      { id: "car-e63", chance: 8 },
      { id: "car-m5", chance: 6 },
      { id: "car-supra", chance: 5 },
      { id: "car-gtr", chance: 3 },
      { id: "car-g63", chance: 1.5 },
      { id: "car-urus", chance: 0.4 },
      { id: "car-rolls", chance: 0.1 }
    ]
  },
  {
    id: "moto",
    name: "Мото",
    desc: "Спортбайки и круизеры сервера.",
    price: 1800,
    image: "assets/cases/case-moto.png",
    color: "#ff3b3b",
    items: [
      { id: "moto-gsx", chance: 42 },
      { id: "moto-cbr", chance: 24 },
      { id: "moto-ninja", chance: 20 },
      { id: "moto-r1", chance: 9 },
      { id: "moto-harley", chance: 5 }
    ]
  },
  {
    id: "skins",
    name: "Скины",
    desc: "Внешний вид персонажа. Скин сразу на аккаунт.",
    price: 800,
    image: "assets/cases/case-skins.png",
    color: "#ff4d4d",
    items: [
      { id: "skin-hoodie", chance: 36 },
      { id: "skin-winter", chance: 30 },
      { id: "skin-biz", chance: 16 },
      { id: "skin-cowboy", chance: 12 },
      { id: "skin-police", chance: 4.5 },
      { id: "skin-neon", chance: 1.5 }
    ]
  },
  {
    id: "acc",
    name: "Аксессуары",
    desc: "Часы, цепи, очки и прочие аксы.",
    price: 600,
    image: "assets/cases/case-acc.png",
    color: "#c81e1e",
    items: [
      { id: "acc-cap", chance: 40 },
      { id: "acc-glasses", chance: 32 },
      { id: "acc-chain", chance: 18 },
      { id: "acc-ring", chance: 8 },
      { id: "acc-rolex", chance: 2 }
    ]
  },
  {
    id: "youtube",
    name: "Ютуберский",
    desc: "Тачки, мото, донат и боевой пропуск.",
    price: 4500,
    image: "assets/cases/case-youtube.png",
    color: "#ff1f1f",
    items: [
      { id: "donat-bp", chance: 28 },
      { id: "moto-gsx", chance: 16 },
      { id: "car-camry", chance: 14 },
      { id: "donat-vip", chance: 12 },
      { id: "moto-r1", chance: 8 },
      { id: "car-m5", chance: 7 },
      { id: "car-supra", chance: 6 },
      { id: "car-g63", chance: 4 },
      { id: "donat-prem", chance: 3.5 },
      { id: "car-urus", chance: 1.5 }
    ]
  },
  {
    id: "admin",
    name: "Админский",
    desc: "Всё сразу: авто, мото, скины, аксы. Редко — Helper.",
    price: 7500,
    image: "assets/cases/case-admin.png",
    color: "#ff0000",
    items: [
      { id: "acc-cap", chance: 16 },
      { id: "skin-hoodie", chance: 14 },
      { id: "car-2107", chance: 12 },
      { id: "moto-gsx", chance: 11 },
      { id: "acc-chain", chance: 10 },
      { id: "skin-cowboy", chance: 8 },
      { id: "car-camry", chance: 7 },
      { id: "moto-cbr", chance: 6 },
      { id: "donat-bp", chance: 5 },
      { id: "car-amg", chance: 4 },
      { id: "skin-police", chance: 3 },
      { id: "moto-r1", chance: 2 },
      { id: "car-g63", chance: 1.2 },
      { id: "donat-prem", chance: 0.6 },
      { id: "car-rolls", chance: 0.199 },
      { id: "admin-helper", chance: 0.001 }
    ]
  }
];

window.ABD_RARITY = {
  common: { label: "Обычный", color: "#9aa4b2" },
  rare: { label: "Редкий", color: "#4aa3ff" },
  epic: { label: "Эпический", color: "#b24cff" },
  legendary: { label: "Легендарный", color: "#ff8a00" },
  mythic: { label: "Мифический", color: "#ff3b3b" }
};

window.ABD_TYPE = {
  car: "Машина",
  moto: "Мото",
  skin: "Скин",
  acc: "Аксессуар",
  admin: "Админ-права",
  donate: "Донат"
};

window.itemImg = function (item) {
  if (!item) return "assets/cases/case-auto.png";
  const file = item.file || item.name || item;
  try { return "assets/predmeti/" + encodeURI(file); } catch (e) { return "assets/cases/case-auto.png"; }
};

window.formatAZ = function (n) {
  n = Math.round(Number(n) || 0);
  return n.toLocaleString("ru-RU") + " BC";
};

window.pickWeighted = function (entries) {
  const total = entries.reduce((s, e) => s + e.chance, 0);
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.chance;
    if (r <= 0) return e;
  }
  return entries[entries.length - 1];
};

window.pickWithLuck = function (entries, luck, casePrice) {
  luck = Number(luck) || 1;
  if (luck <= 1) return pickWeighted(entries);
  const boosted = entries.map(function (e) {
    const it = ABD_ITEMS[e.id];
    const rare = it && casePrice && it.price >= casePrice;
    return { id: e.id, chance: rare ? e.chance * luck : e.chance };
  });
  return pickWeighted(boosted);
};
