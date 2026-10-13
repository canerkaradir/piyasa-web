// Şirket karnesi: veri toplama ve kurallarla değerlendirme (ABD + Borsa İstanbul)
import { tvScan, local, bars } from "./api.js";
import { big, f1, f2, peComment, sectorTr } from "./ui.js";

const COLS = ["name", "description", "close", "change", "market_cap_basic", "sector", "industry", "logoid", "exchange",
  "price_earnings_ttm", "price_sales_current", "price_earnings_growth_ttm", "price_book_fq", "net_margin", "gross_margin", "operating_margin",
  "return_on_equity", "return_on_invested_capital", "free_cash_flow_ttm", "free_cash_flow_margin_ttm", "current_ratio",
  "total_debt", "cash_n_short_term_invest_fq", "net_debt", "total_revenue", "total_revenue_yoy_growth_ttm",
  "earnings_per_share_diluted_yoy_growth_ttm", "piotroski_f_score_ttm", "altman_z_score_ttm", "dividend_yield_recent",
  "dividend_payout_ratio_ttm", "total_revenue_fq_h", "net_income_fq_h", "earnings_per_share_diluted_fq_h", "free_cash_flow_fq_h",
  "gross_profit_fq_h", "total_revenue_fy_h", "net_income_fy_h", "free_cash_flow_fy_h", "fiscal_period_end_fq", "fiscal_period_end_fy",
  "earnings_release_next_date", "earnings_release_next_time", "earnings_per_share_forecast_next_fq", "revenue_forecast_next_fq",
  "earnings_per_share_fq", "earnings_per_share_forecast_fq", "revenue_fq", "revenue_forecast_fq", "earnings_release_date",
  "fundamental_currency_code", "beta_1_year"];

const TR_M = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const EN_M = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const ymLabel = (y, m) => `${TR_M[m - 1]} ${y}`;
const ymKey = (y, m) => y * 12 + (m - 1);
const fromKey = (k) => [Math.floor(k / 12), (k % 12) + 1];
function parseEn(s) {
  const p = String(s || "").trim().split(" ");
  const mi = EN_M.indexOf((p[0] || "").toLowerCase().slice(0, 3));
  return p.length === 2 && mi >= 0 ? ymKey(+p[1], mi + 1) : null;
}
export const qTr = (s) => { const k = parseEn(s); if (k == null) return s; const [y, m] = fromKey(k); return ymLabel(y, m); };

export const yoy = (a, b) => (a == null || b == null || b === 0 ? null : ((a - b) / Math.abs(b)) * 100);
const sum = (l) => (l.length && l.every((x) => x != null) ? l.reduce((a, b) => a + b, 0) : null);

/** Ayın son günündeki (ya da öncesindeki en yakın) dolar/TL kuru */
function rateAt(fx, key) {
  const [y, m] = fromKey(key);
  const end = Date.UTC(y, m, 1); // sonraki ayın ilk günü
  let best = null;
  for (const p of fx) { if (p.t < end) best = p.c; else break; }
  return best;
}

