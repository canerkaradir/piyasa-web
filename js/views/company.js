import { esc, price, pill, pct, big, f1, f2, amount, logo, tvLogo, usLogo, cleanName, sectorTr, metric, peComment } from "../ui.js";
import { tvByNames, DETAIL_COLS, bars, cnbcSym, RANGES, wikiAbout, local, cnbcQuotes, num } from "../api.js";
import { rangeChart } from "../chart.js";
import { starBtn, bindStars, every } from "../core.js";
import { disclaimer } from "../widgets.js";

const US_EXTRA = ["price_target_average", "price_sales_current", "Perf.3M", "Perf.YTD", "number_of_employees", "exchange",
  "earnings_release_next_date", "earnings_release_next_time", "earnings_per_share_forecast_next_fq"];

export async function render(el, [sym], key) {
  const bist = key === "bist";
  const cur = bist ? "₺" : "$";
  el.innerHTML = `<div class="spinner"></div>`;
  let m;
  try {
    const r = await tvByNames(bist ? "turkey" : "america", [sym], bist ? DETAIL_COLS : [...DETAIL_COLS, ...US_EXTRA]);
    m = r[sym];
  } catch (e) { /* aşağıda */ }
  if (!m) { el.innerHTML = `<div class="card err">${esc(sym)} için veri bulunamadı.</div>`; return; }
  const name = cleanName(m.description);
  el.innerHTML = `
    <div class="row wrap" style="gap:14px">
      ${logo(tvLogo(m.logoid) || (bist ? "" : usLogo(sym)), name, 54)}
      <div class="grow"><h1 style="margin:0">${esc(name)}</h1>
        <div class="small muted">${esc(sym)} · ${bist ? "Borsa İstanbul" : esc(m.exchange || "ABD")} · ${esc(sectorTr(m.sector))}${m.industry ? " · " + esc(m.industry) : ""}</div></div>
      <div style="text-align:right"><div style="font-size:26px;font-weight:800" id="px">${price(m.close)} ${cur}</div><div id="ch">${pill(m.change)}</div></div>
    </div>
    <div class="row wrap" style="margin:10px 0"><a class="btn" href="#/karne/${bist ? "bist" : "us"}/${esc(sym)}">🔍 Şirket karnesi: sağlam mı?</a>${starBtn(bist ? "bist" : "us", sym, name)}
      ${bist ? "" : `<a class="btn ghost" href="#/karsilastir/${esc(sym)}">⇄ Karşılaştır</a><a class="btn ghost" href="#/neolurdu/${esc(sym)}">⏱ Ne olurdu?</a>`}
      <a class="btn ghost" target="_blank" rel="noopener" href="https://news.google.com/search?q=${encodeURIComponent(name + (bist ? " hisse" : " stock"))}&hl=tr&gl=TR&ceid=TR:tr">📰 Haberler</a></div>
    <div class="grid split">
      <div class="card" id="chart"></div>
      <div class="card"><h3 style="margin-top:0">Ne iş yapar?</h3><div id="about" class="small"><div class="spinner"></div></div></div>
    </div>
    <div class="grid g2" style="margin-top:4px">
      <div><h2>Temel göstergeler</h2><div class="tiny muted">Bir satıra tıklayınca ne anlama geldiği açılır.</div><div class="card" id="mx"></div></div>
      <div><h2>Bakılması gereken noktalar</h2><div class="tiny muted">Rakamlardan çıkan gözlemler. Yorum değil, kontrol listesidir; karar sizindir.</div><div class="card" id="obs"></div>
        <div id="earn"></div></div>
    </div>
    ${disclaimer(bist ? "TradingView, İş Yatırım, Vikipedi" : "TradingView, CNBC, Vikipedi")}`;
  bindStars(el);

  // ---- grafik
  const chartEl = el.querySelector("#chart");
  if (bist) {
    const labels = ["1A", "3A", "6A", "1Y", "2Y", "3Y", "5Y", "10Y"];
    rangeChart(chartEl, labels, "1Y", [], async (l) => {
      const d = await local(`bist/${sym}.json`);
      const days = RANGES.find((r) => r.label === l).days;
      const from = Date.now() - days * 86400_000;
      return d.filter((p) => p[0] >= from).map((p) => ({ t: p[0], c: p[1] }));
    });
  } else {
    const s = cnbcSym(sym);
    rangeChart(chartEl, RANGES.map((r) => r.label), "1Y", ["1G", "5G"], (l) => bars(s, l));
    every(60_000, async () => {
      try {
        const q = (await cnbcQuotes([s]))[s]; if (!q) return;
        el.querySelector("#px").textContent = price(num(q.last)) + " $";
        el.querySelector("#ch").innerHTML = pill(num(q.change_pct));
      } catch (e) { /* yoksay */ }
    });
  }

  // ---- hakkında
  wikiAbout(name).then((w) => {
    el.querySelector("#about").innerHTML = w ? `${esc(w.text)}<div class="tiny" style="margin-top:6px"><a href="${esc(w.url)}" target="_blank" rel="noopener">Vikipedi'de oku ›</a></div>` : `<span class="muted">Bilgi bulunamadı.</span>`;
  }).catch(() => (el.querySelector("#about").innerHTML = `<span class="muted">Bilgi alınamadı.</span>`));

  el.querySelector("#mx").innerHTML = metrics(m, bist);
  el.querySelector("#obs").innerHTML = observations(m, bist);
  if (!bist && m.earnings_release_next_date) {
    const d = new Date(m.earnings_release_next_date * 1000);
    const when = m.earnings_release_next_time === -1 ? "piyasa açılmadan önce (TR ~14:00–16:30)" : m.earnings_release_next_time === 1 ? "piyasa kapandıktan sonra (TR ~23:00 sonrası)" : "";
    el.querySelector("#earn").innerHTML = `<div class="card" style="margin-top:12px"><b>Sonraki bilanço:</b> ${d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} ${when}
      ${m.earnings_per_share_forecast_next_fq != null ? `<div class="small muted">Beklenen hisse başına kâr: ${f2(m.earnings_per_share_forecast_next_fq)} $</div>` : ""}
      <a class="small" href="#/bilanco/${esc(sym)}">Bilanço beklentileri ve açıklamaları ›</a></div>`;
  }
}

