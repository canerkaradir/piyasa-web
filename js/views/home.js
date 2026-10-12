import { esc, price, pill, logo, tvLogo, usLogo, timeAgo } from "../ui.js";
import { cnbcQuotes, num, local, coins, tvByNames } from "../api.js";
import { every, favs, bindLinks, go } from "../core.js";
import { newsCard, sentimentCard, pulseSection, sparkInto, disclaimer } from "../widgets.js";

export const INDICES = [
  [".SPX", "S&P 500", ""], [".IXIC", "Nasdaq", ""], [".RUT", "Russell 2000", ""], [".XU030", "BIST 30", "₺"], [".VIX", "VIX (korku)", ""],
];
const EXTRA = [["XAU=", "Altın (ons)", "emtia/altin"], ["XAG=", "Gümüş (ons)", "emtia/gumus"], [".DJI", "Dow Jones", "endeks/.DJI"], [".DXY", "Dolar endeksi", "endeks/.DXY"], ["TRY=", "Dolar / TL", "endeks/TRY="], ["US10Y", "10 yıllık faiz", "endeks/US10Y"]];

export async function render(el) {
  el.innerHTML = `
    <div class="row between wrap"><div><h1>Piyasalar</h1><div class="small muted" id="upd"></div></div></div>
    <div class="grid" id="idx" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))"></div>
    <div class="chips" id="extra" style="margin-top:10px"></div>
    <div id="fav"></div>
    <div class="grid g2" style="margin-top:6px">
      <div><h2>Önemli gelişmeler <a class="small" href="#/haberler" style="font-weight:400">tümü ›</a></h2><div id="news"><div class="spinner"></div></div></div>
      <div><h2>Bugün ve yarın: önemli veriler</h2><div id="econ"></div><div id="mood" style="margin-top:12px"></div></div>
    </div>
    <div id="pulse"></div>
    ${disclaimer("CNBC, TradingView, CNN, CoinGecko, Google Haberler")}`;

  const idx = el.querySelector("#idx");
  idx.innerHTML = INDICES.map(([s, n]) => `<div class="card" data-h="endeks/${s}" style="cursor:pointer;padding:12px">
    <div class="small muted">${n}</div><div class="row between"><div><div style="font-size:19px;font-weight:800" data-v="${s}">…</div><div data-c="${s}"></div></div><div data-sp="${s}"></div></div></div>`).join("");
  bindLinks(idx);
  INDICES.forEach(([s]) => sparkInto(idx.querySelector(`[data-sp="${CSS.escape(s)}"]`), s, "1A", 90, 36));
  const extra = el.querySelector("#extra");

  async function quotes() {
    const q = await cnbcQuotes([...INDICES.map((x) => x[0]), ...EXTRA.map((x) => x[0])]).catch(() => ({}));
    for (const [s, , u] of INDICES) {
      const o = q[s]; if (!o) continue;
      idx.querySelector(`[data-v="${CSS.escape(s)}"]`).textContent = o.last + (u ? " " + u : "");
      idx.querySelector(`[data-c="${CSS.escape(s)}"]`).innerHTML = pill(num(o.change_pct));
    }
    extra.innerHTML = EXTRA.map(([s, n, h]) => { const o = q[s]; return `<button class="chip" data-h="${h}">${n}: <b>${o ? o.last : "…"}</b> ${o ? pill(num(o.change_pct)) : ""}</button>`; }).join("");
    bindLinks(extra);
  }
  quotes(); every(60_000, quotes);

  favBox(el.querySelector("#fav"));

  local("news.json").then((l) => {
    const cut = Date.now() - 24 * 3600_000;
    let top = l.filter((n) => n.score >= 2 && n.time > cut).slice(0, 8);
    if (top.length < 4) top = l.filter((n) => n.score >= 2).slice(0, 8);
    el.querySelector("#news").innerHTML = top.map(newsCard).join("") || `<div class="muted">Şu an önemli haber yok.</div>`;
  }).catch(() => (el.querySelector("#news").innerHTML = `<div class="err">Haberler alınamadı.</div>`));
  local("updated.json").then((u) => (el.querySelector("#upd").textContent = "Haber ve göstergeler " + timeAgo(u.at) + " güncellendi · fiyatlar canlı")).catch(() => {});

  local("econ.json").then((l) => {
    const now = new Date(), end = new Date(now); end.setDate(end.getDate() + 2); end.setHours(0, 0, 0, 0);
    const ev = l.filter((e) => e.imp >= 1 && new Date(e.date) >= new Date(now - 3 * 3600_000) && new Date(e.date) < end).slice(0, 8);
    el.querySelector("#econ").innerHTML = ev.length ? `<div class="card">${ev.map((e) => `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--line)">
      <div class="grow"><div class="small"><b>${esc(e.tr)}</b> ${e.period ? `<span class="muted">(${esc(e.period)})</span>` : ""}</div>
      <div class="tiny muted">${new Date(e.date).toLocaleString("tr-TR", { weekday: "short", hour: "2-digit", minute: "2-digit" })} · Beklenti ${e.forecast ?? "—"}${esc(e.unit)} · Önceki ${e.previous ?? "—"}${esc(e.unit)}</div></div>
      ${e.actual != null ? `<b class="small">${e.actual}${esc(e.unit)}</b>` : ""}</div>`).join("")}<a class="small" href="#/takvim">Tüm takvim ›</a></div>`
      : `<div class="card small muted">Bugün ve yarın çok önemli veri yok. <a href="#/takvim">Takvime bak ›</a></div>`;
  }).catch(() => {});

  sentimentCard(el.querySelector("#mood"));
  pulseSection(el.querySelector("#pulse"));
}