export async function loadReport(market, sym) {
  const isBist = market === "bist";
  const [{ rows }, sur, fx] = await Promise.all([
    tvScan(isBist ? "turkey" : "america", { filter: [{ left: "name", operation: "equal", right: sym }], columns: COLS, range: [0, 10] }),
    isBist ? Promise.resolve(null) : local("surprises.json").then((d) => d[sym] || null).catch(() => null),
    isBist ? bars("TRY=", "10Y").catch(() => []) : Promise.resolve([]),
  ]);
  const m = rows.sort((a, b) => (b.market_cap_basic || 0) - (a.market_cap_basic || 0))[0];
  if (!m) throw new Error("veri yok");
  const A = (k) => (Array.isArray(m[k]) ? m[k] : []);
  const rev = A("total_revenue_fq_h"), ni = A("net_income_fq_h"), eps = A("earnings_per_share_diluted_fq_h"), fcf = A("free_cash_flow_fq_h"), gp = A("gross_profit_fq_h");
  let lastKey = null;
  if (m.fiscal_period_end_fq) { const d = new Date(m.fiscal_period_end_fq * 1000); lastKey = ymKey(d.getUTCFullYear(), d.getUTCMonth() + 1); }
  const surMap = {};
  (sur || []).forEach((r) => { const k = parseEn(r[0]); if (k != null) surMap[k] = r; });
  const n = Math.min(12, Math.max(rev.length, ni.length));
  const quarters = [];
  for (let i = 0; i < n; i++) {
    const key = lastKey != null ? lastKey - 3 * i : null;
    const s = key != null ? surMap[key] || surMap[key + 1] || surMap[key - 1] : null;
    const [y, mo] = key != null ? fromKey(key) : [null, null];
    const rate = isBist && key != null ? rateAt(fx, key) : null;
    quarters.push({
      key, label: key != null ? ymLabel(y, mo) : `${i + 1}. önceki`, short: key != null ? `${TR_M[mo - 1]} ${String(y).slice(2)}` : "",
      revenue: rev[i] ?? null, netIncome: ni[i] ?? null, eps: eps[i] ?? null, fcf: fcf[i] ?? null, gross: gp[i] ?? null, rate,
      reported: s ? s[1] : null, epsAdj: s ? s[2] : null, epsCons: s ? s[3] : null, surprise: s ? s[4] : null,
    });
  }
  // Sürpriz tablosu yoksa TradingView'in son çeyrek verisi
  if (quarters[0] && quarters[0].epsCons == null && m.earnings_per_share_fq != null && m.earnings_per_share_forecast_fq) {
    const q = quarters[0];
    q.epsAdj = m.earnings_per_share_fq; q.epsCons = m.earnings_per_share_forecast_fq;
    q.surprise = ((m.earnings_per_share_fq - m.earnings_per_share_forecast_fq) / Math.abs(m.earnings_per_share_forecast_fq)) * 100;
    if (m.earnings_release_date) q.reported = new Date(m.earnings_release_date * 1000).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  }
  const fyRev = A("total_revenue_fy_h"), fyNi = A("net_income_fy_h"), fyFcf = A("free_cash_flow_fy_h");
  let lastFy = null;
  if (m.fiscal_period_end_fy) { const d = new Date(m.fiscal_period_end_fy * 1000); lastFy = ymKey(d.getUTCFullYear(), d.getUTCMonth() + 1); }
  const years = [];
  for (let i = 0; i < Math.min(10, fyRev.length); i++) {
    const key = lastFy != null ? lastFy - 12 * i : null;
    years.push({ label: key != null ? String(fromKey(key)[0]) : `−${i}`, revenue: fyRev[i] ?? null, netIncome: fyNi[i] ?? null, fcf: fyFcf[i] ?? null,
      rate: isBist && key != null ? rateAt(fx, key) : null });
  }
  const surprises = (sur || []).slice(0, 4);
  return { market, isBist, sym, m, quarters, years, surprises, cur: isBist ? "₺" : "$" };
}

export function shares(q) {
  if (q.netIncome == null || q.eps == null || Math.abs(q.eps) < 0.005) return null;
  const s = q.netIncome / q.eps; return s > 0 ? s : null;
}
const usd = (v, rate) => (v == null || !rate ? null : v / rate);

