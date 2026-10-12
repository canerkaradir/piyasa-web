import { esc, price, pill, pct, big, logo, tvLogo, cleanName } from "../ui.js";
import { tvScan } from "../api.js";
import { bindLinks } from "../core.js";
import { disclaimer } from "../widgets.js";

const THEMES = [
  ["Kuantum bilişim", "Klasik bilgisayarların yıllarca çözemeyeceği ilaç tasarımı, malzeme bilimi ve şifreleme problemlerini kuantum fiziğiyle çözmeye çalışıyorlar. Ayrıca kuantum bilgisayarların kıracağı şifrelere karşı yeni nesil şifreleme geliştirenler var.",
    "Ticari olarak kârlı kuantum bilgisayar henüz yok; şirketlerin çoğu zarar ediyor ve yeni hisse satarak para topluyor. Haberle %30-50 yükselip aynı hızla düşebiliyorlar.", ["IONQ", "RGTI", "QBTS", "QUBT", "ARQQ", "LAES"]],
  ["Nükleer enerji ve küçük reaktörler", "Yapay zekâ veri merkezlerinin dev elektrik ihtiyacını karbonsuz karşılamak için küçük modüler reaktörler (SMR) ve nükleer yakıt üretiyorlar.",
    "Reaktör onayları yıllar sürüyor, bazı şirketlerin henüz geliri yok. Düzenleme ve maliyet aşımı riski yüksek.", ["OKLO", "SMR", "NNE", "LEU", "LTBR", "BWXT"]],
  ["Uzay", "Uydu fırlatma, uzaydan doğrudan cep telefonuna internet, Ay görevleri ve Dünya gözlem uyduları.",
    "Fırlatma başarısızlıkları ve büyük sermaye ihtiyacı. Bazıları uzun süre zarar etmeye devam edebilir.", ["RKLB", "ASTS", "LUNR", "RDW", "PL", "BKSY"]],
  ["Yapay zekâ yazılımı ve ilaç keşfi", "Ses tanıma, kurumsal yapay zekâ uygulamaları ve yapay zekâyla yeni ilaç molekülleri bulma.",
    "Büyük teknoloji şirketleriyle rekabet çok sert; bazılarının değerlemesi gelirine göre çok yüksek.", ["SOUN", "BBAI", "AI", "TEM", "RXRX"]],
  ["Robotik ve otomasyon", "Depo otomasyonu, teslimat robotları ve insansı robotlar: iş gücü açığına çözüm.",
    "Ürünlerin yaygınlaşması zaman alabilir; küçük şirketler nakit sıkıntısı yaşayabilir.", ["SYM", "SERV", "RR", "PDYN"]],
  ["Hava taksisi ve dronlar", "Şehir içi elektrikli hava taksileri (eVTOL) ve savunma/ticari dronlar.",
    "Havacılık sertifikasyonu uzun ve pahalı; ticari uçuşlar planlanandan gecikebilir.", ["JOBY", "ACHR", "EH", "RCAT", "UMAC"]],
  ["Gen düzenleme ve sentetik biyoloji", "CRISPR gibi yöntemlerle genetik hastalıkları tek seferde tedavi etmeye çalışıyorlar.",
    "Klinik deneylerin sonucu hisseyi bir günde %50 oynatabilir; onay süreçleri uzun.", ["CRSP", "NTLA", "BEAM", "EDIT", "DNA"]],
  ["Yeni nesil piller ve enerji depolama", "Katı hal piller ve şebeke ölçeğinde enerji depolama: elektrikli araçların menzili ve yenilenebilir enerjinin kesintisizliği.",
    "Seri üretime geçiş zor; teknolojinin ticari olarak tutup tutmayacağı belirsiz.", ["QS", "SLDP", "EOSE", "FLNC", "ENVX"]],
  ["Yeni nesil çip ve fotonik", "Işıkla veri taşıyan çipler ve verimli güç yarı iletkenleri: veri merkezlerinin hız ve enerji sorununa çözüm.",
    "Büyük müşteri anlaşmaları olmadan gelir oluşmuyor; çip döngüsüne çok duyarlı.", ["NVTS", "LWLG", "POET", "AEHR"]],
];
const COLS = ["name", "description", "close", "change", "market_cap_basic", "Perf.1M", "Perf.3M", "Perf.Y", "Perf.YTD", "sector", "logoid"];

