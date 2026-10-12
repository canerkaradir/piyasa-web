import { esc, pct, sectorTr } from "../ui.js";
import { listPage } from "../api.js";
import { go, onLeave } from "../core.js";
import { disclaimer } from "../widgets.js";

// Kare ağırlıklı ağaç haritası (squarified treemap)
function squarify(items, x, y, w, h) {
  const out = [];
  const total = items.reduce((s, i) => s + i.v, 0);
  if (!total || !items.length) return out;
  const scale = (w * h) / total;
  let rest = items.map((i) => ({ ...i, a: i.v * scale }));
  while (rest.length) {
    const side = Math.min(w, h);
    let row = [], best = Infinity;
    for (const it of rest) {
      const tr = [...row, it], s = tr.reduce((a, b) => a + b.a, 0);
      const worst = Math.max(...tr.map((r) => Math.max((side * side * r.a) / (s * s), (s * s) / (side * side * r.a))));
      if (worst > best) break;
      best = worst; row = tr;
    }
    const s = row.reduce((a, b) => a + b.a, 0);
    if (w >= h) { const cw = s / h; let cy = y; for (const r of row) { const ch = r.a / cw; out.push({ ...r, x, y: cy, w: cw, h: ch }); cy += ch; } x += cw; w -= cw; }
    else { const ch = s / w; let cx = x; for (const r of row) { const cw = r.a / ch; out.push({ ...r, x: cx, y, w: cw, h: ch }); cx += cw; } y += ch; h -= ch; }
    rest = rest.slice(row.length);
  }
  return out;
}
const color = (c) => {
  if (c == null) return "#555";
  const t = Math.min(1, Math.abs(c) / 3);
  return c >= 0 ? `rgb(${Math.round(60 - 30 * t)},${Math.round(80 + 90 * t)},${Math.round(70 - 10 * t)})` : `rgb(${Math.round(90 + 130 * t)},${Math.round(60 - 20 * t)},${Math.round(65 - 20 * t)})`;
};

export async function render(el) {
  let kind = "SPX", rows = [];
  el.innerHTML = `<h1>Isı haritası</h1><div class="small muted">Kutuların büyüklüğü piyasa değerini, rengi bugünkü değişimi gösterir. Şirketler sektörlerine göre gruplanmıştır. Kutuya tıklayınca şirket sayfası açılır.</div>
    <div class="chips"><button class="chip on" data-k="SPX">S&P 500</button><button class="chip" data-k="NASDAQ">Nasdaq</button><button class="chip" data-k="RUT">Russell 2000</button></div>
    <div class="row small" style="gap:4px;margin-bottom:6px"><span>−3%</span>${[-3, -2, -1, 0, 1, 2, 3].map((v) => `<span style="width:28px;height:12px;background:${color(v)};display:inline-block"></span>`).join("")}<span>+3%</span></div>
    <div class="heat" id="heat"><div class="spinner"></div></div>${disclaimer("TradingView")}`;
  const heat = el.querySelector("#heat"), chips = el.querySelector(".chips");
  function draw() {
    const W = heat.clientWidth, H = Math.max(420, Math.min(760, W * 0.62));
    heat.style.height = H + "px";
    const by = {};
    for (const r of rows) if (r.market_cap_basic) (by[r.sector || "Diğer"] ||= []).push(r);
    const secs = Object.entries(by).map(([s, l]) => ({ s, v: l.reduce((a, b) => a + b.market_cap_basic, 0), l })).sort((a, b) => b.v - a.v);
    let html = "";
    for (const sec of squarify(secs, 0, 0, W, H)) {
      const items = sec.l.sort((a, b) => b.market_cap_basic - a.market_cap_basic).map((r) => ({ r, v: r.market_cap_basic }));
      const top = sec.h > 40 ? 14 : 0;
      for (const c of squarify(items, sec.x, sec.y + top, sec.w, sec.h - top)) {
        const fs = Math.max(8, Math.min(22, Math.sqrt(c.w * c.h) / 4.5));
        const show = c.w > 30 && c.h > 22;
        html += `<div class="cell" data-s="${esc(c.r.name)}" title="${esc(c.r.description)} ${pct(c.r.change)}" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;background:${color(c.r.change)};font-size:${fs}px">
          ${show ? `<b>${esc(c.r.name)}</b>${c.h > 40 ? `<span style="font-size:${fs * 0.75}px">${pct(c.r.change)}</span>` : ""}` : ""}</div>`;
      }
      if (top) html += `<div class="sec-label" style="left:${sec.x}px;top:${sec.y}px;width:${sec.w}px">${esc(sectorTr(sec.s))}</div>`;
    }
    heat.innerHTML = html;
  }
  async function load() {
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.k === kind));
    heat.innerHTML = `<div class="spinner"></div>`;
    try {
      const n = kind === "RUT" ? 300 : 250;
      const [a, b] = await Promise.all([listPage(kind, 0, 150), listPage(kind, 150, n - 150)]);
      rows = [...a.rows, ...b.rows];
      draw();
    } catch (e) { heat.innerHTML = `<div class="err" style="padding:20px">Veri alınamadı.</div>`; }
  }
  heat.onclick = (e) => { const c = e.target.closest(".cell"); if (c) go("hisse/" + c.dataset.s); };
  chips.onclick = (e) => { const k = e.target.dataset.k; if (!k) return; kind = k; load(); };
  const rs = () => rows.length && draw(); window.addEventListener("resize", rs); onLeave(() => window.removeEventListener("resize", rs));
  load();
}
