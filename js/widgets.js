// Birden çok sayfada kullanılan parçalar
import { esc, timeAgo, price, pct, f1, f2, big, spark } from "./ui.js";
import { local, cnbcQuotes, num, breadth, cryptoGlobal, cryptoFng, bars } from "./api.js";

export const LEVEL = { 3: ["ÇOK ÖNEMLİ", "#c62828"], 2: ["ÖNEMLİ", "#b8860b"], 1: ["BİLGİ", "#6b7280"] };

export function newsCard(n) {
  const [lab, col] = LEVEL[n.score] || LEVEL[1];
  return `<div class="card news" onclick="if(!event.target.closest('a'))this.classList.toggle('open')">
    <div class="row between"><span class="badge" style="background:${col}">${lab}</span><span class="tiny muted">${esc(n.source)} · ${timeAgo(n.time)}</span></div>
    <div style="margin-top:6px;font-weight:600">${esc(n.tr || n.title)}</div>
    ${n.tags && n.tags.length ? `<div class="tiny" style="color:var(--accent);margin-top:3px">${esc(n.tags.join(" · "))}</div>` : ""}
    <div class="note">${n.note ? `<b>Olası etki</b><br>${esc(n.note)}<div class="tiny muted" style="margin-top:4px">Bu genel bir beklentidir; piyasa farklı tepki verebilir.</div>` : ""}
      <div class="orig tiny muted" style="margin-top:6px">${esc(n.title)}</div>
      <a href="${esc(n.link)}" target="_blank" rel="noopener" class="small">Habere git ›</a></div>
  </div>`;
}

export function fngLabel(v) { return v < 25 ? "Aşırı korku" : v < 45 ? "Korku" : v <= 55 ? "Nötr" : v <= 75 ? "Açgözlülük" : "Aşırı açgözlülük"; }
export function fngColor(v) { return v < 25 ? "#c62828" : v < 45 ? "#ef6c00" : v <= 55 ? "#9e9d24" : v <= 75 ? "#43a047" : "#1b7f3b"; }

function gauge(title, v, sub) {
  if (v == null) return `<div class="gauge"><div class="small muted">${esc(title)}</div><div class="muted">—</div></div>`;
  const a = Math.PI * (1 - v / 100), cx = 70, cy = 66, r = 54;
  const nx = cx + r * 0.85 * Math.cos(a), ny = cy - r * 0.85 * Math.sin(a);
  const seg = [["#c62828", 0, 25], ["#ef6c00", 25, 45], ["#9e9d24", 45, 55], ["#43a047", 55, 75], ["#1b7f3b", 75, 100]].map(([c, s, e]) => {
    const a1 = Math.PI * (1 - s / 100), a2 = Math.PI * (1 - e / 100);
    return `<path d="M${cx + r * Math.cos(a1)},${cy - r * Math.sin(a1)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a2)},${cy - r * Math.sin(a2)}" stroke="${c}" stroke-width="11" fill="none"/>`;
  }).join("");
  return `<div class="gauge"><div class="small muted">${esc(title)}</div>
    <svg width="140" height="76" viewBox="0 0 140 76">${seg}<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="var(--text)"/></svg>
    <div style="font-size:22px;font-weight:800;color:${fngColor(v)}">${v}</div><div class="small" style="font-weight:700;color:${fngColor(v)}">${fngLabel(v)}</div>
    <div class="tiny muted">${sub || ""}</div></div>`;
}

const MOOD_PARTS = {
  market_momentum_sp500: ["Piyasa momentumu", "S&P 500'ün 125 günlük ortalamasına göre konumu. Endeks ortalamanın çok üstündeyse açgözlülük."],
  stock_price_strength: ["Fiyat gücü", "52 haftanın zirvesini yapan hisse sayısı ile dibini yapanların karşılaştırması."],
  stock_price_breadth: ["Fiyat genişliği", "Yükselen hisselerdeki hacim ile düşenlerdeki hacmin karşılaştırması."],
  put_call_options: ["Opsiyon (put/call)", "Düşüşe karşı korunma (put) opsiyonlarının yükseliş (call) opsiyonlarına oranı. Put alımı arttıkça korku artar."],
  market_volatility_vix: ["Oynaklık (VIX)", "VIX'in 50 günlük ortalamasına göre seviyesi. VIX yükseldikçe korku artar."],
  safe_haven_demand: ["Güvenli liman talebi", "Son 20 günde hisselerin tahvillere göre getirisi. Yatırımcılar tahvile kaçıyorsa korku."],
  junk_bond_demand: ["Riskli tahvil talebi", "Riskli şirket tahvilleri ile güvenli tahvillerin faiz farkı. Fark daralıyorsa yatırımcılar risk alıyor (açgözlülük)."],
};

