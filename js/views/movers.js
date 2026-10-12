import { esc, price, pill, big, amount, logo, tvLogo, cleanName } from "../ui.js";
import { scanSorted, LIST_COLS } from "../api.js";
import { bindLinks } from "../core.js";
import { disclaimer } from "../widgets.js";

const MIN = { left: "market_cap_basic", operation: "greater", right: 3e8 };

function table(rows, cur, vol) {
  return `<div class="card" style="padding:4px 10px">${rows.map((r) => {
    const n = cleanName(r.description);
    return `<div class="row" data-h="${cur === "₺" ? "bist" : "hisse"}/${esc(r.name)}" style="cursor:pointer;padding:7px 0;border-bottom:1px solid var(--line)">${logo(tvLogo(r.logoid), n, 28)}
      <div class="grow"><div class="ell small"><b>${esc(n)}</b></div><div class="tiny muted">${esc(r.name)} · ${big(r.market_cap_basic, cur)}${vol ? " · hacim " + amount(r.volume) : ""}</div></div>
      <div style="text-align:right"><div class="small">${price(r.close)} ${cur}</div>${pill(r.change)}</div></div>`;
  }).join("")}</div>`;
}

export async function render(el) {
  let kind = "SPX";
  el.innerHTML = `<h1>Yükselenler / düşenler</h1><div class="small muted">Bugün en çok yükselen, en çok düşen ve en çok işlem gören şirketler. Çok küçük şirketler (300 milyon $ altı) gösterilmez.</div>
    <div class="chips"><button class="chip" data-k="SPX">S&P 500</button><button class="chip" data-k="NASDAQ">Nasdaq</button><button class="chip" data-k="RUT">Russell 2000</button><button class="chip" data-k="BIST30">BIST 30</button></div>
    <div class="grid g3" id="g"></div>
    <div class="card small" style="margin-top:12px">Bir hisse bir günde %10'dan fazla hareket ediyorsa genelde arkasında bir haber vardır: bilanço, satın alma, ilaç onayı, analist notu, dava… Şirketin sayfasından haberlere bakarak nedenini öğrenebilirsiniz. Sert yükselişlerin bir kısmı sonraki günlerde geri verilir.</div>
    ${disclaimer("TradingView")}`;
  const g = el.querySelector("#g"), chips = el.querySelector(".chips");
  async function load() {
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.k === kind));
    g.innerHTML = `<div class="spinner"></div>`;
    const cur = kind === "BIST30" ? "₺" : "$", n = kind === "BIST30" ? 8 : 15, ex = kind === "BIST30" ? [] : [MIN];
    try {
      const [up, down, act] = await Promise.all([
        scanSorted(kind, "change", "desc", n, ex), scanSorted(kind, "change", "asc", n, ex),
        scanSorted(kind, "Value.Traded", "desc", n, ex, [...LIST_COLS, "volume"]),
      ]);
      g.innerHTML = `<div><h2 class="up">▲ En çok yükselenler</h2>${table(up.rows, cur)}</div><div><h2 class="down">▼ En çok düşenler</h2>${table(down.rows, cur)}</div><div><h2>⇅ En çok işlem görenler</h2>${table(act.rows, cur, true)}</div>`;
      bindLinks(g);
    } catch (e) { g.innerHTML = `<div class="err">Liste alınamadı.</div>`; }
  }
  chips.onclick = (e) => { const k = e.target.dataset.k; if (!k) return; kind = k; load(); };
  load();
}
