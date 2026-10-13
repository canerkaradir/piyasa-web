"""Tarayıcıdan doğrudan çekilemeyen verileri toplar ve data/ klasörüne JSON olarak yazar.
GitHub Actions tarafından her 30 dakikada bir çalıştırılır."""
import json, os, re, sys, time, html, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
RULES = json.load(open(os.path.join(ROOT, "scripts", "rules.json"), encoding="utf-8"))


def get(url, headers=None, data=None, timeout=30, tries=3):
    h = {"User-Agent": UA, "Accept": "*/*"}
    h.update(headers or {})
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=h)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode("utf-8", "replace").lstrip("\ufeff")
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(2 + 3 * i)


def get_v4(url, timeout=40):
    """Yalnızca IPv4 ile indir (bazı siteler GitHub sunucularından IPv6'da erişilemiyor)."""
    import subprocess
    out = subprocess.run(["curl", "-4", "-sS", "-L", "--retry", "2", "-m", str(timeout), "-A", UA, url],
                         capture_output=True, check=True)
    return out.stdout.decode("utf-8", "replace")


def save(name, obj):
    path = os.path.join(DATA, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def step(name, fn):
    try:
        fn()
        print("OK", name)
    except Exception as e:
        print("HATA", name, repr(e), file=sys.stderr)


# ------------------------------------------------------------------ çeviri
_tr_cache_path = os.path.join(DATA, "_tr_cache.json")
try:
    TR = json.load(open(_tr_cache_path, encoding="utf-8"))
except Exception:
    TR = {}


def looks_tr(s):
    return any(c in s for c in "çğıöşüÇĞİÖŞÜ")


def _call_tr(text):
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t&q=" + urllib.parse.quote(text)
    arr = json.loads(get(url))[0]
    return "".join(seg[0] for seg in arr if seg and seg[0])


def translate_many(texts):
    out, todo = {}, []
    for t in dict.fromkeys(texts):
        if looks_tr(t):
            out[t] = t
        elif t in TR:
            out[t] = TR[t]
        else:
            todo.append(t)
    i = 0
    while i < len(todo):
        chunk, ln = [], 0
        while i < len(todo) and ln + len(todo[i]) < 1400:
            chunk.append(todo[i]); ln += len(todo[i]) + 1; i += 1
        if not chunk:
            chunk.append(todo[i]); i += 1
        try:
            res = _call_tr("\n".join(chunk)).split("\n")
            if len(res) != len(chunk):
                res = [_call_tr(c) for c in chunk]
            for k, v in zip(chunk, res):
                out[k] = v.strip(); TR[k] = v.strip()
        except Exception:
            for k in chunk:
                out[k] = k
        time.sleep(0.3)
    return out


# ------------------------------------------------------------------ haber kuralları
def norm(s):
    return s.lower().replace("i̇", "i").replace("’", "'")


def has(t, k):
    idx = t.find(k)
    while idx >= 0:
        before = t[idx - 1] if idx > 0 else " "
        end = idx + len(k)
        after = t[end] if end < len(t) else " "
        ok_end = len(k) > 3 or not after.isalpha()
        if not before.isalnum() and ok_end:
            return True
        idx = t.find(k, idx + 1)
    return False


def judge(title):
    t = norm(title)
    hits = [r for r in RULES["rules"] if any(has(t, k) for k in r["any"]) and (not r["need"] or any(has(t, k) for k in r["need"]))]
    if not hits:
        return 0, [], None
    best = max(hits, key=lambda r: r["score"])
    score = best["score"] + (1 if any(has(t, k) for k in RULES["strong"]) else 0)
    tags = list(dict.fromkeys(r["tag"] for r in hits))[:3]
    return min(score, 3), tags, best["note"]


def excluded(title):
    t = norm(title)
    return any(has(t, k) for k in RULES["exclude"])


GN_EN = "https://news.google.com/rss/search?q=%28Fed+OR+%22Wall+Street%22+OR+Nasdaq+OR+%22S%26P+500%22+OR+%22Dow+Jones%22+OR+%22gold+price%22+OR+%22silver+price%22%29+when:1d&hl=en-US&gl=US&ceid=US:en"
GN_TR = "https://news.google.com/rss/search?q=%28%22Wall+Street%22+OR+Fed+OR+Nasdaq+OR+%22ons+alt%C4%B1n%22+OR+g%C3%BCm%C3%BC%C5%9F+OR+%22ABD+borsalar%C4%B1%22%29+when:1d&hl=tr&gl=TR&ceid=TR:tr"
GN_AI = "https://news.google.com/rss/search?q=%28AI+OR+%22artificial+intelligence%22+OR+chips+OR+semiconductor%29+%28ban+OR+regulation+OR+%22executive+order%22+OR+%22export+controls%22+OR+subsidies+OR+White+House+OR+Congress%29+when:1d&hl=en-US&gl=US&ceid=US:en"
GN_MEGA = "https://news.google.com/rss/search?q=%28Nvidia+OR+Apple+OR+Microsoft+OR+Alphabet+OR+Amazon+OR+Meta+OR+Tesla+OR+Broadcom%29+stock+when:1d&hl=en-US&gl=US&ceid=US:en"
FEEDS = [
    ("https://www.cnbc.com/id/100003114/device/rss/rss.html", "CNBC", False),
    ("https://www.cnbc.com/id/20910258/device/rss/rss.html", "CNBC", False),
    ("https://www.cnbc.com/id/10000664/device/rss/rss.html", "CNBC", False),
    ("https://feeds.content.dowjones.io/public/rss/mw_topstories", "MarketWatch", False),
    ("https://feeds.content.dowjones.io/public/rss/mw_marketpulse", "MarketWatch", False),
    ("https://www.federalreserve.gov/feeds/press_all.xml", "Fed", False),
    (GN_EN, "Google News", True), (GN_TR, "Google Haberler", True), (GN_AI, "Google News", True), (GN_MEGA, "Google News", True),
]


def news():
    items = {}
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
    for url, src, gn in FEEDS:
        try:
            root = ET.fromstring(get(url).encode("utf-8"))
        except Exception as e:
            print("feed", url[:60], e, file=sys.stderr)
            continue
        for it in root.iter("item"):
            title = (it.findtext("title") or "").strip()
            link = (it.findtext("link") or "").strip()
            source = src
            if gn and " - " in title:
                title, source = title.rsplit(" - ", 1)
            if not title or excluded(title):
                continue
            if src == "Fed" and not any(k in norm(title) for k in ("fomc", "monetary policy", "discount rate")):
                continue
            try:
                dt = parsedate_to_datetime(it.findtext("pubDate") or "")
            except Exception:
                dt = None
            if dt and dt < cutoff:
                continue
            score, tags, note = judge(title)
            if src == "Fed":
                score = 3
            if score < 1:
                continue
            key = re.sub(r"[^0-9a-zçğıöşü]", "", norm(title))[:70]
            prev = items.get(key)
            if prev and prev["score"] >= score:
                continue
            items[key] = {"id": key, "title": title, "link": link, "source": source,
                          "time": int(dt.timestamp() * 1000) if dt else 0, "score": score, "tags": tags, "note": note}
    lst = sorted(items.values(), key=lambda x: -x["time"])[:250]
    trs = translate_many([x["title"] for x in lst])
    for x in lst:
        x["tr"] = trs.get(x["title"], "")
    save("news.json", lst)


def fng():
    root = json.loads(get("https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
                          {"Referer": "https://edition.cnn.com/", "Origin": "https://edition.cnn.com", "Accept": "application/json"}))
    fg = root["fear_and_greed"]
    parts = {}
    for k in ("market_momentum_sp500", "stock_price_strength", "stock_price_breadth", "put_call_options",
              "market_volatility_vix", "safe_haven_demand", "junk_bond_demand"):
        if k in root and isinstance(root[k], dict):
            parts[k] = round(root[k].get("score", 0))
    hist = [[int(p["x"]), round(p["y"], 1)] for p in root.get("fear_and_greed_historical", {}).get("data", [])][-260:]
    save("fng.json", {"score": round(fg["score"]), "week": round(fg.get("previous_1_week") or 0), "month": round(fg.get("previous_1_month") or 0),
                      "year": round(fg.get("previous_1_year") or 0), "parts": parts, "hist": hist, "at": fg.get("timestamp")})


def econ():
    now = datetime.now(timezone.utc)
    frm = (now - timedelta(days=3)).strftime("%Y-%m-%dT00:00:00.000Z")
    to = (now + timedelta(days=21)).strftime("%Y-%m-%dT00:00:00.000Z")
    res = json.loads(get(f"https://economic-calendar.tradingview.com/events?from={frm}&to={to}&countries=US",
                         {"Origin": "https://www.tradingview.com", "Referer": "https://www.tradingview.com/"}))["result"]
    res = [e for e in res if (e.get("importance") or -1) >= 0]
    trs = translate_many([e["title"] for e in res])
    out = [{"id": e["id"], "title": e["title"], "tr": trs.get(e["title"], e["title"]), "period": e.get("period") or "",
            "date": e["date"], "imp": e.get("importance"), "actual": e.get("actual"), "forecast": e.get("forecast"),
            "previous": e.get("previous"), "unit": e.get("unit") or ""} for e in res]
    save("econ.json", sorted(out, key=lambda x: x["date"]))


THEME_TICKERS = ["IONQ", "RGTI", "QBTS", "QUBT", "ARQQ", "LAES", "OKLO", "SMR", "NNE", "LEU", "LTBR", "BWXT", "RKLB", "ASTS", "LUNR",
                 "RDW", "PL", "BKSY", "SOUN", "BBAI", "AI", "TEM", "RXRX", "SYM", "SERV", "RR", "PDYN", "JOBY", "ACHR", "EH", "RCAT",
                 "UMAC", "CRSP", "NTLA", "BEAM", "EDIT", "DNA", "QS", "SLDP", "EOSE", "FLNC", "ENVX", "NVTS", "LWLG", "POET", "AEHR"]


def _universe():
    names = set(THEME_TICKERS)
    for grp, n in (("SP:SPX", 520), ("TVC:RUT", 250)):
        r = tv_scan("america", {"symbols": {"query": {"types": []}, "tickers": [], "groups": [{"type": "index", "values": [grp]}]},
                                "columns": ["name"], "sort": {"sortBy": "market_cap_basic", "sortOrder": "desc"}, "range": [0, n]})
        names.update(x["d"][0] for x in r.get("data", []))
    r = tv_scan("america", {"filter": [{"left": "exchange", "operation": "equal", "right": "NASDAQ"}, {"left": "is_primary", "operation": "equal", "right": True},
                                       {"left": "type", "operation": "in_range", "right": ["stock", "dr"]}],
                            "columns": ["name"], "sort": {"sortBy": "market_cap_basic", "sortOrder": "desc"}, "range": [0, 250]})
    names.update(x["d"][0] for x in r.get("data", []))
    return sorted(names)


def insiders():
    """Büyük ABD şirketlerinde yöneticilerin açık piyasa alımları (Nasdaq, SEC Form 4). 6 saatte bir taranır."""
    from concurrent.futures import ThreadPoolExecutor
    path = os.path.join(DATA, "insiders.json")
    marker = os.path.join(DATA, "_insiders_at.txt")
    try:
        if time.time() - float(open(marker).read()) < 6 * 3600 and os.path.exists(path):
            return
    except Exception:
        pass
    try:
        old = json.load(open(path, encoding="utf-8"))
    except Exception:
        old = []
    names = _universe()
    hdr = {"Accept": "application/json", "Origin": "https://www.nasdaq.com", "Referer": "https://www.nasdaq.com/"}
    companies = {}

    def one(sym):
        try:
            d = json.loads(get(f"https://api.nasdaq.com/api/company/{sym.replace('.', '%25sl%25')}/insider-trades?limit=20&type=buys&sortColumn=lastDate&sortOrder=DESC",
                               hdr, timeout=20, tries=2))["data"]
            rows = ((d or {}).get("transactionTable") or {}).get("table", {}).get("rows") or []
            return sym, rows
        except Exception:
            return sym, []

    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(one, names))
    cutoff = datetime.now() - timedelta(days=30)
    found = []
    for sym, rows in res:
        for o in rows:
            if "buy" not in (o.get("transactionType") or "").lower():
                continue
            try:
                dt = datetime.strptime(o.get("lastDate", ""), "%m/%d/%Y")
            except ValueError:
                continue
            if dt < cutoff:
                continue
            q = float((o.get("sharesTraded") or "0").replace(",", "") or 0)
            pr = float((o.get("lastPrice") or "0").replace("$", "").replace(",", "") or 0)
            held = float((o.get("sharesHeld") or "0").replace(",", "") or 0)
            if q * pr <= 0:
                continue
            before = held - q
            found.append({"ticker": sym, "company": companies.get(sym, sym), "insider": (o.get("insider") or "").title(),
                          "title": o.get("relation") or "", "date": dt.strftime("%Y-%m-%d"), "price": f"${pr:,.2f}", "qty": f"+{q:,.0f}",
                          "own": (f"+{q / before * 100:.0f}%" if before > 0 else "Yeni") if held > 0 else "—", "value": round(q * pr)})
    # şirket adları
    if found:
        try:
            r = tv_scan("america", {"filter": [{"left": "name", "operation": "in_range", "right": sorted({f["ticker"] for f in found})}],
                                    "columns": ["name", "description"], "range": [0, 500]})
            nm = {x["d"][0]: x["d"][1] for x in r.get("data", [])}
            for f in found:
                f["company"] = re.sub(r",?\s+(Inc\.?|Corporation|Corp\.?|Holdings?|Ltd\.?|plc|Class [A-C].*|Common Stock.*)$", "", nm.get(f["ticker"], f["ticker"]))
        except Exception:
            pass
    if not found and old:
        found = [x for x in old if x.get("date", "") >= cutoff.strftime("%Y-%m-%d")]
    found.sort(key=lambda x: (x["date"], x["value"]), reverse=True)
    save("insiders.json", found)
    open(marker, "w").write(str(time.time()))
    print("içeriden: taranan", len(names), "alım", len(found))


