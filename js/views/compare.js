import { esc, pct, big, f1, f2 } from "../ui.js";
import { bars, cnbcSym, tvByNames } from "../api.js";
import { go, onLeave } from "../core.js";
import { stockPicker, disclaimer } from "../widgets.js";

const COLORS = ["#1f6feb", "#e8a317", "#2e7d32"];
const RG = ["1A", "3A", "6A", "1Y", "2Y", "3Y", "5Y", "10Y"];
const ROWS = [
  ["Piyasa değeri", "market_cap_basic", (v) => big(v)], ["F/K", "price_earnings_ttm", (v) => (v > 0 ? f1(v) : "—")],
  ["Net kâr marjı", "net_margin", (v) => "%" + f1(v)], ["Brüt marj", "gross_margin", (v) => "%" + f1(v)],
  ["ROE", "return_on_equity", (v) => "%" + f1(v)], ["Borç/Özsermaye", "debt_to_equity", (v) => f2(v)],
  ["Temettü verimi", "dividend_yield_recent", (v) => "%" + f2(v)], ["Beta", "beta_1_year", (v) => f2(v)],
  ["1 yıllık getiri", "Perf.Y", (v) => pct(v)], ["5 yıllık getiri", "Perf.5Y", (v) => pct(v)],
];

export async function render(el, syms) {
  const picks = syms.filter(Boolean).slice(0, 3);
  let range = "1Y";
  el.innerHTML = `<h1>Karşılaştır</h1><div class="small muted">En fazla 3 şirketi yan yana karşılaştırın.</div>
    <div class="row wrap" id="picks" style="margin:10px 0"></div><div id="pk"></div>
    <div class="small" style="margin-top:6px">Örnek: <a href="#/karsilastir/NVDA/AMD/AVGO">Nvidia · AMD · Broadcom</a> · <a href="#/karsilastir/AAPL/MSFT/GOOGL">Apple · Microsoft · Alphabet</a></div>
    <div id="body"></div>${disclaimer("TradingView, CNBC")}`;
  el.querySelector("#picks").innerHTML = picks.map((s, i) => `<span class="chip on" style="border-color:${COLORS[i]}">${esc(s)} <a href="#" data-x="${i}" style="color:var(--muted)">✕</a></span>`).join("");
  el.querySelectorAll("[data-x]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); const p = picks.slice(); p.splice(+a.dataset.x, 1); go("karsilastir/" + p.join("/")); }));
  if (picks.length < 3) stockPicker(el.querySelector("#pk"), "Şirket ekle (ör. Tesla)", (s) => go("karsilastir/" + [...picks, s].join("/")));
  if (!picks.length) return;
  const body = el.querySelector("#body");
  body.innerHTML = `<div class="card" style="margin-top:12px"><div class="chips" id="rg">${RG.map((r) => `<button class="chip" data-r="${r}">${r}</button>`).join("")}</div>
    <div id="leg" class="row wrap small"></div><canvas class="chart" id="cv" height="320"></canvas>
    <div class="tiny muted">Grafik, her şirketin seçilen dönemin başından bu yana yüzde değişimini gösterir; böylece fiyatları farklı olsa da aynı ölçekte karşılaştırılabilirler.</div></div>
    <h2>Göstergeler</h2><div id="tb"><div class="spinner"></div></div>`;
  const cv = body.querySelector("#cv"), rg = body.querySelector("#rg");
  let series = [];
  async function load() {
    rg.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.r === range));
    series = await Promise.all(picks.map((s) => bars(cnbcSym(s), range).catch(() => [])));
    draw();
  }
  function draw() {
    const W = cv.clientWidth, H = 320, dpr = devicePixelRatio || 1, right = W - 50;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const norm = series.map((b) => (b.length ? b.map((p) => ({ t: p.t, v: (p.c / b[0].c - 1) * 100 })) : []));
    const all = norm.flat(); if (!all.length) return;
    const t0 = Math.min(...all.map((p) => p.t)), t1 = Math.max(...all.map((p) => p.t));
    const mn = Math.min(0, ...all.map((p) => p.v)), mx = Math.max(0, ...all.map((p) => p.v));
    const x = (t) => ((t - t0) / (t1 - t0 || 1)) * right, y = (v) => H - 20 - ((v - mn) / (mx - mn || 1)) * (H - 30);
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    ctx.font = "11px system-ui"; ctx.strokeStyle = css("--line"); ctx.fillStyle = css("--muted");
    for (let k = 0; k <= 4; k++) { const v = mn + ((mx - mn) * k) / 4; ctx.beginPath(); ctx.moveTo(0, y(v)); ctx.lineTo(right, y(v)); ctx.stroke(); ctx.fillText(pct(v), right + 3, y(v) + 4); }
    ctx.strokeStyle = css("--muted"); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, y(0)); ctx.lineTo(right, y(0)); ctx.stroke(); ctx.setLineDash([]);
    norm.forEach((l, i) => { ctx.beginPath(); l.forEach((p, j) => (j ? ctx.lineTo(x(p.t), y(p.v)) : ctx.moveTo(x(p.t), y(p.v)))); ctx.strokeStyle = COLORS[i]; ctx.lineWidth = 2; ctx.stroke(); });
    ctx.fillStyle = css("--muted");
    ctx.fillText(new Date(t0).toLocaleDateString("tr-TR"), 0, H - 4);
    body.querySelector("#leg").innerHTML = norm.map((l, i) => `<b style="color:${COLORS[i]}">${esc(picks[i])} ${l.length ? pct(l[l.length - 1].v) : "veri yok"}</b>`).join(" · ");
  }
  rg.onclick = (e) => { const r = e.target.dataset.r; if (!r) return; range = r; load(); };
  const rs = () => draw(); window.addEventListener("resize", rs); onLeave(() => window.removeEventListener("resize", rs));
  load();
  try {
    const m = await tvByNames("america", picks);
    body.querySelector("#tb").innerHTML = `<table class="t"><thead><tr><th></th>${picks.map((s, i) => `<th style="color:${COLORS[i]}"><a href="#/hisse/${esc(s)}">${esc(s)}</a></th>`).join("")}</tr></thead>
      <tbody>${ROWS.map(([l, k, f]) => `<tr><td class="small">${l}</td>${picks.map((s) => `<td><b class="small">${m[s] && m[s][k] != null ? f(m[s][k]) : "—"}</b></td>`).join("")}</tr>`).join("")}</tbody></table>
      <div class="tiny muted">Göstergelerin anlamı için <a href="#/sozluk">Sözlük</a>.</div>`;
  } catch (e) { body.querySelector("#tb").innerHTML = `<div class="err">Göstergeler alınamadı.</div>`; }
}
