import { esc, price, pill, big, f2, pct, logo, tvLogo, cleanName, metric } from "../ui.js";
import { tvScan, store } from "../api.js";
import { bindLinks } from "../core.js";
import { disclaimer } from "../widgets.js";

const COLS = ["name", "description", "market_cap_basic", "earnings_release_next_date", "earnings_release_next_time",
  "earnings_per_share_forecast_next_fq", "revenue_forecast_next_fq", "earnings_per_share_fq", "earnings_per_share_forecast_fq",
  "revenue_fq", "revenue_forecast_fq", "earnings_release_date", "close", "change", "logoid"];
const when = (t) => (t === -1 ? "Açılış öncesi" : t === 1 ? "Kapanış sonrası" : "Saat belli değil");
const whenLong = (t) => (t === -1 ? "Piyasa açılmadan önce (TR ~14:00–16:30)" : t === 1 ? "Piyasa kapandıktan sonra (TR ~23:00 sonrası)" : "Saat belli değil");

export async function render(el, [sym], key) {
  if (key === "bilanco" && sym) return detail(el, sym);
  let minCap = store.get("earnCap", 1e10);
  el.innerHTML = `<h1>Bilançolar</h1><div class="small muted">Önümüzdeki 3 ayda bilanço açıklayacak ABD şirketleri, en yakın tarihten başlayarak. Bir şirkete tıklayınca beklentiler ve açıklamaları açılır.</div>
    <div class="chips" id="cap"><button class="chip" data-v="1e11">Dev (100 milyar $+)</button><button class="chip" data-v="1e10">Büyük (10 milyar $+)</button><button class="chip" data-v="1e9">Hepsi (1 milyar $+)</button></div>
    <div id="list"><div class="spinner"></div></div>${disclaimer("TradingView")}`;
  const box = el.querySelector("#list"), cap = el.querySelector("#cap");
  async function load() {
    cap.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", +c.dataset.v === minCap));
    box.innerHTML = `<div class="spinner"></div>`;
    const now = Math.floor(Date.now() / 1000) - 86400, end = now + 92 * 86400;
    try {
      const { rows } = await tvScan("america", {
        filter: [{ left: "earnings_release_next_date", operation: "in_range", right: [now, end] }, { left: "market_cap_basic", operation: "greater", right: minCap },
          { left: "type", operation: "in_range", right: ["stock", "dr"] }, { left: "is_primary", operation: "equal", right: true }],
        columns: COLS, sort: { sortBy: "earnings_release_next_date", sortOrder: "asc" }, range: [0, 400],
      });
      let last = "", html = "";
      for (const r of rows) {
        const d = new Date(r.earnings_release_next_date * 1000).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/New_York" });
        if (d !== last) { if (last) html += "</div>"; html += `<h3>${esc(d)}</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">`; last = d; }
        const n = cleanName(r.description);
        html += `<div class="card row" data-h="bilanco/${esc(r.name)}" style="cursor:pointer;padding:10px">${logo(tvLogo(r.logoid), n, 32)}
          <div class="grow"><div class="ell"><b>${esc(n)}</b></div><div class="tiny muted">${esc(r.name)} · ${big(r.market_cap_basic)} · ${when(r.earnings_release_next_time)}</div></div>
          <div class="small" style="text-align:right">HBK bekl.<br><b>${r.earnings_per_share_forecast_next_fq != null ? f2(r.earnings_per_share_forecast_next_fq) + " $" : "—"}</b></div></div>`;
      }
      box.innerHTML = rows.length ? html + "</div>" : `<div class="muted">Bu aralıkta bilanço bulunamadı.</div>`;
      bindLinks(box);
    } catch (e) { box.innerHTML = `<div class="err">Takvim alınamadı.</div>`; }
  }
  cap.onclick = (e) => { const v = e.target.dataset.v; if (!v) return; minCap = +v; store.set("earnCap", minCap); load(); };
  load();
}

