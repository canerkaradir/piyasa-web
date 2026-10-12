import { esc, price, pill, big, amount, pct, f1, logo, spark, metric } from "../ui.js";
import { coins, coinInfo, cryptoGlobal, getJSON, translate } from "../api.js";
import { rangeChart } from "../chart.js";
import { bindLinks, starBtn, bindStars, every } from "../core.js";
import { disclaimer } from "../widgets.js";

export async function render(el, [id]) {
  if (id) return coinPage(el, id);
  let all = [], shown = 100, q = "";
  el.innerHTML = `<h1>Kripto</h1><div class="small muted">Piyasa değerine göre ilk 500 kripto para. Fiyatlar dolar cinsinden.</div>
    <div id="glob" class="small" style="margin:8px 0"></div>
    <input class="input" id="q" placeholder="Kripto ara (ad ya da sembol)" style="max-width:340px;margin:6px 0">
    <div class="tscroll"><table class="t"><thead><tr><th class="hide-m">#</th><th>Kripto</th><th class="r">Fiyat</th><th class="r">24 saat</th><th class="r hide-m">7 gün</th><th class="hide-m">Son 7 gün</th><th class="r hide-m">Piyasa değeri</th></tr></thead><tbody id="tb"><tr><td colspan="7"><div class="spinner"></div></td></tr></tbody></table></div>
    <div id="more" style="text-align:center;margin:12px"></div>
    ${disclaimer("CoinGecko")}`;
  const tb = el.querySelector("#tb"), more = el.querySelector("#more");
  cryptoGlobal().then((g) => {
    const d = g.data;
    el.querySelector("#glob").innerHTML = `Toplam piyasa: <b>${big(d.total_market_cap.usd)}</b> ${pill(d.market_cap_change_percentage_24h_usd)} · Bitcoin hakimiyeti <b>%${f1(d.market_cap_percentage.btc)}</b> · Ethereum %${f1(d.market_cap_percentage.eth)}`;
  }).catch(() => {});
  const draw = () => {
    const t = q.toLowerCase();
    const l = all.filter((c) => !t || c.name.toLowerCase().includes(t) || c.symbol.toLowerCase().includes(t));
    tb.innerHTML = l.slice(0, shown).map((c) => `<tr class="click" data-h="kripto/${esc(c.id)}">
      <td class="muted small hide-m">${c.market_cap_rank ?? ""}</td>
      <td><div class="row">${logo(c.image, c.name, 28)}<div><b>${esc(c.name)}</b> <span class="tiny muted">${esc(c.symbol.toUpperCase())}</span></div></div></td>
      <td class="r">${price(c.current_price)} $</td><td class="r">${pill(c.price_change_percentage_24h)}</td>
      <td class="r hide-m">${pill(c.price_change_percentage_7d_in_currency)}</td>
      <td class="hide-m">${c.sparkline_in_7d ? spark(c.sparkline_in_7d.price.filter((_, i) => i % 3 === 0), 110, 30) : ""}</td>
      <td class="r hide-m">${big(c.market_cap)}</td></tr>`).join("");
    bindLinks(tb);
    more.innerHTML = l.length > shown ? `<button class="btn">Daha fazla göster (${shown} / ${l.length})</button>` : "";
    const b = more.querySelector("button"); if (b) b.onclick = () => { shown += 100; draw(); };
  };
  el.querySelector("#q").oninput = (e) => { q = e.target.value.trim(); draw(); };
  try { all = await coins(); draw(); } catch (e) { tb.innerHTML = `<tr><td colspan="7" class="err">Liste alınamadı (CoinGecko dakikada sınırlı istek kabul ediyor; biraz sonra tekrar deneyin).</td></tr>`; }
  every(120_000, async () => { try { all = await coins(); draw(); } catch (e) { /* yoksay */ } });
}

const CR = [["1G", 1], ["1H", 7], ["1A", 30], ["3A", 90], ["6A", 180], ["1Y", 365], ["2Y", 730], ["3Y", 1095], ["5Y", 1826], ["Tüm", 0]];