function row(r, perf) {
  const n = cleanName(r.description), p = perf === "3A" ? r["Perf.3M"] : r["Perf.Y"];
  return `<div class="row" data-h="hisse/${esc(r.name)}" style="cursor:pointer;padding:8px 0;border-bottom:1px solid var(--line)">${logo(tvLogo(r.logoid), n, 32)}
    <div class="grow"><div class="ell"><b>${esc(n)}</b></div><div class="tiny muted">${esc(r.name)} · ${big(r.market_cap_basic)}</div></div>
    <div style="text-align:right"><div class="small">${price(r.close)} $ ${pill(r.change)}</div><div class="tiny"><span class="muted">${perf}:</span> <b class="${p >= 0 ? "up" : "down"}">${pct(p)}</b></div></div></div>`;
}

export async function render(el) {
  let tab = 0;
  el.innerHTML = `<h1>Gelecek vaat edenler</h1><div class="small muted">Geleceğin büyük problemlerine çözüm arayan, teknolojiye odaklı küçük ve orta boy şirketler.</div>
    <div class="chips"><button class="chip on" data-t="0">Temalar</button><button class="chip" data-t="1">Radar: son 3 ayın yükselenleri</button></div>
    <div id="body"><div class="spinner"></div></div>
    <div class="card small" style="margin-top:14px;border-left:4px solid var(--down)">Küçük ve gelişmekte olan şirketler çok risklidir: çoğu henüz kâr etmez, haberle günde %20-50 oynayabilir, bazıları tamamen değer kaybedebilir. Bu bölüm öğrenme ve takip amaçlıdır, yatırım tavsiyesi değildir.</div>
    ${disclaimer("TradingView")}`;
  const body = el.querySelector("#body"), chips = el.querySelector(".chips");
  let live = null;
  async function draw() {
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", +c.dataset.t === tab));
    body.innerHTML = `<div class="spinner"></div>`;
    try {
      if (tab === 0) {
        if (!live) {
          const all = THEMES.flatMap((t) => t[3]);
          const { rows } = await tvScan("america", { filter: [{ left: "name", operation: "in_range", right: all }], columns: COLS, range: [0, 200] });
          live = {}; for (const r of rows) if (!live[r.name] || (r.market_cap_basic || 0) > (live[r.name].market_cap_basic || 0)) live[r.name] = r;
        }
        body.innerHTML = `<div class="tiny muted" style="margin-bottom:6px">Temalar ve şirketler Claude tarafından seçildi (Ekim 2026); fiyatlar canlı. Yeni tema ya da şirket eklemek isterseniz söyleyin.</div>
          <div class="grid g2">${THEMES.map(([t, d, risk, ts]) => `<div class="card"><h3 style="margin-top:0">${esc(t)}</h3><div class="small">${esc(d)}</div>
            <div class="small down" style="margin:4px 0 6px">Risk: ${esc(risk)}</div>
            ${ts.map((s) => live[s]).filter(Boolean).sort((a, b) => (b.market_cap_basic || 0) - (a.market_cap_basic || 0)).map((r) => row(r, "1Y")).join("")}</div>`).join("")}</div>`;
      } else {
        const { rows } = await tvScan("america", {
          filter: [{ left: "market_cap_basic", operation: "in_range", right: [3e8, 1.5e10] },
            { left: "sector", operation: "in_range", right: ["Electronic Technology", "Technology Services", "Health Technology"] },
            { left: "type", operation: "equal", right: "stock" }, { left: "exchange", operation: "in_range", right: ["NASDAQ", "NYSE", "AMEX"] },
            { left: "average_volume_10d_calc", operation: "greater", right: 500000 }],
          columns: COLS, sort: { sortBy: "Perf.3M", sortOrder: "desc" }, range: [0, 30],
        });
        body.innerHTML = `<div class="tiny muted" style="margin-bottom:6px">Bu liste otomatik oluşur: piyasa değeri 300 milyon – 15 milyar $ arası teknoloji ve sağlık teknolojisi şirketleri arasından son 3 ayda en çok yükselenler. Yükselişin nedeni haber, beklenti ya da spekülasyon olabilir; şirkete tıklayıp inceleyin.</div>
          <div class="card">${rows.map((r) => row(r, "3A")).join("")}</div>`;
      }
      bindLinks(body);
    } catch (e) { body.innerHTML = `<div class="err">Liste alınamadı.</div>`; }
  }
  chips.onclick = (e) => { const t = e.target.dataset.t; if (t == null) return; tab = +t; draw(); };
  draw();
}
