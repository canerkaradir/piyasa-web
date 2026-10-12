// Biçimlendirme ve küçük arayüz parçaları
export const TRL = "tr-TR";

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function price(v, digits) {
  if (v == null || isNaN(v)) return "—";
  const a = Math.abs(v);
  const d = digits ?? (a >= 1 ? 2 : a >= 0.01 ? 4 : 8);
  return v.toLocaleString(TRL, { minimumFractionDigits: d, maximumFractionDigits: d });
}
export function big(v, cur = "$") {
  if (v == null || isNaN(v) || v === 0) return "—";
  const a = Math.abs(v);
  const f = (x, d) => x.toLocaleString(TRL, { minimumFractionDigits: d, maximumFractionDigits: d });
  if (a >= 1e12) return f(v / 1e12, 2) + " trilyon " + cur;
  if (a >= 1e9) return f(v / 1e9, 1) + " milyar " + cur;
  if (a >= 1e6) return f(v / 1e6, 1) + " milyon " + cur;
  return f(v, 0) + " " + cur;
}
export function amount(v) {
  if (v == null) return "—";
  const a = Math.abs(v);
  const f = (x) => x.toLocaleString(TRL, { maximumFractionDigits: 2 });
  if (a >= 1e12) return f(v / 1e12) + " trilyon";
  if (a >= 1e9) return f(v / 1e9) + " milyar";
  if (a >= 1e6) return f(v / 1e6) + " milyon";
  return v.toLocaleString(TRL, { maximumFractionDigits: 0 });
}
export function pct(v) {
  if (v == null || isNaN(v)) return "—";
  return (v > 0 ? "+" : "") + v.toLocaleString(TRL, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}
export function f1(v) { return v == null || isNaN(v) ? "—" : v.toLocaleString(TRL, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
export function f2(v) { return v == null || isNaN(v) ? "—" : v.toLocaleString(TRL, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function pill(v) {
  const c = v == null ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat";
  return `<span class="pill ${c}">${pct(v)}</span>`;
}

export function timeAgo(t) {
  if (!t) return "";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return m + " dk önce";
  if (m < 1440) return Math.floor(m / 60) + " sa önce";
  return Math.floor(m / 1440) + " gün önce";
}

const AV = ["#1f4e9c", "#b8860b", "#2e7d32", "#6a1b9a", "#c62828", "#00838f", "#4e342e", "#283593"];
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
export function logo(url, name, size = 34) {
  const ini = (name || "?").split(/[\s.\-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  const color = AV[hash(name || "?") % AV.length];
  const fb = `<span class="avatar" style="width:${size}px;height:${size}px;background:${color}">${esc(ini)}</span>`;
  if (!url) return fb;
  return `<img class="logo" style="width:${size}px;height:${size}px" src="${esc(url)}" alt="" loading="lazy" onerror="this.outerHTML=this.dataset.fb" data-fb='${fb.replace(/'/g, "&#39;")}'>`;
}
export const usLogo = (s) => `https://images.financialmodelingprep.com/symbol/${s.replace(".", "-").toUpperCase()}.png`;
export const tvLogo = (id) => (id ? `https://s3-symbol-logo.tradingview.com/${id}--big.svg` : "");

export function cleanName(n) {
  return (n || "")
    .replace(/\s+(Class [A-C] )?(Common Stock|Capital Stock|Ordinary Shares|Common Shares|American Depositary Shares).*$/, "")
    .replace(/,?\s+(Inc\.?|Corporation|Corp\.?|Incorporated|plc|N\.V\.|Ltd\.?|Holdings?)$/, "")
    .replace(/\s+(A\.S\.|A\.Ş\.|T\.A\.S\.|A\.O\.|Anonim Sirketi|Anonim Ortakligi|Turk Anonim Ortakligi)(\s+Class [A-Z])?$/, "")
    .replace(/\s+Class [A-Z]$/, "").trim();
}

export function spinner() { return `<div class="spinner"></div>`; }

/** Küçük çizgi grafik (SVG). */
export function spark(values, w = 90, h = 30, baseline) {
  if (!values || values.length < 3) return `<svg width="${w}" height="${h}"></svg>`;
  let min = Math.min(...values), max = Math.max(...values);
  if (baseline != null) { min = Math.min(min, baseline); max = Math.max(max, baseline); }
  const span = max - min || 1;
  const up = values[values.length - 1] >= (baseline ?? values[0]);
  const col = up ? "#1b7f3b" : "#c62828";
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / span) * (h - 4)}`).join(" ");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="0,${h} ${pts} ${w},${h}" fill="${col}" fill-opacity="0.15"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.8"/></svg>`;
}

/** Tıklayınca açıklaması açılan satır. */
export function metric(label, value, explain, comment) {
  return `<div class="metric" onclick="this.classList.toggle('open')">
    <div class="row between"><span>${esc(label)}</span><span><span class="mv">${esc(value)}</span><span class="arr">▼</span></span></div>
    ${comment ? `<div class="mc">${esc(comment)}</div>` : ""}
    <div class="mx">${esc(explain).replace(/\n/g, "<br>")}</div></div>`;
}

export function section(title) { return `<h2>${esc(title)}</h2>`; }

export const SECTOR_TR = {
  "Finance": "Finans", "Energy Minerals": "Enerji / petrol", "Non-Energy Minerals": "Maden ve metal", "Transportation": "Ulaştırma",
  "Retail Trade": "Perakende", "Consumer Durables": "Dayanıklı tüketim", "Consumer Non-Durables": "Gıda ve içecek",
  "Communications": "Telekomünikasyon", "Electronic Technology": "Elektronik teknoloji", "Producer Manufacturing": "Sanayi üretimi",
  "Process Industries": "Proses sanayi", "Industrial Services": "Sanayi hizmetleri", "Utilities": "Elektrik / su hizmetleri",
  "Technology Services": "Yazılım ve teknoloji hizmetleri", "Health Technology": "Sağlık teknolojisi / ilaç", "Health Services": "Sağlık hizmetleri",
  "Distribution Services": "Dağıtım", "Commercial Services": "Ticari hizmetler", "Consumer Services": "Tüketici hizmetleri", "Miscellaneous": "Diğer",
  "Technology": "Teknoloji", "Telecommunications": "İletişim", "Consumer Discretionary": "Döngüsel tüketim", "Consumer Staples": "Temel tüketim",
  "Health Care": "Sağlık", "Industrials": "Sanayi", "Energy": "Enerji", "Real Estate": "Gayrimenkul", "Basic Materials": "Hammadde",
};
export const sectorTr = (s) => SECTOR_TR[s] || s || "";

/** Sektöre göre tipik F/K aralığı (yaklaşık). */
const PE = [
  [["technology", "electronic technology", "technology services"], "Teknoloji", 25, 35],
  [["telecommunications", "communications"], "İletişim ve medya", 15, 25],
  [["consumer discretionary", "retail trade", "consumer durables", "consumer services"], "Döngüsel tüketim", 20, 30],
  [["consumer staples", "consumer non-durables"], "Temel tüketim", 18, 24],
  [["health care", "health technology", "health services"], "Sağlık", 18, 25],
  [["finance"], "Finans", 11, 16],
  [["industrials", "producer manufacturing", "industrial services", "transportation"], "Sanayi", 18, 25],
  [["energy", "energy minerals"], "Enerji", 9, 15],
  [["utilities"], "Hizmetler", 15, 20],
  [["real estate"], "Gayrimenkul", 25, 40],
  [["basic materials", "non-energy minerals", "process industries"], "Hammadde", 14, 20],
];
export function peComment(pe, fpe, sector) {
  if (pe == null || pe <= 0) return "Şirket son 12 ayda zarar ettiği (ya da kârı çok düşük olduğu) için F/K anlamlı değil. Bu durumda fiyat/satış oranına bakılır.";
  const s = (sector || "").toLowerCase();
  const info = PE.find((p) => p[0].includes(s));
  let out;
  if (!info) out = "Bu sektör için karşılaştırma verisi yok.";
  else {
    const [, tr, lo, hi] = info;
    const v = pe > hi * 3 ? "Sektörüne göre çok yüksek: yatırımcılar kârın katlanarak artmasını bekliyor; beklenti tutmazsa düşüş sert olabilir."
      : pe > hi ? "Sektörüne göre yüksek: piyasa ortalamadan hızlı büyüme bekliyor (ya da hisse pahalı)."
      : pe < lo * 0.7 ? "Sektörüne göre düşük: ya ucuz kalmış ya da piyasa kârın düşeceğinden endişe ediyor."
      : pe < lo ? "Sektör ortalamasının biraz altında." : "Sektörü için normal aralıkta.";
    out = `${tr} sektöründe tipik aralık yaklaşık ${lo}–${hi}. ${v}`;
  }
  if (fpe && fpe > 0) {
    out += fpe < pe * 0.85 ? ` İleriye dönük F/K (${f1(fpe)}) daha düşük: analistler kârın artmasını bekliyor.`
      : fpe > pe * 1.15 ? ` İleriye dönük F/K (${f1(fpe)}) daha yüksek: kârın azalması bekleniyor.` : "";
  }
  return out;
}