const pct1 = (v) => (v == null || isNaN(v) ? "—" : (v > 0 ? "+" : "") + v.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%");
const pctP = (v) => (v == null || isNaN(v) ? "—" : "%" + f1(v));
export { pct1, pctP };

const BROAD = {
  "Electronic Technology": "technology", "Technology Services": "technology", Communications: "telecommunications",
  "Retail Trade": "consumer discretionary", "Consumer Durables": "consumer discretionary", "Consumer Services": "consumer discretionary",
  "Consumer Non-Durables": "consumer staples", "Health Technology": "health care", "Health Services": "health care", Finance: "finance",
  "Energy Minerals": "energy", Utilities: "utilities", "Non-Energy Minerals": "basic materials", "Process Industries": "basic materials",
};

/** 7 alanlı karne. level: 2 güçlü, 1 orta, 0 zayıf, -1 değerlendirilemez */
export function pillars(r) {
  const { m, quarters: q, isBist, cur } = r;
  const B = (v) => big(v, cur);
  const fin = m.sector === "Finance";
  const out = [];

  // 1) Büyüme
  {
    const gTl = m.total_revenue_yoy_growth_ttm ?? yoy(sum(q.slice(0, 4).map((x) => x.revenue)), sum(q.slice(4, 8).map((x) => x.revenue)));
    const usdNow = sum(q.slice(0, 4).map((x) => usd(x.revenue, x.rate))), usdPrev = sum(q.slice(4, 8).map((x) => usd(x.revenue, x.rate)));
    const gUsd = isBist ? yoy(usdNow, usdPrev) : null;
    const g = isBist ? gUsd : gTl;
    const qy = yoy(q[0]?.revenue, q[4]?.revenue), qyPrev = yoy(q[1]?.revenue, q[5]?.revenue);
    const y0 = r.years[0]?.revenue, y3 = r.years[3]?.revenue;
    const cagr = y0 > 0 && y3 > 0 ? ((y0 / y3) ** (1 / 3) - 1) * 100 : null;
    const y0u = usd(y0, r.years[0]?.rate), y3u = usd(y3, r.years[3]?.rate);
    const cagrUsd = isBist && y0u > 0 && y3u > 0 ? ((y0u / y3u) ** (1 / 3) - 1) * 100 : null;
    const epsG = m.earnings_per_share_diluted_yoy_growth_ttm;
    const level = g == null ? -1 : g >= 10 ? 2 : g >= 0 ? 1 : 0;
    let verdict = g == null ? "Veri yok"
      : (g >= 25 ? "Hızlı büyüyor" : g >= 10 ? "Sağlıklı büyüyor" : g >= 0 ? "Yavaş büyüyor" : "Küçülüyor") + `: satışlar son 12 ayda ${pct1(g)}` + (isBist ? " (dolar bazında)" : "");
    if (!isBist && qy != null && qyPrev != null) verdict += qy > qyPrev + 3 ? " · büyüme hızlanıyor" : qy < qyPrev - 3 ? " · büyüme yavaşlıyor" : "";
    const rows = [
      [`Son 12 ay gelir`, B(m.total_revenue), "Şirketin son 4 çeyrekte sattığı her şeyin toplamı (ciro).", isBist && usdNow ? `Dolar karşılığı yaklaşık ${big(usdNow)}` : null],
    ];
    if (isBist) {
      rows.push(["Gelir büyümesi: dolar bazında", pct1(gUsd), "Her çeyreğin TL geliri o çeyreğin sonundaki dolar kuruyla dolara çevrilip son 12 ay, önceki 12 ayla karşılaştırılır. Yüksek enflasyonda şirketin gerçekten büyüyüp büyümediğini en iyi bu rakam gösterir.",
        gUsd != null && gTl != null ? (gUsd < 0 && gTl > 0 ? "TL bazında büyüyor görünse de dolar bazında küçülüyor." : gUsd >= 0 ? "Dolar bazında da büyüyor: gerçek büyüme." : null) : null]);
      rows.push(["Gelir büyümesi: TL bazında", pct1(gTl), "TL cinsinden büyüme. Enflasyon yüksek olduğu için bu rakam şirket hiç büyümese de yüksek görünebilir; enflasyonla karşılaştırarak okuyun."]);
    } else {
      rows.push(["Gelir büyümesi (12 ay)", pct1(gTl), "Son 12 ayın geliri, ondan önceki 12 aya göre ne kadar değişti. %10'un üstü sağlıklı, %25'in üstü hızlı büyüme kabul edilir."]);
      rows.push(["Son çeyrek, geçen yılın aynı çeyreğine göre", pct1(qy), "Mevsim etkisini ortadan kaldırmak için son çeyrek, geçen yılın aynı çeyreğiyle karşılaştırılır.", qy != null && qyPrev != null ? `Bir önceki çeyrekte bu oran ${pct1(qyPrev)} idi.` : null]);
    }
    rows.push(["3 yıllık ortalama büyüme" + (isBist ? " (TL)" : ""), pct1(cagr), "Son 3 tam yılda gelirin yılda ortalama ne kadar büyüdüğü (bileşik). Tek bir iyi ya da kötü yılın etkisini dengeler."]);
    if (isBist) rows.push(["3 yıllık ortalama büyüme (dolar)", pct1(cagrUsd), "Aynı hesap, yıllık gelirler yıl sonu kuruyla dolara çevrilerek yapılır."]);
    rows.push(["Hisse başına kâr büyümesi (12 ay)", pct1(epsG), "Kârın büyüme hızı. Gelirden hızlı büyüyorsa şirket büyüdükçe daha verimli hale geliyor demektir." + (isBist ? " (TL bazında)" : ""),
      epsG != null && gTl != null ? (epsG > gTl ? "Kâr, gelirden hızlı büyüyor." : "Kâr, gelirden yavaş büyüyor.") : null]);
    out.push({ icon: "📈", title: "Büyüme", level, verdict, rows, lesson: 2 });
  }

  // 2) Kârlılık
  {
    const nm = m.net_margin, om = m.operating_margin, gm = m.gross_margin, roe = m.return_on_equity, roic = m.return_on_invested_capital;
    const gmOf = (x) => (x && x.gross != null && x.revenue > 0 ? (x.gross / x.revenue) * 100 : null);
    const gmNow = gmOf(q[0]), gmYear = gmOf(q[4]);
    const level = nm == null ? -1 : nm >= 15 ? 2 : nm > 0 ? 1 : 0;
    const verdict = nm == null ? "Veri yok" : nm >= 25 ? `Çok kârlı: her 100 ${cur} satıştan ${Math.round(nm)} ${cur} net kâr` : nm >= 15 ? `Güçlü kârlılık: net marj ${pctP(nm)}` : nm > 0 ? `Kâr ediyor ama marj ince: ${pctP(nm)}` : `Zarar ediyor: net marj ${pctP(nm)}`;
    const rows = [];
    if (!fin) rows.push(["Brüt marj", pctP(gm), "Satıştan sadece ürünün doğrudan maliyeti düşülünce kalan pay. Ürünün ne kadar değerli olduğunu, fiyatlama gücünü gösterir.",
      gmNow != null && gmYear != null ? `Son çeyrekte %${f1(gmNow)}, geçen yılın aynı çeyreğinde %${f1(gmYear)}` + (gmNow > gmYear + 1 ? " → marj artıyor." : gmNow < gmYear - 1 ? " → marj düşüyor." : " → yatay.") : null]);
    if (!fin) rows.push(["Faaliyet marjı", pctP(om), "Ar-Ge, pazarlama, maaş gibi işletme giderleri de düşüldükten sonra asıl işten kalan pay."]);
    rows.push(["Net kâr marjı", pctP(nm), `Her 100 ${cur} satıştan faiz ve vergi dahil her şey düşüldükten sonra kalan kâr.`]);
    rows.push(["Özsermaye kârlılığı (ROE)", pctP(roe), "Ortakların koyduğu sermayeyle yılda yüzde kaç kâr edildiği. %15'in üstü iyi kabul edilir; borç çok yüksekse yapay olarak şişebilir." +
      (isBist ? " Türkiye'de enflasyon yüksek olduğu için ROE'nin enflasyonun üstünde olması önemlidir; altındaysa ortakların parası reel olarak eriyor demektir." : ""),
      fin ? "Bankalarda en önemli kârlılık ölçüsü budur." : null]);
    if (!fin) rows.push(["Yatırılan sermayenin getirisi (ROIC)", pctP(roic), "İşe yatırılan her 100 birimden (ortak parası + borç) yılda ne kadar kâr edildiği. Sürekli %15'in üstündeyse şirketin rakiplerinin kolay kopyalayamadığı bir avantajı olabilir.",
      roic == null ? null : roic >= 20 ? "Çok yüksek: güçlü rekabet avantajı işareti." : roic >= 10 ? "İyi." : roic > 0 ? "Düşük." : "Eksi: sermaye şu an kâr üretmiyor."]);
    out.push({ icon: "💎", title: "Kârlılık", level, verdict, rows, lesson: 3 });
  }

  // 3) Nakit
  {
    const fcf = m.free_cash_flow_ttm, fcfm = m.free_cash_flow_margin_ttm, cash = m.cash_n_short_term_invest_fq;
    const niTtm = sum(q.slice(0, 4).map((x) => x.netIncome));
    const quality = fcf != null && niTtm > 0 ? fcf / niTtm : null;
    const runway = fcf != null && fcf < 0 && cash != null ? cash / -fcf : null;
    let level = fcf == null ? -1 : fcf > 0 && (fcfm ?? 0) >= 10 ? 2 : fcf > 0 ? 1 : runway != null && runway >= 3 ? 1 : 0;
    let verdict = fcf == null ? "Veri yok" : fcf > 0 ? `Nakit üretiyor: son 12 ayda ${B(fcf)} serbest nakit`
      : runway != null ? `Nakit yakıyor: yılda ${B(-fcf)}; kasa yaklaşık ${f1(runway)} yıl yeter` : `Nakit yakıyor: yılda ${B(-fcf)}`;
    if (fin) { level = -1; verdict = "Banka/finans şirketi: serbest nakit akışı bu şirketler için anlamlı değil"; }
    out.push({ icon: "🌊", title: "Nakit üretimi", level, verdict, lesson: 4, rows: [
      ["Serbest nakit akışı (12 ay)", B(fcf), "İşten gelen nakitten fabrika, makine gibi yatırım harcamaları düşüldükten sonra kalan para. Şirketin gerçekten ne kadar para ürettiğini gösterir; borç ödemek, temettü ve geri alım bu paradan yapılır."],
      ["Serbest nakit marjı", pctP(fcfm), `Her 100 ${cur} satıştan kasaya kalan serbest nakit. %10'un üstü güçlüdür.`],
      ["Nakit / kâr uyumu", quality != null ? f1(quality) + " kat" : "—", "Serbest nakit akışının net kâra oranı. 1'e yakın ya da üstündeyse açıklanan kâr gerçekten kasaya giriyor demektir. Uzun süre 0,5'in altındaysa kâr kağıt üstünde kalıyor olabilir.",
        quality == null ? null : quality >= 0.8 ? "Kâr nakde dönüşüyor: sağlıklı." : quality >= 0.5 ? "Kârın bir kısmı nakde dönüşmüyor." : "Kâr ile nakit arasında büyük fark var: dikkat."],
      ["Kasadaki nakit ve yatırımlar", B(cash), "Şirketin elindeki nakit ve kısa vadede nakde çevrilebilecek yatırımlar.",
        runway != null ? `Bu hızla nakit yakmaya devam ederse kasa yaklaşık ${f1(runway)} yıl yeter. Para biterse yeni hisse satmak ya da borçlanmak zorunda kalabilir.` : null],
    ] });
  }

  // 4) Bilanço ve borç
  {
    const debt = m.total_debt, cash = m.cash_n_short_term_invest_fq, fcf = m.free_cash_flow_ttm;
    const netDebt = debt != null && cash != null ? debt - cash : m.net_debt;
    const years = netDebt > 0 && fcf > 0 ? netDebt / fcf : null;
    const cr = m.current_ratio, z = m.altman_z_score_ttm;
    let level = fin || netDebt == null ? -1 : netDebt <= 0 ? 2 : years != null && years <= 3 ? 2 : years != null && years <= 6 ? 1 : 0;
    if (!fin && z != null && z < 1.8 && level > 1) level = 1;
    const verdict = fin ? "Banka/finans şirketi: borç işin doğası gereği, bu ölçüler uygun değil"
      : netDebt == null ? "Veri yok" : netDebt <= 0 ? `Sağlam: kasadaki nakit borcundan ${B(-netDebt)} fazla`
      : years != null ? `Net borç ${B(netDebt)}; nakit akışıyla ~${f1(years)} yılda öder` : `Net borç ${B(netDebt)} ve nakit üretmiyor: dikkat`;
    out.push({ icon: "🛡️", title: "Bilanço ve borç", level, verdict, lesson: 5, rows: [
      ["Toplam borç", B(debt), "Bankalara ve tahvil sahiplerine olan toplam borç." + (isBist ? " Borcun döviz cinsinden olan kısmı kur yükseldiğinde TL olarak büyür." : "")],
      ["Kasadaki nakit", B(cash), "Nakit ve kısa vadeli yatırımlar."],
      [netDebt != null && netDebt <= 0 ? "Net nakit" : "Net borç", B(netDebt != null ? Math.abs(netDebt) : null), "Borç − nakit. Nakit borçtan fazlaysa şirket “net nakit” durumundadır ve istese bütün borcunu hemen ödeyebilir.",
        years != null ? `Bugünkü serbest nakit akışıyla bu borcu yaklaşık ${f1(years)} yılda ödeyebilir. 3 yıldan az rahat, 6 yıldan fazla riskli kabul edilir.` : null],
      ["Cari oran", f2(cr), "1 yıl içinde nakde dönecek varlıklar ÷ 1 yıl içinde ödenecek borçlar. 1'in üstü kısa vadeli borçların rahat ödenebileceğini gösterir.",
        fin ? "Bankalar için anlamlı değil." : cr == null ? null : cr >= 1.5 ? "Rahat." : cr >= 1 ? "Yeterli." : "1'in altında: kısa vadede sıkışabilir (çok nakit üreten devlerde olağan olabilir)."],
      ["Altman Z puanı", f1(z), "Mali sıkıntı riskini tahmin eden puan. 3'ün üstü güvenli, 1,8–3 gri bölge, 1,8'in altı sıkıntı bölgesi. Bankalar için anlamlı değildir.",
        fin ? "Finans şirketi olduğu için bu puan anlamlı değil." : z == null ? null : z >= 3 ? "Güvenli bölge." : z >= 1.8 ? "Gri bölge." : "Sıkıntı bölgesi: dikkat."],
    ] });
  }

  // 5) Hissedara davranış
  {
    const s0 = q[0] && shares(q[0]), s4 = q[4] && shares(q[4]), s12 = q[11] && shares(q[11]);
    const ch1 = s0 && s4 ? (s0 / s4 - 1) * 100 : null, ch3 = s0 && s12 ? (s0 / s12 - 1) * 100 : null;
    const dy = m.dividend_yield_recent, payout = m.dividend_payout_ratio_ttm;
    const level = ch1 == null ? -1 : ch1 <= 0.5 ? 2 : ch1 <= 3 ? 1 : 0;
    const verdict = (ch1 == null ? "Hisse sayısı hesaplanamadı" : ch1 < -0.5 ? `Hisse geri alıyor: hisse sayısı 1 yılda ${pct1(ch1)}`
      : ch1 <= 0.5 ? "Hisse sayısı sabit: payınız korunuyor" : ch1 <= 3 ? `Hafif seyreltme: hisse sayısı 1 yılda ${pct1(ch1)}` : `Seyreltme: hisse sayısı 1 yılda ${pct1(ch1)} arttı`)
      + (dy > 0 ? ` · temettü %${f1(dy)}` : "");
    out.push({ icon: "🍕", title: "Hissedara davranış", level, verdict, lesson: 6, rows: [
      ["Hisse sayısı değişimi (1 yıl)", pct1(ch1), "Şirket yeni hisse basarsa sizin payınız küçülür (seyreltme); hisse geri alırsa büyür. Yılda %3'ten fazla artış dikkat gerektirir.\n\nNot: Hisse sayısı net kâr ÷ hisse başına kârdan yaklaşık olarak hesaplanır." + (isBist ? " Bedelsiz sermaye artırımları (bölünme) hisse sayısını artırır ama payınızı küçültmez; BIST'te sık görülür, bu yüzden bedelli/bedelsiz ayrımına dikkat edin." : "")],
      ["Hisse sayısı değişimi (3 yıl)", pct1(ch3), "Uzun vadeli eğilim. Apple gibi şirketler yıllardır hisse sayısını azaltırken genç teknoloji şirketleri genelde artırır."],
      ["Temettü verimi", dy > 0 ? "%" + f2(dy) : "Yok", "Yıllık dağıtılan kâr payının hisse fiyatına oranı. Büyüme şirketleri genelde temettü vermez; kârı yeniden yatırır, bu kötü değildir."],
      ["Temettü dağıtım oranı", payout > 0 ? "%" + Math.round(payout) : "—", "Kârın yüzde kaçının temettü olarak dağıtıldığı. %100'ün üstü kazanılandan fazla dağıtıldığı anlamına gelir ve uzun süre sürmez.",
        payout > 0 ? (payout > 100 ? "Kazandığından fazlasını dağıtıyor: temettü risk altında olabilir." : payout > 70 ? "Yüksek dağıtım oranı." : "Makul.") : null],
    ] });
  }

  // 6) Fiyat
  {
    const pe = m.price_earnings_ttm > 0 ? m.price_earnings_ttm : null, ps = m.price_sales_current, pb = m.price_book_fq;
    const peg = !isBist && m.price_earnings_growth_ttm > 0 ? m.price_earnings_growth_ttm : null;
    let level;
    if (isBist) level = fin ? (pb == null ? -1 : pb < 1 ? 2 : pb <= 2 ? 1 : 0) : pe != null ? (pe < 6 ? 2 : pe <= 15 ? 1 : 0) : ps != null ? (ps > 5 ? 0 : 1) : -1;
    else level = pe != null && peg != null ? (peg < 1 ? 2 : peg <= 2 ? 1 : 0) : pe != null ? (pe < 15 ? 2 : pe <= 35 ? 1 : 0) : ps != null ? (ps > 15 ? 0 : 1) : -1;
    const word = level === 2 ? "Ucuz görünüyor" : level === 1 ? "Makul" : "Pahalı görünüyor";
    const verdict = level === -1 ? "Veri yok"
      : isBist && fin ? `${word}: PD/DD ${f2(pb)}, F/K ${f1(pe)}`
      : pe == null ? `Kâr yok; fiyat satışların ${f1(ps)} katı` + (ps > 15 ? " (çok yüksek beklenti)" : "")
      : `${word}: F/K ${f1(pe)}` + (peg ? `, PEG ${f2(peg)}` : "");
    const rows = [
      ["F/K", f1(pe), "Hisse fiyatı ÷ hisse başına yıllık kâr. Şirketin bugünkü kârıyla kendi değerini kaç yılda kazanacağını gösterir.",
        isBist ? "BIST'te enflasyon ve enflasyon muhasebesi kârları oynattığı için F/K'lar ABD'den çok düşüktür; aynı sektördeki BIST şirketleriyle karşılaştırın. Kabaca 6'nın altı ucuz, 15'in üstü pahalı kabul edilebilir." : peComment(pe, null, BROAD[m.sector] || "industrials")],
    ];
    if (!isBist) rows.push(["PEG", f2(peg), "F/K ÷ kâr büyümesi. Hızlı büyüyen şirketin yüksek F/K'sını adil değerlendirmeye yarar. 1'in altı büyümesine göre ucuz, 1–2 makul, 2'nin üstü pahalı."]);
    rows.push(["PD/DD", f2(pb), "Piyasa değeri ÷ defterdeki özsermaye. 1'in altı şirketin muhasebe değerinden ucuza işlem gördüğünü gösterir. Bankalarda en çok bakılan orandır."]);
    rows.push(["Fiyat / Satış", f1(ps), "Piyasa değeri ÷ yıllık gelir. Kâr etmeyen şirketlerde kullanılır. 1–3 olağan, 10'un üstü çok yüksek büyüme beklentisi demektir."]);
    rows.push(["Piyasa değeri", B(m.market_cap_basic), "Hisse fiyatı × toplam hisse sayısı: şirketin borsadaki toplam değeri."]);
    out.push({ icon: "🏷️", title: "Fiyat (değerleme)", level, verdict, rows, lesson: 7, price: true });
  }

  // 7) Beklentiler
  {
    let rows, level, verdict;
    if (r.surprises.length) {
      const beats = r.surprises.filter((x) => (x[4] ?? 0) > 0).length;
      level = beats >= 3 ? 2 : beats === 2 ? 1 : 0;
      verdict = `Son ${r.surprises.length} çeyreğin ${beats} tanesinde kâr beklentisini aştı`;
      rows = r.surprises.map((x) => [`${qTr(x[0])} çeyreği`, `${f2(x[2])} $ / bekl. ${f2(x[3])} $`,
        "Analistlerin ortalama hisse başına kâr beklentisi ile şirketin açıkladığı (düzeltilmiş) rakam. Şirketlerin çoğu beklentiyi küçük farkla aşar; sürekli kaçırmak uyarı işaretidir.",
        x[4] != null ? (x[4] >= 0 ? `Beklentiyi %${f1(x[4])} aştı (açıklama: ${x[1]})` : `Beklentinin %${f1(-x[4])} altında kaldı (açıklama: ${x[1]})`) : null]);
    } else {
      const a = m.earnings_per_share_fq, f = m.earnings_per_share_forecast_fq, rv = m.revenue_fq, rf = m.revenue_forecast_fq;
      if (a != null && f) {
        const s = ((a - f) / Math.abs(f)) * 100;
        level = s >= 0 ? 2 : 0;
        verdict = s >= 0 ? `Son çeyrekte kâr beklentisini %${f1(s)} aştı` : `Son çeyrekte kâr beklentisinin %${f1(-s)} altında kaldı`;
      } else { level = -1; verdict = "Bu şirket için analist beklentisi yok"; }
      rows = [["Son çeyrek hisse başına kâr", a != null ? `${f2(a)} ${cur} / bekl. ${f2(f)} ${cur}` : "—", "Analistlerin ortalama beklentisi ile açıklanan rakam. Az sayıda analistin izlediği şirketlerde beklenti olmayabilir."]];
      if (rv && rf && rv !== rf) rows.push(["Son çeyrek gelir", `${B(rv)} / bekl. ${B(rf)}`, "Gelirin beklentiyle karşılaştırması.", rv >= rf ? "Gelir beklentiyi aştı." : "Gelir beklentinin altında kaldı."]);
      if (isBist) rows.push(["Not", "", "Borsa İstanbul şirketleri için geçmiş çeyreklerin beklenti tablosu ücretsiz kaynaklarda yok; sadece son çeyrek gösterilir."]);
    }
    out.push({ icon: "🎯", title: "Beklentileri karşılama", level, verdict, rows, lesson: 8 });
  }
  return out;
}

export const sectorName = (s) => sectorTr(s);
