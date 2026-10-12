import { esc } from "../ui.js";
import { local, store } from "../api.js";
import { disclaimer } from "../widgets.js";

const INFO = [
  [["core pce", "pce"], "Fed'in en çok önem verdiği enflasyon ölçüsü.", "Faiz indirimleri gecikebilir: hisseler ve altın baskı görebilir, dolar ve tahvil faizleri yükselir.", "Faiz indirimi ihtimali artar: hisseler ve altın için genelde olumlu, dolar için olumsuz."],
  [["cpi", "inflation rate", "consumer price"], "Tüketici fiyatlarındaki değişim; enflasyonun ana göstergesi.", "Fed faizi yüksek tutmak zorunda kalabilir: Nasdaq ve altın düşebilir, dolar güçlenir.", "Enflasyon soğuyor demektir: faiz indirimi beklentisi artar, hisseler ve altın genelde yükselir."],
  [["ppi", "producer price"], "Üretici fiyatları; tüketici enflasyonunun öncü göstergesi.", "Enflasyonun inatçı kalacağı endişesi artar.", "Enflasyonun gerileyeceği beklentisini destekler."],
  [["non farm", "nonfarm", "non-farm"], "Bir ayda eklenen yeni iş sayısı; ekonominin en önemli sağlık göstergesi.", "Ekonomi güçlü ama Fed faiz indirmekte acele etmez: dolar ve faizler yükselir, altın düşebilir.", "Faiz indirimi ihtimali artar (altın için olumlu); çok zayıfsa resesyon korkusu hisseleri düşürebilir."],
  [["unemployment rate"], "İş arayıp bulamayanların oranı.", "İş piyasası zayıflıyor: faiz indirimi beklentisi artar, dolar zayıflar.", "İş piyasası güçlü: faiz indirimleri gecikebilir."],
  [["jobless claims", "initial claims"], "Haftalık işsizlik maaşı başvuruları.", "İşten çıkarmalar artıyor olabilir: ekonomide yavaşlama sinyali.", "İş piyasası sağlam."],
  [["gdp"], "Ekonominin büyüme hızı.", "Güçlü büyüme şirket kârları için iyi ama faiz indirimi ihtimalini azaltır.", "Yavaşlama ya da resesyon endişesi: hisseler düşebilir, altın ve tahviller talep görebilir."],
  [["ism", "pmi"], "Şirket yöneticilerine yapılan anket; 50'nin üstü büyüme, altı daralma.", "Ekonomi beklenenden canlı.", "Ekonomide yavaşlama sinyali."],
  [["retail sales"], "Mağaza ve internet satışları; tüketicinin gücü.", "Tüketici güçlü: ekonomi için olumlu ama enflasyon endişesi artabilir.", "Tüketici yavaşlıyor: büyüme endişesi."],
  [["interest rate decision", "fed interest rate", "fomc"], "Fed'in politika faizi kararı.", "Beklenenden şahin (yüksek) karar: hisseler ve altın düşer, dolar yükselir.", "Beklenenden güvercin (düşük) karar: hisseler ve altın yükselir, dolar zayıflar."],
  [["consumer confidence", "michigan", "consumer sentiment"], "Halkın ekonomiye güveni; gelecekteki harcamaların öncü göstergesi.", "Tüketici iyimser: harcamalar artabilir.", "Tüketici karamsar: harcamalar yavaşlayabilir."],
];
const infoFor = (t) => INFO.find(([k]) => k.some((x) => t.toLowerCase().includes(x)));
const v = (x, u) => (x == null ? "—" : `${x}${u || ""}`);

export async function render(el) {
  let onlyHigh = store.get("econHigh", true);
  el.innerHTML = `<h1>Ekonomik takvim</h1><div class="small muted">ABD ekonomik verileri, Türkiye saatiyle. Bir satıra tıklayınca verinin ne anlama geldiği ve olası etkisi açılır.</div>
    <div class="chips"><button class="chip" data-h="1">Önemliler</button><button class="chip" data-h="0">Hepsi</button></div><div id="list"><div class="spinner"></div></div>${disclaimer("TradingView ekonomik takvimi")}`;
  const box = el.querySelector("#list"), chips = el.querySelector(".chips");
  let all = [];
  try { all = await local("econ.json"); } catch (e) { box.innerHTML = `<div class="err">Takvim alınamadı.</div>`; return; }
  function draw() {
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", (c.dataset.h === "1") === onlyHigh));
    const l = all.filter((e) => (onlyHigh ? e.imp >= 1 : true));
    let last = "", html = "";
    for (const e of l) {
      const d = new Date(e.date), day = d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
      if (day !== last) { if (last) html += "</div>"; html += `<h3>${esc(day)}</h3><div class="card" style="padding:4px 12px">`; last = day; }
      const i = infoFor(e.title);
      const cmp = e.actual != null && e.forecast != null && e.actual !== e.forecast ? (e.actual > e.forecast ? "Beklentiden yüksek geldi." : "Beklentiden düşük geldi.") : "";
      html += `<div class="metric" onclick="this.classList.toggle('open')">
        <div class="row between"><div class="grow"><span class="small muted">${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
          ${e.imp >= 1 ? `<span class="badge" style="background:#c62828;margin:0 4px">ÖNEMLİ</span>` : ""}<b class="small">${esc(e.tr)}</b> ${e.period ? `<span class="tiny muted">(${esc(e.period)})</span>` : ""}</div>
          <div class="small" style="text-align:right;white-space:nowrap">${e.actual != null ? `<b>${v(e.actual, e.unit)}</b> · ` : ""}<span class="muted">bekl. ${v(e.forecast, e.unit)} · önceki ${v(e.previous, e.unit)}</span></div></div>
        ${cmp ? `<div class="mc">${cmp}</div>` : ""}
        <div class="mx">${i ? `<b>Ne ölçer?</b> ${i[1]}<br><b>Beklentiden yüksek gelirse:</b> ${i[2]}<br><b>Beklentiden düşük gelirse:</b> ${i[3]}<div class="tiny muted">Bunlar genel eğilimlerdir; piyasa bazen ters tepki verir.</div>` : `Bu veri için hazır açıklama yok. Aslı: ${esc(e.title)}`}</div></div>`;
    }
    box.innerHTML = l.length ? html + "</div>" : `<div class="muted">Veri yok.</div>`;
  }
  chips.onclick = (e) => { const h = e.target.dataset.h; if (h == null) return; onlyHigh = h === "1"; store.set("econHigh", onlyHigh); draw(); };
  draw();
  const today = box.querySelectorAll("h3");
  const now = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  for (const h of today) if (h.textContent === now) { h.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); break; }
}
