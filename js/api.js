// Veri katmanı: tarayıcıdan doğrudan erişilebilen kaynaklar + GitHub'ın topladığı data/*.json

const mem = new Map();
async function cached(key, ttlMs, fn) {
  const c = mem.get(key);
  if (c && Date.now() - c.t < ttlMs) return c.v;
  const v = await fn();
  mem.set(key, { t: Date.now(), v });
  return v;
}

export async function getJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

/** GitHub'ın topladığı yerel veri. */
export const local = (name) => cached("local:" + name, 5 * 60_000, () => getJSON("data/" + name + "?t=" + Math.floor(Date.now() / 300_000)));

// ---------------- sayı yardımcıları
export const num = (s) => {
  if (s == null) return null;
  const v = parseFloat(String(s).replace(/[,%$+]/g, ""));
  return isNaN(v) ? null : v;
};
export const suffixNum = (s) => {
  if (!s) return null;
  const t = String(s).replace(/[,$%]/g, "").trim();
  const m = { T: 1e12, B: 1e9, M: 1e6, K: 1e3 }[t.slice(-1)];
  const v = parseFloat(m ? t.slice(0, -1) : t);
  return isNaN(v) ? null : v * (m || 1);
};

// ---------------- CNBC
export function cnbcSym(s) { return s.replace("/", ".").replace("-", "."); }

export const cnbcQuotes = (symbols) => cached("q:" + symbols.join("|"), 30_000, async () => {
  const url = "https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=" +
    encodeURIComponent(symbols.join("|")) + "&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json";
  const j = await getJSON(url);
  let arr = j.FormattedQuoteResult.FormattedQuote;
  if (!Array.isArray(arr)) arr = [arr];
  const out = {};
  for (const q of arr) if (q && q.code == 0) out[q.symbol] = q;
  return out;
});

const pad = (n) => String(n).padStart(2, "0");
function nyStamp(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}0000`;
}

/** Fiyat geçmişi. range: {label, days, intraday} */
export const RANGES = [
  { label: "1G", days: 1, intraday: true }, { label: "5G", days: 5, intraday: true },
  { label: "1A", days: 31 }, { label: "3A", days: 92 }, { label: "6A", days: 183 },
  { label: "1Y", days: 366 }, { label: "2Y", days: 731 }, { label: "3Y", days: 1096 }, { label: "4Y", days: 1461 },
  { label: "5Y", days: 1827 }, { label: "10Y", days: 3653 }, { label: "Tüm", days: 0 },
];

export function bars(symbol, label) {
  const r = RANGES.find((x) => x.label === label);
  return cached(`b:${symbol}:${label}`, r.intraday ? 60_000 : 10 * 60_000, async () => {
    const now = new Date(Date.now() + 86400_000);
    let interval = "1D", from;
    if (r.intraday) { interval = "5M"; from = new Date(Date.now() - (r.days === 1 ? 5 : 10) * 86400_000); }
    else if (r.days === 0) { interval = "1W"; from = new Date(Date.UTC(1960, 0, 1)); }
    else from = new Date(Date.now() - r.days * 86400_000);
    const url = `https://ts-api.cnbc.com/harmony/app/bars/${encodeURIComponent(symbol)}/${interval}/${nyStamp(from)}/${nyStamp(now)}/adjusted/EST5EDT.json`;
    const j = await getJSON(url);
    const pb = (j.barData && j.barData.priceBars) || [];
    let out = [];
    for (const b of pb) {
      const c = parseFloat(b.close);
      if (isNaN(c) || c <= 0) continue;
      if (interval === "1D" && b.open === b.high && b.high === b.low && b.low === b.close && !b.volume) continue;
      out.push({ t: b.tradeTimeinMills, c, d: b.tradeTime.slice(0, 8) });
    }
    if (r.intraday) {
      const days = [...new Set(out.map((x) => x.d))].slice(-r.days);
      out = out.filter((x) => days.includes(x.d));
    }
    return out;
  });
}