async function history(id, sym, days) {
  if (days === 0 || days > 365) {
    try {
      const interval = days === 0 || days > 1000 ? "1w" : "1d";
      const a = await getJSON(`https://api.binance.com/api/v3/klines?symbol=${sym.toUpperCase()}USDT&interval=${interval}&limit=1000`);
      let pts = a.map((k) => ({ t: k[0], c: parseFloat(k[4]) }));
      if (days) pts = pts.filter((p) => p.t >= Date.now() - days * 86400_000);
      if (pts.length > 2) return pts;
    } catch (e) { /* Binance'te yoksa CoinGecko'nun 1 yılı */ }
    days = 365;
  }
  const j = await getJSON(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
  return j.prices.map((p) => ({ t: p[0], c: p[1] }));
}

async function coinPage(el, id) {
  let all = [];
  try { all = await coins(); } catch (e) { /* tek coin bilgisi yine de denenir */ }
  const c = all.find((x) => x.id === id);
  if (!c) { el.innerHTML = `<div class="card err">Bu kripto bulunamadı ya da şu an veri alınamıyor.</div>`; return; }
  const sym = c.symbol.toUpperCase();
  el.innerHTML = `<div class="row wrap" style="gap:14px">${logo(c.image, c.name, 54)}
      <div class="grow"><h1 style="margin:0">${esc(c.name)}</h1><div class="small muted">${sym} · Sıra #${c.market_cap_rank}</div></div>
      <div style="text-align:right"><div style="font-size:26px;font-weight:800">${price(c.current_price)} $</div>${pill(c.price_change_percentage_24h)}</div></div>
    <div class="row" style="margin:10px 0">${starBtn("coin", id, c.name)}</div>
    <div class="grid split">
      <div class="card" id="chart"></div><div class="card"><h3 style="margin-top:0">Nedir?</h3><div id="about" class="small"><div class="spinner"></div></div></div></div>
    <h2>Göstergeler</h2><div class="tiny muted">Bir satıra tıklayınca açıklaması açılır.</div><div class="card" id="mx"></div>
    ${disclaimer("CoinGecko, Binance")}`;
  bindStars(el);
  rangeChart(el.querySelector("#chart"), CR.map((r) => r[0]), "1Y", ["1G", "1H"], (l) => history(id, c.symbol, CR.find((r) => r[0] === l)[1]));
  coinInfo(id).then(async (i) => {
    let d = (i.description && (i.description.tr || i.description.en)) || "";
    d = d.replace(/<[^>]+>/g, "").split(/\r?\n\r?\n/)[0].slice(0, 900);
    if (d && !(i.description.tr)) d = await translate(d);
    el.querySelector("#about").innerHTML = d ? esc(d) : `<span class="muted">Açıklama yok.</span>`;
  }).catch(() => (el.querySelector("#about").innerHTML = `<span class="muted">Bilgi alınamadı.</span>`));
  const mcap = c.market_cap, fdv = c.fully_diluted_valuation, circ = c.circulating_supply, tot = c.total_supply, max = c.max_supply;
  const locked = tot != null && circ != null ? Math.max(0, tot - circ) : null;
  el.querySelector("#mx").innerHTML = [
    metric("Piyasa değeri", big(mcap), "Fiyat × dolaşımdaki arz. Şu an piyasada serbestçe alınıp satılabilen coinlerin toplam değeri."),
    metric("Tam seyreltilmiş değerleme (FDV)", big(fdv), "Fiyat × maksimum arz (yoksa toplam arz). Kilitli ve henüz basılmamış bütün coinler bugünkü fiyattan piyasaya çıksaydı toplam değer ne olurdu, onu gösterir.",
      mcap && fdv ? (fdv > mcap * 1.5 ? `FDV piyasa değerinin ${f1(fdv / mcap)} katı: ileride piyasaya çok coin girecek, bu fiyata baskı yapabilir.` : "FDV piyasa değerine yakın: arzın çoğu zaten dolaşımda.") : null),
    metric("Dolaşımdaki arz", circ != null ? `${amount(circ)} ${sym}` : "—", "Şu an piyasada serbestçe dolaşan coin miktarı.",
      circ && max ? `Maksimum arzın %${f1((circ / max) * 100)}'i dolaşımda.` : null),
    metric("Toplam arz", tot != null ? `${amount(tot)} ${sym}` : "—", "Şu ana kadar oluşturulmuş coinlerin tamamı; kilitli olanlar dahil, yakılanlar hariç."),
    metric("Maksimum arz", max != null ? `${amount(max)} ${sym}` : "Sınırsız", "Protokolün izin verdiği en yüksek coin sayısı. Bitcoin'de 21 milyonla sınırlıdır. Ethereum gibi bazı coinlerde sabit bir üst sınır yoktur."),
    metric("Kilitli / dağıtılmamış", locked != null ? `${amount(locked)} ${sym}` : "—", "Basılmış ama henüz dolaşıma girmemiş miktar. Genelde ekip, yatırımcı ya da vakıf payıdır ve takvime göre zamanla serbest kalır (\"unlock\"). Büyük kilit açılışları öncesinde fiyat baskı görebilir.",
      locked && tot ? `Toplam arzın %${f1((locked / tot) * 100)}'i kilitli.` : null),
    metric("24 saatlik işlem hacmi", big(c.total_volume), "Son 24 saatte el değiştiren toplam değer. Piyasa değerine göre çok düşükse alım-satım zorlaşabilir."),
    metric("Tüm zamanların zirvesi", price(c.ath) + " $", "Bugüne kadar görülen en yüksek fiyat.", c.ath_change_percentage != null ? `Şu an zirvenin %${f1(-c.ath_change_percentage)} altında (${new Date(c.ath_date).toLocaleDateString("tr-TR")}).` : null),
    metric("7 günlük değişim", pct(c.price_change_percentage_7d_in_currency), "Son bir haftadaki fiyat değişimi."),
  ].join("");
}
