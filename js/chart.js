// Etkileşimli fiyat grafiği: aralık seçimi, iki nokta ölçümü, hareketli ortalamalar ve RSI
import { esc, price, pct, spinner, TRL } from "./ui.js";

export function sma(vals, n) {
  const out = []; let s = 0;
  vals.forEach((v, i) => { s += v; if (i >= n) s -= vals[i - n]; out.push(i >= n - 1 ? s / n : null); });
  return out;
}
export function rsi(vals, n = 14) {
  const out = [null]; let g = 0, l = 0;
  for (let i = 1; i < vals.length; i++) {
    const ch = vals[i] - vals[i - 1], up = Math.max(ch, 0), dn = Math.max(-ch, 0);
    if (i <= n) { g += up; l += dn; if (i === n) { g /= n; l /= n; } }
    else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; }
    out.push(i >= n ? (l === 0 ? 100 : 100 - 100 / (1 + g / l)) : null);
  }
  return out;
}

function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

/**
 * container içine aralık düğmeleri + grafik çizer.
 * loader(label) -> Promise<[{t, c}]>
 */
export function rangeChart(container, labels, initial, intraday, loader, opts = {}) {
  const id = "c" + Math.random().toString(36).slice(2);
  container.innerHTML = `
    <div class="chips" id="${id}-r">${labels.map((l) => `<button class="chip ${l === initial ? "on" : ""}" data-l="${l}">${l}</button>`).join("")}</div>
    <div class="chart-info" id="${id}-i"></div>
    <div class="chart-wrap"><canvas class="chart" id="${id}-c" height="${opts.height || 300}"></canvas></div>
    <div class="chips" id="${id}-x" style="display:none">
      <span class="small muted" style="align-self:center">Göstergeler:</span>
      <button class="chip" data-x="ma50">Ort. 50</button><button class="chip" data-x="ma200">Ort. 200</button><button class="chip" data-x="rsi">RSI</button>
    </div>
    <div id="${id}-rsi"></div><div id="${id}-note" class="tiny muted"></div>`;
  const st = { label: initial, bars: null, a: null, b: null, hover: null, ma50: false, ma200: false, rsi: false };
  const cv = container.querySelector(`#${id}-c`), info = container.querySelector(`#${id}-i`);

  async function load() {
    st.a = st.b = st.hover = null; st.bars = null;
    info.innerHTML = spinner();
    const ctx = cv.getContext("2d"); ctx.clearRect(0, 0, cv.width, cv.height);
    try {
      const b = await loader(st.label);
      if (!b || b.length < 2) throw new Error("boş");
      st.bars = b;
    } catch (e) { info.innerHTML = `<div class="err">Grafik verisi alınamadı.</div>`; return; }
    container.querySelector(`#${id}-x`).style.display = st.bars.length > 30 ? "flex" : "none";
    draw();
  }

  function fmtDate(t) {
    const d = new Date(t);
    return intraday.includes(st.label)
      ? d.toLocaleString(TRL, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(TRL, { day: "numeric", month: "short", year: "numeric" });
  }

  function draw() {
    const b = st.bars; if (!b) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = opts.height || 300;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const vals = b.map((x) => x.c);
    const m50 = st.ma50 ? sma(vals, 50) : null, m200 = st.ma200 ? sma(vals, 200) : null;
    const all = vals.concat((m50 || []).filter((x) => x != null), (m200 || []).filter((x) => x != null));
    const min = Math.min(...all), max = Math.max(...all), span = max - min || 1;
    const bottom = H - 20, top = 8, right = W - 52;
    const x = (i) => (i / (b.length - 1)) * right;
    const y = (v) => bottom - ((v - min) / span) * (bottom - top);
    const up = vals[vals.length - 1] >= vals[0];
    const col = up ? "#1b7f3b" : "#c62828";
    // ızgara + fiyat etiketleri
    ctx.font = "11px system-ui"; ctx.fillStyle = css("--muted"); ctx.strokeStyle = css("--line"); ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const v = min + (span * k) / 4, yy = y(v);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(right, yy); ctx.stroke();
      ctx.fillText(price(v), right + 4, yy + 4);
    }
    // seçili aralık
    if (st.a != null && st.b != null) {
      const l = Math.min(x(st.a), x(st.b)), r = Math.max(x(st.a), x(st.b));
      ctx.fillStyle = (b[Math.max(st.a, st.b)].c >= b[Math.min(st.a, st.b)].c ? "#1b7f3b" : "#c62828") + "1f";
      ctx.fillRect(l, 0, r - l, bottom);
    }
    // alan + çizgi
    ctx.beginPath(); vals.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.lineTo(x(b.length - 1), bottom); ctx.lineTo(0, bottom); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, bottom); g.addColorStop(0, col + "40"); g.addColorStop(1, col + "00");
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); vals.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    [[m50, "#1f6feb"], [m200, "#e8a317"]].forEach(([m, c]) => {
      if (!m) return; ctx.beginPath(); let s = false;
      m.forEach((v, i) => { if (v == null) return; if (!s) { ctx.moveTo(x(i), y(v)); s = true; } else ctx.lineTo(x(i), y(v)); });
      ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.stroke();
    });
    // tarih etiketleri
    ctx.fillStyle = css("--muted");
    ctx.fillText(fmtDate(b[0].t), 0, H - 4);
    const end = fmtDate(b[b.length - 1].t); ctx.fillText(end, right - ctx.measureText(end).width, H - 4);
    // işaretler
    for (const i of [st.a, st.b]) if (i != null) {
      ctx.strokeStyle = css("--accent"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x(i), 0); ctx.lineTo(x(i), bottom); ctx.stroke();
      ctx.fillStyle = css("--accent"); ctx.beginPath(); ctx.arc(x(i), y(vals[i]), 4, 0, 7); ctx.fill();
    }
    if (st.a != null && st.b != null && st.a !== st.b) {
      const p = Math.min(st.a, st.b), q = Math.max(st.a, st.b), c = (vals[q] / vals[p] - 1) * 100;
      const cc = c >= 0 ? "#1b7f3b" : "#c62828";
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = cc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x(p), y(vals[p])); ctx.lineTo(x(q), y(vals[q])); ctx.stroke(); ctx.restore();
      const txt = (c >= 0 ? "▲ " : "▼ ") + pct(c);
      ctx.font = "bold 15px system-ui"; const tw = ctx.measureText(txt).width, bw = tw + 22, bh = 26;
      const cx = Math.max(bw / 2, Math.min(right - bw / 2, (x(p) + x(q)) / 2));
      ctx.fillStyle = cc; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx - bw / 2, 4, bw, bh, 13); else ctx.rect(cx - bw / 2, 4, bw, bh);
      ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText(txt, cx - tw / 2, 22); ctx.font = "11px system-ui";
    }
    if (st.hover != null) {
      ctx.strokeStyle = "#8888"; ctx.beginPath(); ctx.moveTo(x(st.hover), 0); ctx.lineTo(x(st.hover), bottom); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x(st.hover), y(vals[st.hover]), 4, 0, 7); ctx.fill();
    }
    renderInfo();
    renderRsi();
    container.querySelector(`#${id}-note`).textContent = (st.ma50 || st.ma200)
      ? "Hareketli ortalama genel eğilimi gösterir. Fiyat 200 günlük ortalamanın üstündeyse uzun vadeli eğilim genelde yukarı kabul edilir; 50'liğin 200'lüğü yukarı kesmesi \"altın kesişim\", aşağı kesmesi \"ölüm kesişimi\" diye anılır. Ortalama, grafikte yeterli geçmiş varsa çizilir."
      : "";
  }

  function renderInfo() {
    const b = st.bars, f = b[0].c, l = b[b.length - 1].c;
    if (st.a != null && st.b != null) {
      const [p, q] = st.a <= st.b ? [st.a, st.b] : [st.b, st.a];
      const c = (b[q].c / b[p].c - 1) * 100;
      info.innerHTML = `<div class="row wrap"><span class="small">İki nokta arası:</span> <b class="${c >= 0 ? "up" : "down"}" style="font-size:18px">${pct(c)}</b>
        <span class="small muted">${fmtDate(b[p].t)}: ${price(b[p].c)} → ${fmtDate(b[q].t)}: ${price(b[q].c)}</span></div>
        <div class="tiny muted">Yeni ölçüm için tekrar tıklayın ya da kaydırın.</div>`;
    } else if (st.a != null) {
      info.innerHTML = `<div><b>${price(b[st.a].c)}</b> <span class="small muted">${fmtDate(b[st.a].t)}</span></div><div class="tiny" style="color:var(--accent)">Farkı görmek için ikinci noktaya tıklayın.</div>`;
    } else if (st.hover != null) {
      info.innerHTML = `<div><b>${price(b[st.hover].c)}</b> <span class="small muted">${fmtDate(b[st.hover].t)} · başlangıca göre ${pct((b[st.hover].c / f - 1) * 100)}</span></div><div class="small" style="color:var(--accent)">📏 İki noktaya tıklayın ya da basılı tutup sağa-sola kaydırın: aradaki yükseliş/düşüş yüzdesi görünür.</div>`;
    } else {
      const c = (l / f - 1) * 100;
      info.innerHTML = `<div class="row wrap"><span class="small">Bu aralıkta:</span> <b class="${c >= 0 ? "up" : "down"}">${pct(c)}</b>
        <span class="small muted">en yüksek ${price(Math.max(...b.map((x) => x.c)))} · en düşük ${price(Math.min(...b.map((x) => x.c)))}</span></div>
        <div class="small" style="color:var(--accent)">📏 İki noktaya tıklayın ya da basılı tutup sağa-sola kaydırın: aradaki yükseliş/düşüş yüzdesi görünür.</div>`;
    }
  }

  function renderRsi() {
    const box = container.querySelector(`#${id}-rsi`);
    if (!st.rsi || !st.bars) { box.innerHTML = ""; return; }
    const r = rsi(st.bars.map((x) => x.c)), last = r[r.length - 1];
    const w = cv.clientWidth - 52, h = 70;
    const pts = r.map((v, i) => (v == null ? null : `${(i / (r.length - 1)) * w},${h - (v / 100) * h}`)).filter(Boolean).join(" ");
    box.innerHTML = `<div class="small">RSI (14): <b class="${last >= 70 ? "down" : last <= 30 ? "up" : ""}">${last == null ? "—" : Math.round(last)}</b>
      <span class="muted">${last == null ? "" : last >= 70 ? "aşırı alım bölgesi" : last <= 30 ? "aşırı satım bölgesi" : "normal bölge"}</span></div>
      <svg width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h * 0.3}" fill="#c628281a"/><rect x="0" y="${h * 0.7}" width="${w}" height="${h * 0.3}" fill="#1b7f3b1a"/>
      <polyline points="${pts}" fill="none" stroke="#7e57c2" stroke-width="1.6"/></svg>
      <div class="tiny muted">RSI son 14 çubuktaki yükseliş ve düşüşlerin gücünü 0–100 arasında ölçer. 70 üstü "aşırı alım" (geri çekilme gelebilir), 30 altı "aşırı satım" (düşüş abartılmış olabilir). Güçlü eğilimlerde uzun süre bu bölgelerde kalabilir.</div>`;
  }

  function idxAt(ev) {
    const r = cv.getBoundingClientRect();
    const right = r.width - 52;
    return Math.max(0, Math.min(st.bars.length - 1, Math.round(((ev.clientX - r.left) / right) * (st.bars.length - 1))));
  }
  // Dokun/tıkla: iki nokta. Basılı tutup kaydır: başlangıçtan bırakılan yere kadar.
  let down = null;
  cv.addEventListener("pointerdown", (ev) => { if (!st.bars) return; down = { x: ev.clientX, i: idxAt(ev), moved: false }; });
  cv.addEventListener("pointermove", (ev) => {
    if (!st.bars) return;
    if (down) {
      if (!down.moved && Math.abs(ev.clientX - down.x) > 8) { down.moved = true; st.a = down.i; try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* yoksay */ } }
      if (down.moved) { st.b = idxAt(ev); st.hover = null; draw(); }
      return;
    }
    if (st.a != null) return; st.hover = idxAt(ev); draw();
  });
  cv.addEventListener("pointerup", (ev) => {
    if (!st.bars || !down) return;
    if (!down.moved) { const i = idxAt(ev); if (st.a == null || st.b != null) { st.a = i; st.b = null; } else st.b = i; st.hover = null; draw(); }
    down = null;
  });
  cv.addEventListener("pointercancel", () => { down = null; });
  cv.addEventListener("mouseleave", () => { if (st.hover != null) { st.hover = null; draw(); } });
  container.querySelector(`#${id}-r`).addEventListener("click", (ev) => {
    const l = ev.target.dataset.l; if (!l) return;
    st.label = l;
    container.querySelectorAll(`#${id}-r .chip`).forEach((c) => c.classList.toggle("on", c.dataset.l === l));
    load();
  });
  container.querySelector(`#${id}-x`).addEventListener("click", (ev) => {
    const k = ev.target.dataset.x; if (!k) return;
    st[k] = !st[k]; ev.target.classList.toggle("on", st[k]); draw();
  });
  const onRs = () => { if (!document.body.contains(cv)) { window.removeEventListener("resize", onRs); return; } draw(); };
  window.addEventListener("resize", onRs);
  load();
}
