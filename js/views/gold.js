import { esc, pct, TRL } from "../ui.js";
import { getJSON } from "../api.js";
import { disclaimer } from "../widgets.js";
import { onLeave } from "../core.js";

const PEAK = 5501.70, ANCHOR = 251, WEAK = 3652, START = Date.UTC(2026, 0, 29);
const usd = (p) => PEAK * (1 + p / 100);
const money = (v) => Math.round(v).toLocaleString(TRL) + " $";
const pts = (v) => (v > 0 ? "+" : "") + v.toLocaleString(TRL, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateOf = (d) => new Date(START + d * 86400_000);
const fmtD = (d) => dateOf(d).toLocaleDateString(TRL, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const C = { act: "#1f6feb", fc: "#d4a017", raw: "#9e9e9e", band: "#d4a01733" };

async function loadModel() {
  const t = await (await fetch("data/altin.csv")).text();
  const rows = t.trim().split("\n").slice(1).map((l) => l.split(","));
  const n = (s) => (s === "" || s == null ? null : parseFloat(s));
  return { actual: rows.map((r) => n(r[2])), raw: rows.map((r) => n(r[3])), fc: rows.map((r) => n(r[4])), lo: rows.map((r) => n(r[5])), hi: rows.map((r) => n(r[6])) };
}
async function liveCloses() {
  const p = (x) => String(x).padStart(2, "0");
  const f = dateOf(ANCHOR + 1), t = new Date(Date.now() + 86400_000);
  const s = (d) => `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}000000`;
  const j = await getJSON(`https://ts-api.cnbc.com/harmony/app/bars/XAU%3D/1D/${s(f)}/${s(t)}/adjusted/EST5EDT.json`);
  const out = {};
  for (const b of (j.barData && j.barData.priceBars) || []) {
    if (b.open === b.high && b.high === b.low && b.low === b.close) continue;
    const ds = b.tradeTime.slice(0, 8);
    const day = Math.round((Date.UTC(+ds.slice(0, 4), +ds.slice(4, 6) - 1, +ds.slice(6, 8)) - START) / 86400_000);
    if (day > ANCHOR) out[day] = (parseFloat(b.close) / PEAK - 1) * 100;
  }
  return out;
}

export async function render(el) {
  el.innerHTML = `<h1>Altın tahmin takibi</h1><div class="small muted">29 Ocak 2026 zirvesinden (${money(PEAK)}) sonraki 15 yıl. Tüm değerler zirveye göre yüzde değişimdir.</div>
    <div class="card" id="sum" style="margin-top:10px"><div class="spinner"></div></div>
    <div class="card" style="margin-top:12px"><div class="chips" id="rg"></div><div id="info" class="chart-info small"></div>
      <canvas class="chart" id="cv" height="360"></canvas>
      <div class="small" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:14px">
        <span><b style="color:${C.act}">━</b> Gerçekleşen (7 Eki'ye kadar LBMA, sonrası CNBC spot)</span>
        <span><b style="color:${C.fc}">━</b> Güncellenmiş tahmin (7 Ekim'de gerçek fiyattan yeniden başlatıldı)</span>
        <span><b style="color:${C.fc};opacity:.5">▇</b> Bant: ±7,3 puan (≈ ±400 $)</span>
        <span><b style="color:${C.raw}">┅</b> İlk tahmin: formülün gerçek fiyatı hiç görmeden çizdiği yol</span></div></div>
    <div class="grid g2" style="margin-top:12px">
      <div class="card small"><b>İki tahmin ne demek?</b><br>İlk tahmin, formülün sadece 1980 ve 2011 altın hareketlerine bakarak çizdiği yoldur. 7 Ekim'de gerçek fiyat bu yolun epey altındaydı; güncellenmiş tahmin o gün gerçek fiyattan yeniden başlatıldı ve aradaki fark yaklaşık 2 yılda kapanarak formülün yoluna döner. GPS gibi: ilk rota ve bulunduğunuz yerden yeniden hesaplanan rota.</div>
      <div class="card small"><b>Bu tahmini okurken</b><br>• Formül yalnızca iki geçmiş örneğe dayanıyor (1980 ve 2011 zirveleri).<br>• Dalgaların zamanlaması güvenilmez; sadece genel seviyeye ve yöne bakın.<br>• 2036 sonrası (13.–15. yıl) döngüsel olduğu için zayıf; grafikte taralı.<br>• 730 günlük sönüm ve 181 günlük düzleştirme veriden değil, seçimle belirlendi.<br>• Formül faiz, dolar ve merkez bankası alımlarını bilmez.<br>• Bu bir öğrenme aracıdır, al/sat tavsiyesi değildir.</div>
    </div>${disclaimer("LBMA, CNBC")}`;
  const md = await loadModel();
  const N = md.fc.length;
  const act = md.actual.slice();
  try { const live = await liveCloses(); for (const [d, v] of Object.entries(live)) if (d < N) act[d] = v; } catch (e) { /* kayıtlı veri */ }
  let lastDay = 0; act.forEach((v, i) => { if (v != null) lastDay = i; });

  // özet
  const la = act[lastDay], f = md.fc[lastDay], r = md.raw[lastDay], lo = md.lo[lastDay], hi = md.hi[lastDay];
  const diff = la - f, inBand = lo != null && la >= lo && la <= hi;
  el.querySelector("#sum").innerHTML = `<div class="small muted">Zirveden sonra ${lastDay}. gün · ${fmtD(lastDay)}</div>
    <div class="grid g3" style="margin-top:6px">
      <div><div class="small" style="color:${C.act}">Gerçekleşen</div><b style="font-size:20px">${money(usd(la))}</b> <span class="small muted">(${pts(la)}%)</span></div>
      <div><div class="small" style="color:${C.fc}">Güncellenmiş tahmin</div><b style="font-size:20px">${money(usd(f))}</b> <span class="small muted">(${pts(f)}%)</span></div>
      <div><div class="small" style="color:${C.raw}">İlk tahmin (formül)</div><b style="font-size:20px">${money(usd(r))}</b> <span class="small muted">(${pts(r)}%)</span></div></div>
    <div class="small" style="margin-top:8px">Fark: <b>${pts(diff)} puan</b> (${money(Math.abs(usd(la) - usd(f)))} ${diff < 0 ? "güncellenmiş tahminin altında" : "güncellenmiş tahminin üstünde"}). ${lo == null ? "" : inBand ? "Gerçek fiyat bandın içinde." : "Gerçek fiyat bandın dışında."}</div>`;

  const RG = [[183, "6 ay"], [274, "9 ay"], [365, "1 yıl"], [548, "1,5 yıl"], [730, "2 yıl"], [913, "2,5 yıl"], [1096, "3 yıl"],
    [1461, "4 yıl"], [1826, "5 yıl"], [-2, "15 yıl"]];
  let span = 365, a = null, b = null, hover = null;
  const rg = el.querySelector("#rg"), cv = el.querySelector("#cv"), info = el.querySelector("#info");
  rg.innerHTML = RG.map(([d, l]) => `<button class="chip" data-d="${d}">${l}</button>`).join("");
  rg.onclick = (e) => { const d = e.target.dataset.d; if (!d) return; span = +d; a = b = null; draw(); };

  function geom() {
    const W = cv.clientWidth, H = 360, left = 46, right = W - 8, top = 10, bottom = H - 22;
    let start, end;
    if (span === -2) { start = 0; end = N - 1; }
    else { start = 0; end = Math.min(N - 1, lastDay + span); }
    const n = Math.max(1, end - start);
    let mn = Infinity, mx = -Infinity;
    for (let i = start; i <= end; i++) for (const v of [act[i], md.fc[i], md.raw[i], md.lo[i], md.hi[i]]) if (v != null) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
    const stp = mx - mn > 25 ? 10 : 5;
    mn = Math.floor(mn / stp) * stp; mx = Math.ceil(mx / stp) * stp;
    return { W, H, left, right, top, bottom, start, end, n, mn, mx, x: (i) => left + ((i - start) / n) * (right - left), y: (v) => bottom - ((v - mn) / (mx - mn || 1)) * (bottom - top) };
  }
  function line(ctx, g, arr, col, w, dash) {
    ctx.beginPath(); let s = false;
    for (let i = g.start; i <= g.end; i++) { const v = arr[i]; if (v == null) { s = false; continue; } if (!s) { ctx.moveTo(g.x(i), g.y(v)); s = true; } else ctx.lineTo(g.x(i), g.y(v)); }
    ctx.setLineDash(dash || []); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.setLineDash([]);
  }
  function draw() {
    rg.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", +c.dataset.d === span));
    const dpr = devicePixelRatio || 1, g = geom();
    cv.width = g.W * dpr; cv.height = g.H * dpr; cv.style.height = g.H + "px";
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, g.W, g.H);
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    ctx.font = "11px system-ui"; ctx.fillStyle = css("--muted"); ctx.strokeStyle = css("--line");
    const stepV = (g.mx - g.mn) / 5;
    for (let k = 0; k <= 5; k++) { const v = g.mn + stepV * k, yy = g.y(v); ctx.beginPath(); ctx.moveTo(g.left, yy); ctx.lineTo(g.right, yy); ctx.stroke(); ctx.fillText(Math.round(v) + "%", 2, yy + 4); }
    if (g.end > WEAK && g.start < WEAK) { ctx.fillStyle = "#8882"; ctx.fillRect(g.x(WEAK), g.top, g.right - g.x(WEAK), g.bottom - g.top); ctx.fillStyle = css("--muted"); ctx.fillText("zayıf bölge", g.x(WEAK) + 6, g.top + 14); }
    // bant
    ctx.beginPath(); let st = -1;
    for (let i = Math.max(g.start, 0); i <= g.end; i++) if (md.hi[i] != null) { if (st < 0) { st = i; ctx.moveTo(g.x(i), g.y(md.hi[i])); } else ctx.lineTo(g.x(i), g.y(md.hi[i])); }
    if (st >= 0) { for (let i = g.end; i >= st; i--) ctx.lineTo(g.x(i), g.y(md.lo[i])); ctx.closePath(); ctx.fillStyle = C.band; ctx.fill(); }
    line(ctx, g, md.raw, C.raw, 1.5, [5, 4]);
    line(ctx, g, md.fc, C.fc, 2.2);
    line(ctx, g, act, C.act, 2.2);
    ctx.fillStyle = css("--muted");
    if (lastDay >= g.start && lastDay <= g.end) { ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = "#1f6feb88"; ctx.beginPath(); ctx.moveTo(g.x(lastDay), g.top); ctx.lineTo(g.x(lastDay), g.bottom); ctx.stroke(); ctx.restore(); ctx.fillStyle = css("--muted"); ctx.fillText("bugün", g.x(lastDay) + 4, g.top + 12); }
    for (let k = 0; k <= 4; k++) { const d = g.start + Math.round((g.n * k) / 4), s = fmtD(d), w = ctx.measureText(s).width; ctx.fillText(s, Math.min(Math.max(g.x(d) - w / 2, g.left), g.right - w), g.H - 5); }
    if (a != null && b != null) { const l = Math.min(g.x(a), g.x(b)), r = Math.max(g.x(a), g.x(b)); ctx.fillStyle = "#1f6feb18"; ctx.fillRect(l, g.top, r - l, g.bottom - g.top); }
    for (const i of [a, b, hover]) if (i != null) { ctx.strokeStyle = "#8888"; ctx.beginPath(); ctx.moveTo(g.x(i), g.top); ctx.lineTo(g.x(i), g.bottom); ctx.stroke(); }
    renderInfo();
  }
  function at(d) {
    return `${fmtD(d)} (gün ${d}): tahmin ${money(usd(md.fc[d]))}` + (act[d] != null ? `, gerçek ${money(usd(act[d]))}` : "") + (md.lo[d] != null ? `, bant ${money(usd(md.lo[d]))}–${money(usd(md.hi[d]))}` : "");
  }
  function renderInfo() {
    if (a != null && b != null) {
      const [p, q] = a <= b ? [a, b] : [b, a];
      const fch = (usd(md.fc[q]) / usd(md.fc[p]) - 1) * 100;
      const g = act[p] != null && act[q] != null ? (usd(act[q]) / usd(act[p]) - 1) * 100 : null;
      info.innerHTML = `<div>${fmtD(p)} → ${fmtD(q)}</div><div>Tahmine göre değişim: <b>${pct(fch)}</b> (${money(usd(md.fc[p]))} → ${money(usd(md.fc[q]))})</div>
        ${g != null ? `<div>Gerçekleşen değişim: <b class="${g >= 0 ? "up" : "down"}">${pct(g)}</b> (${money(usd(act[p]))} → ${money(usd(act[q]))})</div>` : ""}<div class="tiny muted">Fiyat için tıklayın; yeni ölçüm için basılı tutup sürükleyin.</div>`;
    } else if (a != null) info.innerHTML = `<div>${esc(at(a))}</div><div class="tiny muted">İki nokta arasını ölçmek için basılı tutup sürükleyin.</div>`;
    else if (hover != null) info.innerHTML = `<div>${esc(at(hover))}</div><div class="tiny muted">Tıklayın: o günün değerleri. Basılı tutup sürükleyin: iki nokta arası yüzde değişim.</div>`;
    else info.innerHTML = `<div class="tiny muted">Tıklayın: o günün değerleri. Basılı tutup sürükleyin: iki nokta arası yüzde değişim.</div>`;
  }
  const idx = (ev) => { const g = geom(), r = cv.getBoundingClientRect(); return Math.max(g.start, Math.min(g.end, g.start + Math.round(((ev.clientX - r.left - g.left) / (g.right - g.left)) * g.n))); };
  let down = null;
  cv.style.touchAction = "pan-y";
  cv.onpointerdown = (ev) => { down = { x: ev.clientX, i: idx(ev), moved: false }; };
  cv.onpointermove = (ev) => {
    if (down) {
      if (!down.moved && Math.abs(ev.clientX - down.x) > 8) { down.moved = true; a = down.i; try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* yoksay */ } }
      if (down.moved) { b = idx(ev); hover = null; draw(); }
      return;
    }
    if (a != null) return; hover = idx(ev); draw();
  };
  cv.onpointerup = (ev) => { if (down && !down.moved) { a = idx(ev); b = null; hover = null; draw(); } down = null; };
  cv.onpointercancel = () => { down = null; };
  cv.onmouseleave = () => { hover = null; draw(); };
  window.addEventListener("resize", draw); onLeave(() => window.removeEventListener("resize", draw));
  draw();
}