export async function sentimentCard(el) {
  el.innerHTML = `<div class="card"><h3 style="margin-top:0">Piyasa duygusu</h3><div class="spinner"></div></div>`;
  const [s, c] = await Promise.all([local("fng.json").catch(() => null), cryptoFng().catch(() => null)]);
  const cv = c && c.data ? +c.data[0].value : null;
  const cw = c && c.data && c.data[7] ? +c.data[7].value : null;
  const parts = s && s.parts ? Object.entries(MOOD_PARTS).filter(([k]) => s.parts[k] != null).map(([k, [t, x]]) =>
    `<div class="metric" onclick="this.classList.toggle('open')"><div class="row between"><span class="small">${t}</span><span class="small" style="font-weight:700;color:${fngColor(s.parts[k])}">${s.parts[k]} · ${fngLabel(s.parts[k])}</span></div><div class="mx">${x}</div></div>`).join("") : "";
  el.innerHTML = `<div class="card"><h3 style="margin-top:0">Piyasa duygusu</h3>
    <div class="grid g2">${gauge("Hisse piyasası (CNN)", s ? s.score : null, s ? `1 hafta önce ${s.week} · 1 ay önce ${s.month}` : "")}
    ${gauge("Kripto", cv, cw != null ? `1 hafta önce ${cw}` : "")}</div>
    <div class="metric" onclick="this.classList.toggle('open')"><div class="small" style="color:var(--accent)">Ne anlama geliyor? Tıklayın. ▼</div>
      <div class="mx">0'a yakın değerler korkuyu, 100'e yakın değerler açgözlülüğü gösterir. Hisse göstergesi CNN'in endeksidir; aşağıdaki 7 ölçüden hesaplanır. Kripto göstergesi oynaklık, işlem hacmi ve sosyal medyadan hesaplanır.<br><br>Warren Buffett'ın sözü: "Başkaları açgözlüyken kork, başkaları korkarken açgözlü ol." Aşırı korku dönemleri tarihsel olarak çoğu zaman dibe yakın, aşırı açgözlülük dönemleri zirveye yakın zamanlara denk gelmiştir. Ama gösterge haftalarca aşırı bölgede kalabilir; tek başına alım-satım sinyali değildir.</div></div>
    ${parts ? `<details style="margin-top:6px"><summary class="small" style="cursor:pointer">Hisse göstergesinin 7 bileşeni</summary>${parts}</details>` : ""}
  </div>`;
}

function pulseCard(title, value, color, summary, explain, bar) {
  return `<div class="card metric" onclick="this.classList.toggle('open')" style="padding:12px">
    <div class="small muted">${esc(title)}</div>
    <div style="font-size:20px;font-weight:800;color:${color}">${esc(value)}</div>
    ${bar != null ? `<div style="height:6px;background:var(--line);border-radius:3px;margin:4px 0"><div style="height:6px;width:${Math.max(0, Math.min(100, bar))}%;background:${color};border-radius:3px"></div></div>` : ""}
    <div class="small">${esc(summary)}</div>
    <div class="tiny" style="color:var(--accent)">Ne anlama geliyor? ▼</div>
    <div class="mx">${esc(explain).replace(/\n/g, "<br>")}</div></div>`;
}