def surprises():
    """ABD şirketlerinin son 4 çeyrek kâr beklentisi / gerçekleşen tablosu (Nasdaq). Günde bir kez."""
    from concurrent.futures import ThreadPoolExecutor
    path = os.path.join(DATA, "surprises.json")
    marker = os.path.join(DATA, "_surprises_at.txt")
    try:
        if time.time() - float(open(marker).read()) < 20 * 3600 and os.path.exists(path):
            return
    except Exception:
        pass
    names = _universe()
    hdr = {"Accept": "application/json", "Origin": "https://www.nasdaq.com", "Referer": "https://www.nasdaq.com/"}

    def one(sym):
        try:
            d = json.loads(get(f"https://api.nasdaq.com/api/company/{sym}/earnings-surprise", hdr, timeout=20, tries=2))["data"]
            rows = ((d or {}).get("earningsSurpriseTable") or {}).get("rows") or []
            out = []
            for o in rows[:4]:
                def f(x):
                    try:
                        return float(str(x).replace(",", ""))
                    except (TypeError, ValueError):
                        return None
                out.append([o.get("fiscalQtrEnd"), o.get("dateReported"), f(o.get("eps")), f(o.get("consensusForecast")), f(o.get("percentageSurprise"))])
            return sym, out
        except Exception:
            return sym, None

    try:
        old = json.load(open(path, encoding="utf-8"))
    except Exception:
        old = {}
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(one, names))
    ok = 0
    for sym, rows in res:
        if rows:
            old[sym] = rows; ok += 1
    save("surprises.json", old)
    open(marker, "w").write(str(time.time()))
    print("beklenti tabloları:", ok, "/", len(names))


