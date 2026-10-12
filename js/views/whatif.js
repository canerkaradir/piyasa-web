import { esc, price, pct, f1 } from "../ui.js";
import { bars, cnbcSym, getJSON, store } from "../api.js";
import { go } from "../core.js";
import { stockPicker, disclaimer } from "../widgets.js";

async function btc() {
  try {
    const a = await getJSON("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=1000");
    return a.map((k) => ({ t: k[0], c: parseFloat(k[4]) }));
  } catch (e) {
    const j = await getJSON("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365");
    return j.prices.map((p) => ({ t: p[0], c: p[1] }));
  }
}
const BASE = [["S&P 500", () => bars(".SPX", "Tüm")], ["Nasdaq", () => bars(".IXIC", "Tüm")], ["Altın", () => bars("XAU=", "Tüm")], ["Bitcoin", btc]];

export async function render(el, [sym]) {
  let amount = store.get("wiAmt", 1000), years = store.get("wiYears", 5);
  el.innerHTML = `<h1>Ne olurdu?</h1><div class="small muted">Geçmişte yatırım yapsaydınız bugün ne olurdu?</div>
    <div class="card" style="margin-top:10px"><div class="row wrap"><label class="small">Tutar ($)</label><input class="input" id="amt" type="number" min="1" value="${amount}" style="max-width:160px"></div>
      <div class="chips" id="yr">${[1, 3, 5, 10, 15, 20].map((y) => `<button class="chip" data-y="${y}">${y} yıl önce</button>`).join("")}</div>
      <div class="small">Şirket: <b>${sym ? esc(sym) : "seçilmedi"}</b></div><div id="pk" style="margin-top:6px"></div></div>
    <div class="grid g3" id="res" style="margin-top:12px"></div>
    ${disclaimer("CNBC, Binance")}<div class="footer-note">Hesap fiyat değişimine dayanır; temettüler, vergiler ve kur farkı dahil değildir. Geçmiş getiriler geleceği göstermez. Bitcoin verisi Binance'ten (2017 sonrası).</div>`;
  stockPicker(el.querySelector("#pk"), "Başka şirket seç (ör. Tesla)", (s) => go("neolurdu/" + s));
  const res = el.querySelector("#res"), yr = el.querySelector("#yr");
  const assets = [...(sym ? [[sym, () => bars(cnbcSym(sym), "Tüm")]] : []), ...BASE];
  const cache = {};
  async function calc() {
    yr.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", +c.dataset.y === years));
    res.innerHTML = assets.map(([n]) => `<div class="card" data-a="${esc(n)}"><div class="muted small">${esc(n)}</div><div class="spinner"></div></div>`).join("");
    const start = Date.now() - years * 365.25 * 86400_000;
    await Promise.all(assets.map(async ([n, f]) => {
      const box = res.querySelector(`[data-a="${CSS.escape(n)}"]`);
      try {
        const b = cache[n] || (cache[n] = await f());
        const first = b.find((p) => p.t >= start);
        if (!first || b[0].t > start + 30 * 86400_000) { box.innerHTML = `<div class="muted small">${esc(n)}</div><div class="small">Bu kadar eski veri yok.</div>`; return; }
        const mult = b[b.length - 1].c / first.c;
        box.innerHTML = `<div class="muted small">${esc(n)}</div><div style="font-size:22px;font-weight:800" class="${mult >= 1 ? "up" : "down"}">${price(amount * mult)} $</div>
          <div class="tiny muted">${pct((mult - 1) * 100)} · ${new Date(first.t).toLocaleDateString("tr-TR")}'dan beri · ${f1(mult)} kat</div>`;
      } catch (e) { box.innerHTML = `<div class="muted small">${esc(n)}</div><div class="small err">Veri alınamadı.</div>`; }
    }));
  }
  el.querySelector("#amt").oninput = (e) => { amount = Math.max(1, +e.target.value || 0); store.set("wiAmt", amount); calc(); };
  yr.onclick = (e) => { const y = e.target.dataset.y; if (!y) return; years = +y; store.set("wiYears", years); calc(); };
  calc();
}
