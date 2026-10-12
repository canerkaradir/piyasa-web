import { esc, price, pill, metric, f1, pct } from "../ui.js";
import { cnbcQuotes, num, bars, RANGES } from "../api.js";
import { rangeChart } from "../chart.js";
import { every } from "../core.js";
import { disclaimer } from "../widgets.js";

const INFO = {
  ".SPX": ["S&P 500", "ABD'nin en büyük 500 şirketinden oluşan, piyasa değeriyle ağırlıklandırılmış endeks. 'Piyasa' denince çoğu zaman bu kastedilir; emeklilik fonlarının çoğu bu endeksi takip eder.", "liste/SPX"],
  ".IXIC": ["Nasdaq Bileşik", "Nasdaq borsasındaki bütün şirketlerin endeksi. Apple, Microsoft, Nvidia gibi teknoloji devlerinin ağırlığı çok yüksek olduğu için teknoloji ve yapay zekâ haberlerine en duyarlı endekstir.", "liste/NASDAQ"],
  ".DJI": ["Dow Jones", "ABD'nin 30 büyük şirketinden oluşan en eski endeks. Fiyat ağırlıklı hesaplandığı için hissesi pahalı olan şirketin etkisi büyüktür; bu yüzden uzmanlar S&P 500'ü daha temsil edici bulur.", ""],
  ".RUT": ["Russell 2000", "ABD'nin 2000 küçük şirketinin endeksi. Bu şirketler daha çok borçla çalışır ve gelirlerinin çoğu ABD içinden gelir; bu yüzden faiz indirimlerinden ve ABD ekonomisinin gidişatından en çok etkilenen endekstir.", "liste/RUT"],
  ".XU030": ["BIST 30", "Borsa İstanbul'un en büyük ve en çok işlem gören 30 şirketinin endeksi. TL bazlı olduğu için yüksek enflasyon döneminde rakamsal olarak yükselirken dolar bazında farklı bir tablo çıkabilir.", "liste/BIST30"],
  ".VIX": ["VIX (korku endeksi)", "S&P 500 opsiyon fiyatlarından hesaplanan, önümüzdeki 30 gün için beklenen oynaklık. 12–20 arası sakin, 20–30 tedirgin, 30'un üstü panik dönemi sayılır. Piyasa düşerken VIX genelde sert yükselir.", ""],
  ".DXY": ["Dolar endeksi (DXY)", "Doların euro, yen, sterlin gibi 6 büyük para birimine karşı değeri. Dolar güçlenince altın ve gelişmekte olan ülke varlıkları genelde baskı görür.", ""],
  "TRY=": ["Dolar / TL", "1 doların kaç Türk lirası ettiği. Türkiye'de enflasyon yüksek olduğu için uzun vadede yükselme eğilimindedir.", ""],
  "US10Y": ["ABD 10 yıllık tahvil faizi", "ABD devletinin 10 yıllık borçlanma maliyeti. Konut kredisi faizlerinden şirket değerlemelerine kadar her şeyi etkiler. Yükselince özellikle teknoloji gibi geleceğe dönük kâr bekleyen hisseler baskılanır.", ""],
};

export async function render(el, [sym]) {
  const [title, desc, list] = INFO[sym] || [sym, "", ""];
  el.innerHTML = `<h1>${esc(title)}</h1>
    <div class="row wrap"><div style="font-size:28px;font-weight:800" id="px">…</div><div id="ch"></div>${list ? `<a class="btn ghost" href="#/${list}" style="margin-left:auto">Şirket listesi ›</a>` : ""}</div>
    <div class="card" id="chart" style="margin-top:10px"></div>
    <div class="grid g2" style="margin-top:12px"><div class="card"><h3 style="margin-top:0">Nedir?</h3><div class="small">${esc(desc)}</div></div><div class="card" id="mx"></div></div>
    ${disclaimer("CNBC")}`;
  rangeChart(el.querySelector("#chart"), RANGES.map((r) => r.label), "1Y", ["1G", "5G"], (l) => bars(sym, l));
  async function q() {
    const o = (await cnbcQuotes([sym]).catch(() => ({})))[sym]; if (!o) return;
    el.querySelector("#px").textContent = o.last + (sym === ".XU030" || sym === "TRY=" ? " ₺" : "");
    el.querySelector("#ch").innerHTML = pill(num(o.change_pct));
    const hi = num(o.yrhiprice), lo = num(o.yrloprice), last = num(o.last);
    el.querySelector("#mx").innerHTML = [
      metric("Bugün en yüksek / en düşük", `${o.high ?? "—"} / ${o.low ?? "—"}`, "Gün içinde görülen en yüksek ve en düşük seviye."),
      metric("Önceki kapanış", o.previous_day_closing ?? "—", "Bir önceki işlem gününün kapanış seviyesi; günlük değişim buna göre hesaplanır."),
      metric("52 hafta en yüksek / en düşük", `${o.yrhiprice ?? "—"} / ${o.yrloprice ?? "—"}`, "Son bir yıldaki en yüksek ve en düşük seviye.",
        hi && last ? `Zirvenin %${f1((1 - last / hi) * 100)} altında${lo ? `, dibin ${pct((last / lo - 1) * 100)} üstünde` : ""}.` : null),
    ].join("");
  }
  q(); every(60_000, q);
}