function metrics(m, bist) {
  const cur = bist ? "₺" : "$";
  const pe = m.price_earnings_ttm, last = m.close, hi = m.price_52_week_high, lo = m.price_52_week_low;
  const out = [];
  out.push(metric("Piyasa değeri", big(m.market_cap_basic, cur), "Hisse fiyatı × toplam hisse sayısı. Şirketin borsadaki toplam değeridir; şirketleri büyüklüğe göre sıralarken buna bakılır."));
  out.push(metric("F/K (fiyat/kazanç)", pe > 0 ? f1(pe) : "—",
    `Hisse fiyatının, hisse başına son 12 aylık kâra bölümü. Yatırımcının şirketin 1 ${bist ? "liralık" : "dolarlık"} yıllık kârı için kaç ${bist ? "lira" : "dolar"} ödediğini gösterir. F/K 20 ise şirket bugünkü kârıyla piyasa değerini yaklaşık 20 yılda kazanır. Tek başına iyi ya da kötü değildir; aynı sektördeki şirketlerle ve şirketin büyüme hızıyla birlikte yorumlanır.`,
    bist ? (pe > 0 ? "Türkiye'de yüksek enflasyon ve enflasyon muhasebesi kârları bozduğu için F/K'lar ABD'ye göre çok daha düşük ve oynaktır; aynı sektördeki BIST şirketleriyle karşılaştırmak daha anlamlıdır." : "Zarar ya da çok düşük kâr nedeniyle F/K anlamlı değil.") : peComment(pe, null, m.sector)));
  if (!bist) out.push(metric("Fiyat/Satış", m.price_sales_current ? f1(m.price_sales_current) : "—", "Piyasa değerinin yıllık gelire bölümü. Henüz kâr etmeyen şirketlerde F/K yerine buna bakılır. 1–3 arası olağan, 10'un üstü çok yüksek büyüme beklentisi demektir."));
  out.push(metric("PD/DD (piyasa değeri / defter değeri)", m.price_book_fq ? f2(m.price_book_fq) : "—", "Piyasa değerinin, şirketin muhasebedeki öz sermayesine oranı. 1'in altı, şirketin defter değerinden ucuza işlem gördüğünü gösterir. Bankalarda en çok bakılan orandır; yazılım şirketlerinde doğal olarak yüksektir."));
  out.push(metric("Hisse başına kâr (12 ay)", m.earnings_per_share_basic_ttm != null ? price(m.earnings_per_share_basic_ttm) + " " + cur : "—", "Şirketin son 12 aydaki net kârının hisse sayısına bölümü (EPS). Bilançolarda en çok bakılan rakamdır; beklentiyle karşılaştırılır."));
  out.push(metric("Gelir (12 ay)", big(m.total_revenue, cur), "Şirketin son 12 ayda sattığı ürün ve hizmetlerin toplamı (ciro). Kârdan önce gelen satırdır."));
  const nm = m.net_margin;
  out.push(metric("Net kâr marjı", nm != null ? "%" + f1(nm) : "—", "Her 100 birimlik satıştan, bütün giderler ve vergiler düştükten sonra kaç birim kâr kaldığı.",
    nm == null ? null : nm < 0 ? "Şirket zarar ediyor." : nm < 10 ? "İnce marj: maliyetlerdeki artış kârı hızla eritebilir." : nm < 20 ? "İyi bir kârlılık." : "Çok yüksek kârlılık: güçlü bir rekabet avantajına işaret eder."));
  const gm = m.gross_margin;
  if (!bist) out.push(metric("Brüt kâr marjı", gm != null ? "%" + f1(gm) : "—", "Satışlardan sadece ürünün doğrudan maliyeti düşüldüğünde kalan pay. Yüksekse şirket ürününü maliyetinin çok üstünde satabiliyor demektir (yazılım ve çip şirketlerinde %60'ın üstü olağandır).",
    gm == null ? null : gm < 25 ? "Düşük: perakende ve imalatta olağan." : gm < 50 ? "Orta düzey." : "Yüksek: güçlü fiyatlama gücü."));
  const roe = m.return_on_equity;
  out.push(metric("Özsermaye kârlılığı (ROE)", roe != null ? "%" + f1(roe) : "—", "Şirketin, ortaklarının koyduğu sermaye üzerinden yılda yüzde kaç kâr ettiği. Sermayeyi ne kadar verimli kullandığını gösterir." + (bist ? " Türkiye'de enflasyon yüksek olduğu için enflasyonun altında kalan ROE reel olarak düşüktür." : ""),
    roe == null ? null : roe < 0 ? "Zarar var." : roe < 10 ? "Zayıf." : roe < 20 ? "İyi." : "Güçlü (çok yüksekse borç ya da hisse geri alımlarının etkisi olabilir)."));
  const de = m.debt_to_equity;
  out.push(metric("Borç / Özsermaye", de != null ? f2(de) : "—", "Şirketin borcunun, ortaklarının sermayesine oranı. 1'in üstü borcun öz sermayeden fazla olduğu anlamına gelir. Yüksek borç, faizler arttığında ve kötü dönemlerde şirketi zorlar.",
    de == null ? null : de < 0.5 ? "Düşük borç: sağlam bilanço." : de < 1.5 ? "Orta düzey borç." : "Yüksek borç: faiz artışlarına duyarlı."));
  out.push(metric("Temettü verimi", m.dividend_yield_recent ? "%" + f2(m.dividend_yield_recent) : "Yok", "Şirketin yıllık dağıttığı kâr payının hisse fiyatına oranı. Büyüme şirketleri genelde az ya da hiç temettü dağıtmaz, kârı yeniden yatırır."));
  const beta = m.beta_1_year;
  out.push(metric("Beta (1 yıl)", beta != null ? f2(beta) : "—", `Hissenin ${bist ? "BIST'e" : "piyasaya"} göre ne kadar oynak olduğu. 1 = piyasayla aynı; 2 = piyasa %1 oynadığında bu hisse ortalama %2 oynar.`,
    beta == null ? null : beta > 1.3 ? "Piyasadan belirgin şekilde daha oynak." : beta < 0.8 ? "Piyasadan daha sakin." : "Piyasaya yakın oynaklık."));
  out.push(metric("52 hafta en yüksek / en düşük", `${price(hi)} / ${price(lo)}`, "Son bir yıldaki en yüksek ve en düşük fiyat. Fiyatın bu aralığın neresinde olduğu, hissenin yakın dönemdeki gücünü gösterir.",
    hi && lo && last && hi > lo ? `Fiyat bu aralığın %${Math.round(((last - lo) / (hi - lo)) * 100)} noktasında; zirvenin %${f1((1 - last / hi) * 100)} altında.` : null));
  if (!bist && m.price_target_average) out.push(metric("Analistlerin 1 yıllık ortalama hedefi", price(m.price_target_average) + " $", "Hisseyi izleyen analistlerin 12 ay sonrası için ortalama fiyat tahmini. Sık sık yanılırlar; piyasanın genel beklentisini görmek için bakılır.",
    last ? `Bugünkü fiyata göre ${pct((m.price_target_average / last - 1) * 100)} fark.` : null));
  out.push(metric("Performans", `1H ${pct(m["Perf.W"])} · 1A ${pct(m["Perf.1M"])} · 1Y ${pct(m["Perf.Y"])}`, bist ? "TL bazlı değişim. Dolar bazlı getiriyi görmek için aynı dönemde doların ne kadar arttığını hesaba katmak gerekir." : "Hissenin son 1 hafta, 1 ay ve 1 yıldaki fiyat değişimi.",
    m["Perf.5Y"] != null ? `5 yıl: ${pct(m["Perf.5Y"])}` : null));
  out.push(metric("İşlem hacmi", amount(m.volume), "Bugün el değiştiren hisse sayısı. Ortalamanın çok üstündeyse hisse hakkında önemli bir gelişme olabilir.",
    m.average_volume_10d_calc ? `10 günlük ortalama: ${amount(m.average_volume_10d_calc)}` + (m.volume > m.average_volume_10d_calc * 2 ? " — bugün ortalamanın 2 katından fazla!" : "") : null));
  if (m.number_of_employees) out.push(metric("Çalışan sayısı", amount(m.number_of_employees), "Şirketin toplam çalışan sayısı. Çalışan başına gelir, verimliliği kabaca gösterir.",
    m.total_revenue ? `Çalışan başına gelir: ${big(m.total_revenue / m.number_of_employees, cur)}` : null));
  return out.join("");
}

