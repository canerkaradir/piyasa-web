// Adil değer tahmini: birkaç basit yöntemle bir aralık. Öğrenme amaçlıdır.
import { sectorPe } from "./ui.js";

export const FAIR_COLS = ["price_target_average", "price_target_high", "price_target_low", "recommendation_total", "recommendation_buy",
  "recommendation_hold", "recommendation_sell", "earnings_per_share_forecast_next_fy", "earnings_per_share_diluted_ttm",
  "free_cash_flow_ttm", "net_debt", "total_shares_outstanding_fundamental", "total_revenue_yoy_growth_ttm"];

/**
 * m: TradingView satırı. Dönen: { methods: [{key, name, value, detail, explain}], low, high, mid, verdict, level }
 * level: 2 tahminlerin altında (ucuz görünüyor), 1 aralıkta, 0 üstünde (pahalı görünüyor)
 */
export function fairValue(m, isBist) {
  const price = m.close, cur = isBist ? "₺" : "$";
  const fin = m.sector === "Finance";
  const methods = [];
  const fmt = (v) => v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + cur;

  // 1) Analist hedefi
  if (m.price_target_average > 0) {
    const n = m.recommendation_total;
    methods.push({ key: "analyst", name: "Analistlerin 12 aylık hedefi", value: m.price_target_average,
      detail: (m.price_target_low && m.price_target_high ? `En düşük ${fmt(m.price_target_low)} · en yüksek ${fmt(m.price_target_high)}` : "") +
        (n ? ` · ${n} analist (${m.recommendation_buy || 0} al, ${m.recommendation_hold || 0} tut, ${m.recommendation_sell || 0} sat)` : ""),
      explain: "Şirketi takip eden banka ve aracı kurum analistlerinin 12 ay sonrası için tahmin ettiği fiyatların ortalaması. Analistler şirketi çok yakından izler ama sık sık yanılır ve genelde iyimserdir. En düşük ile en yüksek tahmin arasındaki fark ne kadar büyükse belirsizlik o kadar yüksektir." });
  }

  // 2) Sektör F/K'sına göre
  const eps = m.earnings_per_share_forecast_next_fy > 0 ? m.earnings_per_share_forecast_next_fy : m.earnings_per_share_diluted_ttm > 0 ? m.earnings_per_share_diluted_ttm : null;
  const fwd = m.earnings_per_share_forecast_next_fy > 0;
  if (eps) {
    let pe, label;
    if (isBist) { pe = fin ? 6 : 8; label = `BIST için tipik kabul edilen ${pe} kat F/K`; }
    else { const s = sectorPe(m.sector); pe = s ? (s[1] + s[2]) / 2 : 18; label = s ? `${s[0]} sektörünün tipik F/K'sı (${s[1]}–${s[2]} aralığının ortası: ${pe})` : `piyasanın uzun dönem ortalaması (${pe} kat)`; }
    methods.push({ key: "pe", name: "Sektör F/K'sına göre değer", value: eps * pe,
      detail: `${fwd ? "Gelecek yıl beklenen" : "Son 12 ay"} hisse başına kâr ${fmt(eps)} × ${pe} kat`,
      explain: `Şirketin hisse başına kârını, benzer şirketlerin genelde işlem gördüğü F/K ile çarpar: “Bu şirket sektöründeki ortalama bir şirket kadar değerli olsaydı fiyatı ne olurdu?” Burada ${label} kullanıldı.\n\nHızlı büyüyen şirketler bu yöntemle hep “pahalı”, büyümeyen ya da sorunlu şirketler hep “ucuz” görünebilir; tek başına yeterli değildir.` +
        (isBist ? "\n\nBIST'te enflasyon muhasebesi kârları oynattığı için bu yöntem kaba bir fikir verir." : "") });
  }

  // 3) İndirgenmiş nakit akışı (yalnızca ABD, finans dışı, nakit üreten)
  const sh = m.total_shares_outstanding_fundamental || (m.market_cap_basic && price ? m.market_cap_basic / price : null);
  if (!isBist && !fin && m.free_cash_flow_ttm > 0 && sh) {
    const g1 = Math.max(0, Math.min(20, m.total_revenue_yoy_growth_ttm ?? 5)) / 100, r = 0.09, tg = 0.025;
    let cf = m.free_cash_flow_ttm / sh, pv = 0;
    for (let y = 1; y <= 10; y++) {
      const g = y <= 5 ? g1 : g1 + ((0.03 - g1) * (y - 5)) / 5;
      cf *= 1 + g; pv += cf / (1 + r) ** y;
    }
    const tv = (cf * (1 + tg)) / (r - tg) / (1 + r) ** 10;
    const netCash = m.net_debt != null ? -m.net_debt / sh : 0;
    const v = pv + tv + netCash;
    if (v > 0) methods.push({ key: "dcf", name: "Nakit akışına göre değer (DCF)", value: v,
      detail: `Hisse başına serbest nakit ${fmt(m.free_cash_flow_ttm / sh)} · ilk 5 yıl %${Math.round(g1 * 100)} büyüme, sonra yavaşlama · %9 iskonto`,
      explain: "İndirgenmiş nakit akışı (DCF), profesyonel analistlerin en çok kullandığı yöntemdir: şirketin gelecekte üreteceği serbest nakdi tahmin edip bugünkü değerine indirger. Mantığı şudur: 10 yıl sonra kazanılacak 100 dolar bugünkü 100 dolardan daha az değerlidir.\n\nBuradaki basit hesap: Son 12 ayın serbest nakit akışı ilk 5 yıl şirketin bugünkü gelir büyüme hızıyla (en fazla %20), sonraki 5 yılda yavaş yavaş %3'e inerek büyür; sonrası için yılda %2,5 büyüme varsayılır ve her yıl %9 ile iskonto edilir. Varsayımlardaki küçük değişiklikler sonucu çok değiştirir." });
  }

  if (!methods.length) return null;
  const vals = methods.map((x) => x.value).sort((a, b) => a - b);
  const low = vals[0], high = vals[vals.length - 1];
  const mid = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
  const lowB = Math.min(low, mid * 0.9), highB = Math.max(high, mid * 1.1);
  const level = price < lowB * 0.95 ? 2 : price > highB * 1.05 ? 0 : 1;
  const diff = ((mid - price) / price) * 100;
  const verdict = level === 2 ? "Fiyat, tahminlerin altında: ucuz görünüyor" : level === 0 ? "Fiyat, tahminlerin üstünde: pahalı görünüyor" : "Fiyat, tahmin aralığının içinde: makul görünüyor";
  return { methods, low: lowB, high: highB, mid, diff, level, verdict, cur };
}