// ---------------- TradingView tarayıcısı (Content-Type göndermeden: önden izin isteği gerekmez)
export async function tvScan(market, body) {
  const r = await fetch(`https://scanner.tradingview.com/${market}/scan`, { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) throw new Error("TV " + r.status);
  const j = await r.json();
  const cols = body.columns;
  const rows = (j.data || []).map((row) => {
    const m = { _s: row.s };
    cols.forEach((c, i) => (m[c] = row.d[i]));
    return m;
  });
  return { total: j.totalCount ?? rows.length, rows };
}

const TYPE_FILTER = { left: "type", operation: "in_range", right: ["stock", "dr"] };
function scope(kind) {
  const body = { filter: [TYPE_FILTER] };
  if (kind === "NASDAQ") {
    body.filter.push({ left: "exchange", operation: "equal", right: "NASDAQ" }, { left: "is_primary", operation: "equal", right: true });
  } else if (kind === "BIST30" || kind === "BIST100") {
    body.symbols = { query: { types: [] }, tickers: [], groups: [{ type: "index", values: [kind === "BIST30" ? "BIST:XU030" : "BIST:XU100"] }] };
  } else {
    body.symbols = { query: { types: [] }, tickers: [], groups: [{ type: "index", values: [kind === "SPX" ? "SP:SPX" : "TVC:RUT"] }] };
  }
  return body;
}
export const LIST_COLS = ["name", "description", "close", "change", "market_cap_basic", "sector", "logoid"];

export function listPage(kind, offset, limit = 100, query = "") {
  const b = scope(kind);
  if (query) b.filter.push({ left: "name,description", operation: "match", right: query });
  b.columns = LIST_COLS;
  b.sort = { sortBy: "market_cap_basic", sortOrder: "desc" };
  b.range = [offset, offset + limit];
  return cached(`l:${kind}:${offset}:${query}`, 60_000, () => tvScan(kind.startsWith("BIST") ? "turkey" : "america", b));
}

export async function breadth(kind) {
  return cached("br:" + kind, 120_000, async () => {
    const count = async (left, op, right) => {
      const b = scope(kind);
      b.filter.push({ left, operation: op, right });
      b.columns = ["name"]; b.range = [0, 1];
      return (await tvScan("america", b)).total;
    };
    const [up, down, a200, b200] = await Promise.all([
      count("change", "greater", 0), count("change", "less", 0), count("close", "greater", "SMA200"), count("close", "less", "SMA200"),
    ]);
    return { up, down, a200, b200 };
  });
}

export const DETAIL_COLS = ["name", "description", "close", "change", "market_cap_basic", "sector", "industry",
  "price_earnings_ttm", "earnings_per_share_basic_ttm", "dividend_yield_recent", "price_52_week_high",
  "price_52_week_low", "total_revenue", "net_margin", "gross_margin", "return_on_equity", "debt_to_equity",
  "beta_1_year", "Perf.W", "Perf.1M", "Perf.Y", "Perf.5Y", "average_volume_10d_calc", "volume", "price_book_fq", "currency", "logoid"];

export async function tvByNames(market, names, cols = DETAIL_COLS) {
  const { rows } = await tvScan(market, {
    filter: [{ left: "name", operation: "in_range", right: names }], columns: cols, range: [0, 300],
  });
  const out = {};
  for (const r of rows) if (!out[r.name] || (r.market_cap_basic || 0) > (out[r.name].market_cap_basic || 0)) out[r.name] = r;
  return out;
}

export async function tvSearch(market, q, limit = 6) {
  return (await tvScan(market, {
    filter: [{ left: "name,description", operation: "match", right: q }, { left: "type", operation: "in_range", right: ["stock", "dr", "fund"] }],
    columns: ["name", "description", "close", "exchange", "market_cap_basic", "logoid"],
    sort: { sortBy: "market_cap_basic", sortOrder: "desc" }, range: [0, limit],
  })).rows;
}

// ---------------- Kripto
export const coins = () => cached("coins", 120_000, async () => {
  const pages = await Promise.all([1, 2].map((p) => getJSON(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${p}&price_change_percentage=24h,7d&sparkline=true`)));
  return pages.flat();
});
export const coinChart = (id, days, symbol) => cached(`cc:${id}:${days}`, 5 * 60_000, async () => {
  if (days === 0) {
    try {
      const a = await getJSON(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=1w&limit=1000`);
      if (a.length > 2) return a.map((k) => ({ t: k[0], c: parseFloat(k[4]) }));
    } catch (e) { /* Binance yoksa 1 yıl */ }
    days = 365;
  }
  const j = await getJSON(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
  return j.prices.map((p) => ({ t: p[0], c: p[1] }));
});
export const coinInfo = (id) => cached("ci:" + id, 3600_000, () => getJSON(
  `https://api.coingecko.com/api/v3/coins/${id}?localization=true&tickers=false&market_data=false&community_data=false&developer_data=false`));
export const cryptoGlobal = () => cached("cg", 120_000, () => getJSON("https://api.coingecko.com/api/v3/global"));
export const cryptoFng = () => cached("cfng", 600_000, () => getJSON("https://api.alternative.me/fng/?limit=31"));

// ---------------- Çeviri ve Vikipedi
const trCache = JSON.parse(localStorage.getItem("trc") || "{}");
export async function translate(text) {
  if (!text || /[çğıöşüÇĞİÖŞÜ]/.test(text)) return text;
  if (trCache[text]) return trCache[text];
  try {
    const j = await getJSON("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t&q=" + encodeURIComponent(text.slice(0, 1800)));
    const r = j[0].map((s) => s[0]).join("");
    trCache[text] = r;
    try { localStorage.setItem("trc", JSON.stringify(trCache)); } catch (e) { /* dolu */ }
    return r;
  } catch (e) { return text; }
}

export async function wikiAbout(name) {
  return cached("wiki:" + name, 86400_000, async () => {
    const s = await getJSON(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + " company")}&srlimit=1&format=json&origin=*`);
    const hit = s.query.search[0];
    if (!hit) return null;
    const ll = await getJSON(`https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=tr&redirects=1&format=json&origin=*&titles=${encodeURIComponent(hit.title)}`);
    let tr = null;
    for (const p of Object.values(ll.query.pages)) if (p.langlinks && p.langlinks[0]) tr = p.langlinks[0]["*"];
    if (tr) {
      const t = await getJSON(`https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tr.replace(/ /g, "_"))}`);
      if (t.extract && t.extract.length > 80) return { text: t.extract, url: `https://tr.wikipedia.org/wiki/${encodeURIComponent(tr.replace(/ /g, "_"))}` };
    }
    const e = await getJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`);
    return { text: await translate(e.extract || ""), url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}` };
  });
}

// ---------------- Yerel depolama (izleme listesi, portföy, tema)
export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yoksay */ } },
};

/** Bir listeyi istenen sütuna göre sırala (yükselenler, düşenler, hacim…) */
export function scanSorted(kind, sortBy, order = "desc", limit = 25, extra = [], cols = LIST_COLS) {
  const b = scope(kind);
  b.filter.push(...extra);
  b.columns = cols;
  b.sort = { sortBy, sortOrder: order };
  b.range = [0, limit];
  return cached(`s:${kind}:${sortBy}:${order}:${limit}:${JSON.stringify(extra)}:${cols.length}`, 60_000, () => tvScan(kind.startsWith("BIST") ? "turkey" : "america", b));
}