async function detail(el, sym) {
  el.innerHTML = `<div class="spinner"></div>`;
  let r;
  try { r = (await tvScan("america", { filter: [{ left: "name", operation: "equal", right: sym }], columns: [...COLS, "total_revenue", "earnings_per_share_basic_ttm"], range: [0, 5] })).rows.sort((a, b) => (b.market_cap_basic || 0) - (a.market_cap_basic || 0))[0]; } catch (e) { /* aşağıda */ }
  if (!r) { el.innerHTML = `<div class="card err">Bilgi bulunamadı.</div>`; return; }
  const n = cleanName(r.description);
  const nd = r.earnings_release_next_date ? new Date(r.earnings_release_next_date * 1000) : null;
  const days = nd ? Math.ceil((nd - Date.now()) / 86400_000) : null;
  const eps = r.earnings_per_share_fq, epsF = r.earnings_per_share_forecast_fq, rev = r.revenue_fq, revF = r.revenue_forecast_fq;
  const sur = eps != null && epsF ? ((eps - epsF) / Math.abs(epsF)) * 100 : null;
  el.innerHTML = `<div class="row wrap" style="gap:14px">${logo(tvLogo(r.logoid), n, 54)}<div class="grow"><h1 style="margin:0">${esc(n)}</h1><div class="small muted">${esc(sym)} · ${big(r.market_cap_basic)}</div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:800">${price(r.close)} $</div>${pill(r.change)}</div></div>
    <div class="card navy" style="margin-top:12px"><div class="muted small">Bilanço tarihi</div>
      <div style="font-size:20px;font-weight:800">${nd ? nd.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/New_York" }) : "Belli değil"}</div>
      <div class="small">${whenLong(r.earnings_release_next_time)}${days != null ? ` · ${days <= 0 ? "bugün" : days + " gün sonra"}` : ""}</div></div>
    <div class="grid g2" style="margin-top:4px">
      <div><h2>Beklentiler</h2><div class="tiny muted">Bir satıra tıklayınca ne anlama geldiği ve sonucun nasıl yorumlanacağı açılır.</div><div class="card">
        ${metric("Hisse başına kâr (HBK) beklentisi", r.earnings_per_share_forecast_next_fq != null ? f2(r.earnings_per_share_forecast_next_fq) + " $" : "—",
          "Analistlerin bu çeyrek için ortalama hisse başına kâr tahmini. Bilanço günü ilk bakılan rakam budur.\n\nNot: Şirketlerin çoğu beklentiyi küçük farkla aşar; piyasa bunu olağan sayar. Asıl önemli olan sürprizin büyüklüğüdür.",
          eps != null && r.earnings_per_share_forecast_next_fq != null ? `Bir önceki çeyrekte gerçekleşen: ${f2(eps)} $` : null)}
        ${metric("Gelir (ciro) beklentisi", big(r.revenue_forecast_next_fq),
          "Bu çeyrek için beklenen toplam satış. Kâr, maliyet kesintisiyle yükseltilebilir ama gelir büyümesi şirketin gerçekten büyüdüğünü gösterir.\n\n• HBK beklentiyi aşıp gelir kaçarsa piyasa bunu 'kalitesiz' sonuç olarak görebilir.\n• İkisi birden aşılırsa en güçlü senaryodur.",
          r.revenue_forecast_next_fq && rev ? `Bir önceki çeyrek geliri ${big(rev)}; bu çeyrek beklentisi ${pct((r.revenue_forecast_next_fq / rev - 1) * 100)} çeyreklik değişim demek.` : null)}
        ${metric("Gelecek dönem beklentisi (guidance)", "Açıklamada", "Şirketin bir sonraki çeyrek ya da yıl için verdiği tahmin. Piyasa geçmişten çok geleceğe baktığı için bu rakam çoğu zaman HBK'dan daha önemlidir: beklentiyi aşan bir bilançoya rağmen zayıf guidance hisseyi düşürebilir.\n\nBu rakam bilanço açıklanınca belli olur; haberlerde 'guidance' ya da 'outlook' diye geçer.")}
      </div></div>
      <div><h2>Geçen çeyrek: beklenti ve gerçekleşen</h2><div class="card">
        ${metric("Hisse başına kâr", eps != null ? `${f2(eps)} $ (bekl. ${epsF != null ? f2(epsF) : "—"})` : "—",
          "Açıklanan kârın analist beklentisiyle karşılaştırması. Düzenli olarak beklentiyi aşan şirketlerde piyasa artık sürprizi bekler; bu yüzden 'sadece tutması' bile hayal kırıklığı sayılabilir.",
          sur != null ? (sur >= 0 ? `Beklentiyi %${f2(sur)} aştı.` : `Beklentinin %${f2(-sur)} altında kaldı.`) : null)}
        ${metric("Gelir", rev ? `${big(rev)} (bekl. ${big(revF)})` : "—", "Açıklanan satışların beklentiyle karşılaştırması.",
          rev && revF ? (rev >= revF ? `Beklentiyi %${f2((rev / revF - 1) * 100)} aştı.` : `Beklentinin %${f2((1 - rev / revF) * 100)} altında kaldı.`) : null)}
      </div>
      <h2>Bilanço günü neye bakılır?</h2><div class="card small">1. HBK beklentiyi aştı mı, ne kadar?<br>2. Gelir beklentiyi aştı mı? Büyüme hızlanıyor mu yavaşlıyor mu?<br>3. Kâr marjları geçen yıla göre arttı mı?<br>4. Gelecek dönem beklentisi (guidance) yükseldi mi düştü mü?<br>5. Hisse kapanış sonrası işlemde nasıl tepki verdi? İlk tepki ertesi gün tersine dönebilir.<br>6. Yönetimin telefon konferansında öne çıkan konular (yapay zekâ talebi, maliyetler, gümrük vergileri…).</div>
      <a class="btn" href="#/hisse/${esc(sym)}" style="display:inline-block;margin-top:12px">Şirket sayfasına git ›</a></div>
    </div>${disclaimer("TradingView")}`;
}
