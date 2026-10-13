// Yönlendirici, menü, arama ve tema
import { esc, logo, tvLogo, usLogo, cleanName, price } from "./ui.js";
import { tvSearch, coins, store, listPage } from "./api.js";
import { leaveAll, go } from "./core.js";

const MENU = [
  ["", "Ana ekran"], ["inceleme", "🔍 Şirket İnceleme"], ["haberler", "Haberler"], ["portfoy", "Portföyüm"],
  ["#Piyasalar"],
  ["liste/NASDAQ", "Nasdaq"], ["liste/SPX", "S&P 500"], ["liste/RUT", "Russell 2000"], ["kripto", "Kripto"],
  ["liste/BIST100", "BIST 100"], ["emtia", "Emtia (altın, gümüş)"],
  ["#Keşfet"],
  ["bilancolar", "Bilançolar"], ["gelecek", "Gelecek vaat edenler"], ["isi", "Isı haritası"], ["hareketliler", "Yükselenler / düşenler"],
  ["takvim", "Ekonomik takvim"], ["iceriden", "İçeriden alımlar"],
  ["#Araçlar"],
  ["karsilastir", "Karşılaştır"], ["neolurdu", "Ne olurdu?"], ["altin-tahmin", "Altın tahmin takibi"],
  ["#Ayarlar"],
  ["sozluk", "Sözlük"], ["ayarlar", "Ayarlar"],
];

const ROUTES = {
  "": () => import("./views/home.js"),
  haberler: () => import("./views/news.js"),
  liste: () => import("./views/lists.js"),
  hisse: () => import("./views/company.js"),
  bist: () => import("./views/company.js"),
  endeks: () => import("./views/index-page.js"),
  kripto: () => import("./views/crypto.js"),
  emtia: () => import("./views/metals.js"),
  "altin-tahmin": () => import("./views/gold.js"),
  bilancolar: () => import("./views/earnings.js"),
  bilanco: () => import("./views/earnings.js"),
  gelecek: () => import("./views/themes.js"),
  isi: () => import("./views/heatmap.js"),
  hareketliler: () => import("./views/movers.js"),
  takvim: () => import("./views/econ.js"),
  iceriden: () => import("./views/insiders.js"),
  karsilastir: () => import("./views/compare.js"),
  neolurdu: () => import("./views/whatif.js"),
  portfoy: () => import("./views/portfolio.js"),
  sozluk: () => import("./views/glossary.js"),
  ayarlar: () => import("./views/settings.js"),
  inceleme: () => import("./views/analyze.js"),
  karne: () => import("./views/analyze.js"),
  ders: () => import("./views/analyze.js"),
  test: () => import("./views/analyze.js"),
};

const side = document.getElementById("side");
side.innerHTML = MENU.map(([r, t]) => (r.startsWith("#") ? `<div class="sec">${esc(r.slice(1))}</div>` : `<a href="#/${r}" data-r="${r}"${r === "inceleme" ? ' class="hl"' : ""}>${esc(t)}</a>`)).join("");


const view = document.getElementById("view");
let seq = 0;
async function route() {
  leaveAll();
  closeMenu();
  const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const key = parts[0] || "";
  const active = parts[0] === "liste" ? "liste/" + parts[1] : ["karne", "ders", "test"].includes(key) ? "inceleme" : key;
  document.querySelectorAll("[data-r]").forEach((a) => a.classList.toggle("on", a.dataset.r === active));
  const loader = ROUTES[key] || ROUTES[""];
  const my = ++seq;
  view.innerHTML = `<div class="spinner"></div>`;
  window.scrollTo(0, 0);
  try {
    const mod = await loader();
    if (my !== seq) return;
    view.innerHTML = "";
    await mod.render(view, parts.slice(1), key);
  } catch (e) {
    console.error(e);
    if (my === seq) view.innerHTML = `<div class="card err">Sayfa yüklenemedi: ${esc(e.message)}</div>`;
  }
}
window.addEventListener("hashchange", route);

// ---- mobil menü
const menuBtn = document.getElementById("menuBtn");
let scrim = null;
function closeMenu() { side.classList.remove("open"); if (scrim) { scrim.remove(); scrim = null; } }
menuBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (side.classList.contains("open")) return closeMenu();
  side.classList.add("open");
  scrim = document.createElement("div"); scrim.className = "scrim"; scrim.onclick = closeMenu; document.body.appendChild(scrim);
});

// ---- tema
const themeBtn = document.getElementById("theme");
function applyTheme() { const t = store.get("theme", ""); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
themeBtn.onclick = () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  store.set("theme", dark ? "light" : "dark"); applyTheme(); window.dispatchEvent(new Event("resize"));
};
applyTheme();

// ---- arama
const q = document.getElementById("q"), sr = document.getElementById("sr");
let st = null, bistNames = null;
q.addEventListener("input", () => { clearTimeout(st); st = setTimeout(search, 300); });
q.addEventListener("keydown", (e) => { if (e.key === "Enter") { const f = sr.querySelector(".sr"); if (f) f.click(); } if (e.key === "Escape") hideSr(); });
document.addEventListener("click", (e) => { if (!e.target.closest(".search")) hideSr(); });
function hideSr() { sr.hidden = true; }
async function search() {
  const s = q.value.trim();
  if (s.length < 2) return hideSr();
  sr.hidden = false; sr.innerHTML = `<div class="spinner"></div>`;
  const low = s.toLocaleLowerCase("tr");
  const [us, cs, bs] = await Promise.all([
    tvSearch("america", s, 6).catch(() => []),
    coins().then((l) => l.filter((c) => c.symbol.toLowerCase() === low || c.name.toLowerCase().includes(low)).slice(0, 4)).catch(() => []),
    tvSearch("turkey", s, 5).then((l) => l.filter((r) => r.exchange === "BIST")).catch(() => []),
  ]);
  const rows = [
    ...us.map((r) => ({ href: "hisse/" + r.name, img: tvLogo(r.logoid) || usLogo(r.name), n: cleanName(r.description), sub: `${r.name} · ${r.exchange}`, p: price(r.close) + " $" })),
    ...bs.map((r) => ({ href: "bist/" + r.name, img: tvLogo(r.logoid), n: cleanName(r.description), sub: `${r.name} · Borsa İstanbul`, p: price(r.close) + " ₺" })),
    ...cs.map((c) => ({ href: "kripto/" + c.id, img: c.image, n: c.name, sub: c.symbol.toUpperCase() + " · Kripto", p: price(c.current_price) + " $" })),
  ];
  if (!rows.length) { sr.innerHTML = `<div class="sr muted">Sonuç yok.</div>`; return; }
  sr.innerHTML = rows.map((r) => `<div class="sr" data-h="${esc(r.href)}">${logo(r.img, r.n, 28)}<div class="grow"><div class="ell"><b>${esc(r.n)}</b></div><div class="tiny muted">${esc(r.sub)}</div></div><div class="small">${esc(r.p)}</div></div>`).join("");
  sr.querySelectorAll(".sr").forEach((el) => (el.onclick = () => { hideSr(); q.value = ""; go(el.dataset.h); }));
}

route();