function observations(m, bist) {
  const o = [];
  const add = (icon, t) => o.push(`<div class="row" style="align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--line)"><span>${icon}</span><span class="small">${t}</span></div>`);
  const pe = m.price_earnings_ttm, nm = m.net_margin, de = m.debt_to_equity, last = m.close, hi = m.price_52_week_high;
  if (pe == null || pe <= 0) add("⚠️", "Şirket son 12 ayda zarar etmiş. Nakdinin ne kadar süre yeteceğine ve yeni hisse satıp satmadığına bakın.");
  else if (!bist && pe > 60) add("🔎", `F/K ${f1(pe)}: piyasa çok hızlı büyüme bekliyor. Büyüme yavaşlarsa fiyat sert düşebilir; bilançolarda gelir büyümesini takip edin.`);
  else if (!bist && pe < 12) add("🔎", `F/K ${f1(pe)} düşük. Ucuz mu, yoksa piyasa kârın düşeceğinden mi endişeli? Haberlere ve kâr eğilimine bakın.`);
  if (nm != null && nm > 20) add("✅", `Net kâr marjı %${f1(nm)}: yüksek kârlılık, güçlü rekabet konumuna işaret eder.`);
  if (de != null && de > 1.5) add("⚠️", `Borç öz sermayenin ${f1(de)} katı. Faiz artışları ve zor dönemler bu şirketi daha çok etkiler.`);
  if (de != null && de < 0.3) add("✅", "Borcu düşük: zor dönemlere dayanıklı bir bilanço.");
  if (m.beta_1_year > 1.6) add("⚠️", `Beta ${f2(m.beta_1_year)}: piyasa düştüğünde bu hisse genelde daha çok düşer.`);
  if (hi && last && last < hi * 0.6) add("🔎", `Fiyat 52 haftalık zirvesinin %${Math.round((1 - last / hi) * 100)} altında. Düşüşün nedeni geçici mi, kalıcı mı?`);
  if (hi && last && last > hi * 0.97) add("📈", "Fiyat 52 haftalık zirvesine çok yakın: güçlü bir eğilim var, ama beklentiler de yüksek.");
  if (m.volume && m.average_volume_10d_calc && m.volume > m.average_volume_10d_calc * 2) add("📣", "Bugünkü işlem hacmi ortalamanın 2 katından fazla: şirketle ilgili önemli bir haber olabilir.");
  if (m.dividend_yield_recent > 4) add("💵", `Temettü verimi %${f1(m.dividend_yield_recent)}. Yüksek verim bazen fiyatın düşmesinden kaynaklanır; temettünün sürdürülebilir olup olmadığına bakın.`);
  if (m["Perf.Y"] > 150) add("🚀", `Son 1 yılda %${Math.round(m["Perf.Y"])} yükselmiş. Bu kadar hızlı yükselen hisselerde sert düzeltmeler de olağandır.`);
  if (m.market_cap_basic && m.market_cap_basic < 2e9 && !bist) add("🔬", "Küçük ölçekli şirket: büyük şirketlere göre çok daha oynaktır ve haberlere sert tepki verir.");
  add("🧭", "Genel kontrol listesi: Şirket ne satıyor ve rakiplerinden farkı ne? Gelir yıldan yıla büyüyor mu? Kâr ediyor mu? Borcu yönetilebilir mi? Bu hisseyi portföyünüzün ne kadarı yapacaksınız?");
  return o.join("");
}