export async function pulseSection(el) {
  el.innerHTML = `<h2>Piyasa nabzı</h2><div class="spinner"></div>`;
  const [q, br, g] = await Promise.all([
    cnbcQuotes(["US2Y", "US10Y", "US10YTIP", ".DXY"]).catch(() => ({})),
    breadth("SPX").catch(() => null),
    cryptoGlobal().then((x) => x.data).catch(() => null),
  ]);
  const n = (s, k) => num(q[s] && q[s][k]);
  const y2 = n("US2Y", "last"), y10 = n("US10Y", "last"), real = n("US10YTIP", "last"), realC = n("US10YTIP", "change");
  const dxy = n(".DXY", "last"), dxyC = n(".DXY", "change_pct");
  const spread = y2 != null && y10 != null ? (y10 - y2) * 100 : null;
  const p200 = br && br.a200 + br.b200 > 0 ? (br.a200 / (br.a200 + br.b200)) * 100 : null;
  let gs = 0; if (dxyC != null) gs += dxyC < 0 ? 1 : dxyC > 0 ? -1 : 0; if (realC != null) gs += realC < 0 ? 1 : realC > 0 ? -1 : 0;
  const dom = g ? g.market_cap_percentage.btc : null, eth = g ? g.market_cap_percentage.eth : null;
  el.innerHTML = `<h2>Piyasa nabzı</h2><div class="grid g4">
    ${pulseCard("Getiri eğrisi (10 yıl − 2 yıl)", spread == null ? "—" : `${spread > 0 ? "+" : ""}${Math.round(spread)} baz puan`,
      spread == null ? "var(--muted)" : spread < 0 ? "var(--down)" : spread < 30 ? "#b8860b" : "var(--up)",
      spread == null ? "" : spread < 0 ? "Eğri ters: tarihsel olarak resesyon uyarısı." : spread < 30 ? "Eğri düz: görünüm belirsiz." : "Eğri normal: resesyon sinyali yok.",
      `2 yıllık faiz %${f2(y2)} · 10 yıllık faiz %${f2(y10)}\n\nNormalde parayı uzun süre bağlamak daha riskli olduğu için 10 yıllık faiz 2 yıllıktan yüksektir. Tersine dönmesi, piyasanın "Fed şimdi faizi yüksek tutuyor ama ekonomi zayıflayınca indirmek zorunda kalacak" diye düşündüğünü gösterir. 1980'den bu yana ABD'deki resesyonların neredeyse hepsinden önce eğri ters dönmüştür; ancak resesyon ters dönmeden 6–24 ay sonra gelir, bazen hiç gelmez.`)}
    ${pulseCard("Piyasa genişliği (S&P 500)", p200 == null ? "—" : `%${Math.round(p200)}`,
      p200 == null ? "var(--muted)" : p200 >= 70 ? "var(--up)" : p200 < 40 ? "var(--down)" : "#b8860b",
      (p200 != null ? `Şirketlerin %${Math.round(p200)}'ı 200 günlük ortalamasının üstünde. ` : "") + (br ? `Bugün ${br.up} yükseldi, ${br.down} düştü.` : ""),
      "Endeks yükselirken bu oran da yüksekse yükseliş geniş tabanlıdır, yani sağlıklıdır. Endeks zirvedeyken oran düşükse yükselişi birkaç dev şirket taşıyor demektir; bu kırılgan bir yapıdır. %70'in üstü güçlü, %40'ın altı zayıf bir piyasaya işaret eder.", p200)}
    ${pulseCard("Altını yönlendirenler", gs > 0 ? "Rüzgâr lehte" : gs < 0 ? "Rüzgâr aleyhte" : "Karışık", gs > 0 ? "var(--up)" : gs < 0 ? "var(--down)" : "#b8860b",
      `Dolar endeksi ${f2(dxy)} (${pct(dxyC)}) · Reel faiz %${f2(real)}${realC != null ? ` (${realC > 0 ? "+" : ""}${realC.toFixed(3).replace(".", ",")})` : ""}`,
      "Altının en güçlü iki belirleyicisi doların değeri ve reel faizdir (enflasyondan arındırılmış 10 yıllık tahvil faizi). Altın faiz getirmez: reel faiz yükseldikçe altın tutmanın maliyeti artar. Dolar güçlendiğinde altın diğer ülkelerin alıcıları için pahalılaşır. Bugün ikisi de düşüyorsa rüzgâr lehte, ikisi de yükseliyorsa aleyhtedir.")}
    ${pulseCard("Bitcoin hakimiyeti", dom == null ? "—" : `%${f1(dom)}`, "#f7931a",
      g ? `Toplam kripto piyasası ${big(g.total_market_cap.usd)} (${pct(g.market_cap_change_percentage_24h_usd)}) · Ethereum payı %${f1(eth)}` : "",
      "Bitcoin'in bütün kripto piyasası içindeki payı. Hakimiyet yükseliyorsa para daha güvenli görülen Bitcoin'e kaçıyor demektir; bu dönemlerde altcoinler genelde zayıf kalır. Hakimiyet belirgin şekilde düşerken toplam piyasa yükseliyorsa buna \"altcoin sezonu\" denir. %60'ın üstü Bitcoin'in çok baskın olduğu, %40'ın altı altcoinlerin öne çıktığı dönemlere işaret eder.", dom)}
  </div>`;
}

/** Küçük çizgi grafiği tembel yükler */
export async function sparkInto(el, symbol, label = "1A", w = 110, h = 34) {
  try {
    const b = await bars(symbol, label);
    el.innerHTML = spark(b.map((x) => x.c), w, h);
  } catch (e) { el.innerHTML = ""; }
}

export function disclaimer(src) {
  return `<div class="footer-note">${src ? "Veriler: " + esc(src) + ". " : ""}Öğrenme amaçlıdır, yatırım tavsiyesi değildir. Kararı siz verirsiniz.</div>`;
}
export { price };

/** ABD hissesi seçme kutusu */
export function stockPicker(box, placeholder, onPick) {
  box.innerHTML = `<div class="search" style="position:relative;max-width:360px"><input class="input" placeholder="${esc(placeholder)}"><div class="search-results" hidden></div></div>`;
  const inp = box.querySelector("input"), res = box.querySelector(".search-results");
  let t = null;
  inp.oninput = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const s = inp.value.trim(); if (s.length < 1) { res.hidden = true; return; }
      const { tvSearch } = await import("./api.js");
      const { cleanName } = await import("./ui.js");
      const l = await tvSearch("america", s, 6).catch(() => []);
      res.hidden = false;
      res.innerHTML = l.map((r) => `<div class="sr" data-s="${esc(r.name)}" data-n="${esc(cleanName(r.description))}"><b>${esc(r.name)}</b> <span class="small muted">${esc(cleanName(r.description))}</span></div>`).join("") || `<div class="sr muted">Sonuç yok</div>`;
      res.querySelectorAll("[data-s]").forEach((d) => (d.onclick = () => { res.hidden = true; inp.value = ""; onPick(d.dataset.s, d.dataset.n); }));
    }, 300);
  };
}