async function favBox(box) {
  const l = favs.all();
  if (!l.length) {
    box.innerHTML = `<div class="card small muted" style="margin-top:12px">☆ İzleme listeniz boş. Bir şirketin ya da kriptonun sayfasında "İzlemeye al"a tıklayınca burada görünür.</div>`;
    return;
  }
  box.innerHTML = `<h2>İzleme listem</h2><div class="grid" id="fl" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))"></div>`;
  const fl = box.querySelector("#fl");
  const href = (f) => (f.k === "coin" ? "kripto/" : f.k === "bist" ? "bist/" : "hisse/") + f.s;
  fl.innerHTML = l.map((f) => `<div class="card row" data-h="${href(f)}" style="cursor:pointer;padding:10px" data-f="${f.k}:${esc(f.s)}">
    <span class="lg">${logo(f.k === "us" ? usLogo(f.s) : "", f.n, 30)}</span><div class="grow"><div class="ell"><b>${esc(f.n)}</b></div><div class="tiny muted">${esc(f.s.toUpperCase())}</div></div>
    <div style="text-align:right"><div class="small v">…</div><div class="c"></div></div></div>`).join("");
  bindLinks(fl);
  const set = (k, s, v, c, img) => {
    const e = fl.querySelector(`[data-f="${k}:${CSS.escape(s)}"]`); if (!e) return;
    e.querySelector(".v").textContent = v; e.querySelector(".c").innerHTML = pill(c);
    if (img) e.querySelector(".lg").innerHTML = logo(img, e.querySelector("b").textContent, 30);
  };
  const us = l.filter((f) => f.k === "us").map((f) => f.s), bi = l.filter((f) => f.k === "bist").map((f) => f.s);
  if (us.length) tvByNames("america", us).then((m) => us.forEach((s) => m[s] && set("us", s, price(m[s].close) + " $", m[s].change, tvLogo(m[s].logoid)))).catch(() => {});
  if (bi.length) tvByNames("turkey", bi).then((m) => bi.forEach((s) => m[s] && set("bist", s, price(m[s].close) + " ₺", m[s].change, tvLogo(m[s].logoid)))).catch(() => {});
  if (l.some((f) => f.k === "coin")) coins().then((cs) => l.filter((f) => f.k === "coin").forEach((f) => {
    const c = cs.find((x) => x.id === f.s); if (c) set("coin", f.s, price(c.current_price) + " $", c.price_change_percentage_24h, c.image);
  })).catch(() => {});
}
