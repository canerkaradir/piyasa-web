import { esc, price, pill, metric, f1, f2, pct, spark } from "../ui.js";
import { cnbcQuotes, num, bars, RANGES, local } from "../api.js";
import { rangeChart } from "../chart.js";
import { every, bindLinks } from "../core.js";
import { newsCard, disclaimer } from "../widgets.js";

const METALS = {
  altin: ["XAU=", "Altın", /altın|gold/i],
  gumus: ["XAG=", "Gümüş", /gümüş|silver/i],
};

export async function render(el, [m]) {
  if (m && METALS[m]) return metalPage(el, m);
  el.innerHTML = `<h1>Emtia</h1><div class="small muted">Değerli metaller, ons başına dolar.</div>
    <div class="grid g2" style="margin-top:10px">${Object.entries(METALS).map(([k, [s, n]]) => `<div class="card" data-h="emtia/${k}" style="cursor:pointer">
      <div class="row between"><div><div class="muted">${n} (ons)</div><div style="font-size:24px;font-weight:800" data-v="${s}">…</div><div data-c="${s}"></div></div><div data-sp="${s}"></div></div></div>`).join("")}</div>
    <div class="card" data-h="altin-tahmin" style="cursor:pointer;margin-top:12px"><b>📈 Altın tahmin takibi</b><div class="small muted">29 Ocak 2026 zirvesinden sonraki 15 yıllık formül tahmini ile gerçekleşen fiyatın karşılaştırması.</div></div>
    ${disclaimer("CNBC")}`;
  bindLinks(el);
  for (const [s] of Object.values(METALS)) bars(s, "1Y").then((b) => (el.querySelector(`[data-sp="${CSS.escape(s)}"]`).innerHTML = spark(b.map((x) => x.c), 160, 50))).catch(() => {});
  const q = async () => {
    const r = await cnbcQuotes(Object.values(METALS).map((x) => x[0])).catch(() => ({}));
    for (const [s] of Object.values(METALS)) if (r[s]) {
      el.querySelector(`[data-v="${CSS.escape(s)}"]`).textContent = price(num(r[s].last)) + " $";
      el.querySelector(`[data-c="${CSS.escape(s)}"]`).innerHTML = pill(num(r[s].change_pct));
    }
  };
  q(); every(60_000, q);
}

async function metalPage(el, key) {
  const [sym, name, re] = METALS[key];
  const gold = key === "altin";
  el.innerHTML = `<h1>${name} <span class="muted" style="font-size:16px">(ons, $)</span></h1>
    <div class="row wrap"><div style="font-size:28px;font-weight:800" id="px">…</div><div id="ch"></div><div class="small muted" id="gram"></div></div>
    <div class="card" id="chart" style="margin-top:10px"></div>
    <div class="grid g2" style="margin-top:4px">
      <div><h2>Göstergeler</h2><div class="card" id="mx"><div class="spinner"></div></div>
        <h2>${name} fiyatını ne etkiler?</h2><div class="card small">${gold
    ? "• <b>Faizler:</b> Fed faiz indirirse ya da indirim beklentisi artarsa altın genelde yükselir.<br>• <b>Dolar:</b> Zayıf dolar altını destekler.<br>• <b>Belirsizlik:</b> Savaş, kriz, seçim gibi dönemlerde 'güvenli liman' talebi artar.<br>• <b>Merkez bankaları:</b> Çin, Hindistan, Türkiye gibi ülkelerin merkez bankası alımları fiyatı destekler.<br>• <b>Enflasyon:</b> Paranın değer kaybından korunmak için altına yönelim artar."
    : "• Altınla aynı etkenler (faiz, dolar, belirsizlik) gümüşü de etkiler, ama hareketleri daha serttir.<br>• <b>Sanayi talebi:</b> Gümüşün yaklaşık yarısı güneş paneli, elektronik ve otomotivde kullanılır; ekonomi büyürken talep artar.<br>• <b>Piyasa küçüktür:</b> Az parayla fiyat çok oynayabilir."}</div>
        ${gold ? `<div class="card" data-h="altin-tahmin" style="cursor:pointer;margin-top:12px"><b>📈 Altın tahmin takibi ›</b><div class="small muted">Formül tahmini ile gerçek fiyatın karşılaştırması.</div></div>` : ""}</div>
      <div><h2>${name} ile ilgili haberler</h2><div id="news"><div class="spinner"></div></div></div>
    </div>
    ${disclaimer("CNBC, Google Haberler")}`;
  bindLinks(el);
  rangeChart(el.querySelector("#chart"), RANGES.map((r) => r.label), "1Y", ["1G", "5G"], (l) => bars(sym, l));
  const load = async () => {
    const q = await cnbcQuotes(["XAU=", "XAG=", ".DXY", "US10Y"]).catch(() => ({}));
    const o = q[sym]; if (!o) return;
    const last = num(o.last), hi = num(o.yrhiprice), lo = num(o.yrloprice);
    el.querySelector("#px").textContent = price(last) + " $";
    el.querySelector("#ch").innerHTML = pill(num(o.change_pct));
    el.querySelector("#gram").textContent = `Gram karşılığı: ${price(last / 31.1035)} $`;
    const au = num(q["XAU="] && q["XAU="].last), ag = num(q["XAG="] && q["XAG="].last);
    const d = q[".DXY"], y = q.US10Y, dc = d ? num(d.change_pct) : null;
    const r = au && ag ? au / ag : null;
    el.querySelector("#mx").innerHTML = [
      metric("52 hafta en yüksek / en düşük", `${price(hi)} / ${price(lo)}`, "Son bir yıldaki en yüksek ve en düşük fiyat.", hi && last ? `Zirvenin %${f1((1 - last / hi) * 100)} altında.` : null),
      r ? metric("Altın / gümüş oranı", f1(r), "1 ons altınla kaç ons gümüş alınabildiği. Uzun dönem ortalaması 60–70 civarıdır. Oran yüksekse gümüş altına göre ucuz, düşükse pahalı kabul edilir.",
        r > 80 ? "Gümüş altına göre tarihsel olarak ucuz." : r < 55 ? "Gümüş altına göre tarihsel olarak pahalı." : "Tarihsel ortalamaya yakın.") : "",
      d ? metric("Dolar endeksi (DXY)", d.last, "Doların 6 büyük para birimine karşı değeri. Altın dolarla fiyatlandığı için dolar güçlenince altın genelde düşer.",
        dc != null ? `Bugün ${pct(dc)}` + (dc > 0 ? " (altın için olumsuz yön)" : dc < 0 ? " (altın için olumlu yön)" : "") : null) : "",
      y ? metric("ABD 10 yıllık tahvil faizi", y.last, "Altın faiz getirmez. Tahvil faizi yükseldikçe altın tutmanın 'fırsat maliyeti' artar, bu yüzden faiz yükselişleri altını genelde baskılar.",
        `Bugünkü değişim: ${y.change} puan`) : "",
    ].join("");
  };
  load(); every(60_000, load);
  local("news.json").then((l) => {
    const n = l.filter((x) => re.test(x.tr || "") || re.test(x.title) || (x.tags || []).some((t) => re.test(t))).slice(0, 10);
    el.querySelector("#news").innerHTML = n.map(newsCard).join("") || `<div class="muted small">Son 48 saatte haber yok.</div>`;
  }).catch(() => (el.querySelector("#news").innerHTML = ""));
}