def tv_scan(market, body):
    req = urllib.request.Request(f"https://scanner.tradingview.com/{market}/scan", data=json.dumps(body).encode(),
                                 headers={"User-Agent": UA, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def bist():
    """BIST 100 hisselerinin son 10 yıllık günlük kapanışları (her hisse günde bir kez yenilenir)."""
    marker = os.path.join(DATA, "bist", "_updated.json")
    try:
        done = json.load(open(marker))
    except Exception:
        done = {}
    res = tv_scan("turkey", {"symbols": {"query": {"types": []}, "tickers": [], "groups": [{"type": "index", "values": ["BIST:XU100"]}]},
                             "columns": ["name"], "range": [0, 120]})
    codes = [r["d"][0] for r in res.get("data", [])]
    to = datetime.now()
    frm = to - timedelta(days=3653)
    for c in codes:
        if time.time() - done.get(c, 0) < 20 * 3600 and os.path.exists(os.path.join(DATA, "bist", c + ".json")):
            continue
        try:
            url = (f"https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil?hisse={c}"
                   f"&startdate={frm:%d-%m-%Y}&enddate={to:%d-%m-%Y}")
            vals = json.loads(get(url, timeout=90)).get("value") or []
            pts = []
            for v in vals:
                d = datetime.strptime(v["HGDG_TARIH"], "%d-%m-%Y")
                pts.append([int(d.replace(tzinfo=timezone.utc).timestamp() * 1000), v["HGDG_KAPANIS"]])
            if pts:
                save(f"bist/{c}.json", pts)
                done[c] = time.time()
        except Exception as e:
            print("bist", c, e, file=sys.stderr)
        time.sleep(0.5)
    save("bist/_updated.json", done)


if __name__ == "__main__":
    os.makedirs(DATA, exist_ok=True)
    step("haberler", news)
    step("korku-açgözlülük", fng)
    step("ekonomik takvim", econ)
    step("içeriden alımlar", insiders)
    step("BIST geçmişi", bist)
    step("beklenti tabloları", surprises)
    # çeviri önbelleği büyümesin
    if len(TR) > 4000:
        TR = dict(list(TR.items())[-2500:])
    json.dump(TR, open(_tr_cache_path, "w", encoding="utf-8"), ensure_ascii=False)
    save("updated.json", {"at": int(time.time() * 1000)})
