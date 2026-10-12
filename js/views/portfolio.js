import { esc, price, pill, pct, f1, logo, tvLogo, usLogo, spark, cleanName } from "../ui.js";
import { store, tvByNames, coins, cnbcQuotes, num, tvSearch } from "../api.js";
import { disclaimer } from "../widgets.js";

const METAL = { "XAU=:g": ["Altın (gram)", 1 / 31.1035], "XAU=:oz": ["Altın (ons)", 1], "XAG=:g": ["Gümüş (gram)", 1 / 31.1035], "XAG=:oz": ["Gümüş (ons)", 1] };
const COLORS = ["#1f6feb", "#e8a317", "#2e7d32", "#c62828", "#6a1b9a", "#00838f", "#ef6c00", "#4e342e", "#283593", "#9e9d24"];
const load = () => store.get("portfolio", []);
const save = (l) => store.set("portfolio", l);

async function prices(list) {
  const out = {};
  const us = list.filter((h) => h.k === "us").map((h) => h.s), bi = list.filter((h) => h.k === "bist").map((h) => h.s);
  const [mu, mb, cs, q] = await Promise.all([
    us.length ? tvByNames("america", us).catch(() => ({})) : {}, bi.length ? tvByNames("turkey", bi).catch(() => ({})) : {},
    list.some((h) => h.k === "coin") ? coins().catch(() => []) : [], cnbcQuotes(["XAU=", "XAG=", "TRY="]).catch(() => ({})),
  ]);
  const tl = num(q["TRY="] && q["TRY="].last);
  for (const h of list) {
    const key = h.k + ":" + h.s;
    if (h.k === "us" && mu[h.s]) out[key] = { p: mu[h.s].close, c: mu[h.s].change, img: tvLogo(mu[h.s].logoid) };
    if (h.k === "bist" && mb[h.s]) out[key] = { p: mb[h.s].close, c: mb[h.s].change, img: tvLogo(mb[h.s].logoid), tl };
    if (h.k === "coin") { const c = cs.find((x) => x.id === h.s); if (c) out[key] = { p: c.current_price, c: c.price_change_percentage_24h, img: c.image }; }
    if (h.k === "metal") { const [s] = h.s.split(":"); const o = q[s]; if (o) out[key] = { p: num(o.last) * METAL[h.s][1], c: num(o.change_pct) }; }
  }
  return { out, tl };
}

export async function render(el) {
  el.innerHTML = `<h1>Portföyüm</h1><div class="small muted">Hisse, kripto, altın ve gümüşlerinizi ekleyin; güncel değerini ve kâr/zararınızı görün. Bilgiler yalnızca bu bilgisayarın tarayıcısında saklanır.</div>
    <div id="sum" style="margin-top:10px"></div><div id="tbl"></div>
    <h2>Varlık ekle</h2><div class="card" id="add"></div>
    <h2>Yedek</h2><div class="card small">Portföyünüz bu tarayıcıda saklanır. Başka bir bilgisayara taşımak için yedek dosyası indirin, orada "Yedekten yükle" ile açın.
      <div class="row wrap" style="margin-top:8px"><button class="btn ghost" id="exp">⬇ Yedek indir</button><label class="btn ghost">⬆ Yedekten yükle<input type="file" id="imp" accept=".json" hidden></label></div></div>
    ${disclaimer("TradingView, CoinGecko, CNBC")}`;
  addForm(el.querySelector("#add"), () => draw());
  el.querySelector("#exp").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ portfolio: load(), favs: store.get("favs", []), hist: store.get("pfHist", {}) }, null, 1)], { type: "application/json" }));
    a.download = "piyasa-pusulasi-yedek.json"; a.click();
  };
  el.querySelector("#imp").onchange = async (e) => {
    try { const j = JSON.parse(await e.target.files[0].text()); if (j.portfolio) save(j.portfolio); if (j.favs) store.set("favs", j.favs); if (j.hist) store.set("pfHist", j.hist); draw(); alert("Yedek yüklendi."); }
    catch (er) { alert("Dosya okunamadı."); }
  };
  async function draw() {
    const list = load();
    const sum = el.querySelector("#sum"), tbl = el.querySelector("#tbl");
    if (!list.length) { sum.innerHTML = `<div class="card small muted">Portföyünüz boş. Aşağıdan ilk varlığınızı ekleyin.</div>`; tbl.innerHTML = ""; return; }
    sum.innerHTML = `<div class="spinner"></div>`;
    const { out, tl } = await prices(list);
    const usd = (h, v) => (h.k === "bist" ? (tl ? v / tl : null) : v);
    let total = 0, cost = 0, day = 0;
    const rows = list.map((h, i) => {
      const p = out[h.k + ":" + h.s];
      const val = p ? usd(h, p.p * h.q) : null, cst = h.cost ? usd(h, h.cost * h.q) : null;
      if (val != null) { total += val; day += val - val / (1 + (p.c || 0) / 100); }
      if (cst != null && val != null) cost += cst;
      return { h, i, p, val, cst };
    });
    const plAbs = rows.filter((r) => r.cst != null && r.val != null).reduce((a, r) => a + (r.val - r.cst), 0);
    // günlük kayıt
    const hist = store.get("pfHist", {}); hist[new Date().toISOString().slice(0, 10)] = Math.round(total); store.set("pfHist", hist);
    const hv = Object.entries(hist).sort().map((x) => x[1]);
    // pasta
    const parts = rows.filter((r) => r.val).sort((a, b) => b.val - a.val);
    let acc = 0;
    const donut = parts.map((r, k) => {
      const a0 = (acc / total) * 2 * Math.PI; acc += r.val; const a1 = (acc / total) * 2 * Math.PI;
      const large = a1 - a0 > Math.PI ? 1 : 0, R = 60, cx = 70, cy = 70;
      if (parts.length === 1) return `<circle cx="70" cy="70" r="60" fill="${COLORS[0]}"/>`;
      return `<path d="M${cx},${cy} L${cx + R * Math.sin(a0)},${cy - R * Math.cos(a0)} A${R},${R} 0 ${large} 1 ${cx + R * Math.sin(a1)},${cy - R * Math.cos(a1)} Z" fill="${COLORS[k % COLORS.length]}"/>`;
    }).join("");
    sum.innerHTML = `<div class="grid g2"><div class="card"><div class="small muted">Toplam değer</div><div style="font-size:30px;font-weight:800">${price(total, 0)} $</div>
        ${tl ? `<div class="small muted">≈ ${price(total * tl, 0)} ₺</div>` : ""}
        <div class="small">Bugün: <b class="${day >= 0 ? "up" : "down"}">${day >= 0 ? "+" : ""}${price(day, 0)} $</b></div>
        ${cost ? `<div class="small">Toplam kâr/zarar: <b class="${plAbs >= 0 ? "up" : "down"}">${plAbs >= 0 ? "+" : ""}${price(plAbs, 0)} $ (${pct((plAbs / cost) * 100)})</b></div>` : ""}
        ${hv.length > 2 ? `<div class="tiny muted" style="margin-top:6px">Değer geçmişi (siteyi açtığınız günler)</div>${spark(hv, 260, 50)}` : ""}</div>
      <div class="card row"><svg width="140" height="140" viewBox="0 0 140 140">${donut}<circle cx="70" cy="70" r="34" fill="var(--card)"/></svg>
        <div class="small">${parts.map((r, k) => `<div><span style="color:${COLORS[k % COLORS.length]}">●</span> ${esc(r.h.n)} <b>%${f1((r.val / total) * 100)}</b></div>`).join("")}</div></div></div>`;
    tbl.innerHTML = `<table class="t" style="margin-top:12px"><thead><tr><th>Varlık</th><th class="r">Miktar</th><th class="r hide-m">Maliyet</th><th class="r">Fiyat</th><th class="r">Değer ($)</th><th class="r">Kâr/zarar</th><th></th></tr></thead><tbody>
      ${rows.map(({ h, i, p, val, cst }) => {
        const cur = h.k === "bist" ? "₺" : "$";
        const pr = val != null && cst != null ? val - cst : null;
        const href = h.k === "us" ? "hisse/" + h.s : h.k === "bist" ? "bist/" + h.s : h.k === "coin" ? "kripto/" + h.s : "emtia/" + (h.s.startsWith("XAU") ? "altin" : "gumus");
        return `<tr><td><a href="#/${esc(href)}" class="row" style="color:inherit">${logo(p && p.img ? p.img : h.k === "us" ? usLogo(h.s) : "", h.n, 28)}<span><b>${esc(h.n)}</b><div class="tiny muted">${p ? pill(p.c) : ""}</div></span></a></td>
          <td class="r">${h.q.toLocaleString("tr-TR", { maximumFractionDigits: 8 })}</td><td class="r hide-m">${h.cost ? price(h.cost) + " " + cur : "—"}</td>
          <td class="r">${p ? price(p.p) + " " + cur : "…"}</td><td class="r"><b>${val != null ? price(val, 0) : "—"}</b></td>
          <td class="r">${pr != null ? `<b class="${pr >= 0 ? "up" : "down"}">${pr >= 0 ? "+" : ""}${price(pr, 0)}</b><div class="tiny">${pct((pr / cst) * 100)}</div>` : "—"}</td>
          <td><button class="btn ghost" data-del="${i}" title="Sil" style="padding:4px 8px">✕</button></td></tr>`;
      }).join("")}</tbody></table>
      ${list.some((h) => h.k === "bist") ? `<div class="tiny muted">BIST hisselerinin değeri güncel dolar kuruyla dolara çevrilir; kâr/zarar da güncel kurla hesaplanır.</div>` : ""}`;
    tbl.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => { if (!confirm("Bu varlığı silmek istiyor musunuz?")) return; const l = load(); l.splice(+b.dataset.del, 1); save(l); draw(); }));
  }
  draw();
}

function addForm(box, done) {
  box.innerHTML = `<div class="chips" id="kt"><button class="chip on" data-k="us">ABD hissesi</button><button class="chip" data-k="bist">BIST hissesi</button><button class="chip" data-k="coin">Kripto</button><button class="chip" data-k="metal">Altın / gümüş</button></div>
    <div class="grid g4" style="align-items:end">
      <div style="position:relative"><div class="small">Varlık</div><input class="input" id="as" placeholder="Ara (ör. Apple, BTC)"><select class="input" id="ms" hidden>${Object.entries(METAL).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join("")}</select><div class="search-results" id="ar" hidden></div></div>
      <div><div class="small">Miktar (adet / gram / ons)</div><input class="input" id="aq" type="number" step="any" min="0"></div>
      <div><div class="small">Alış fiyatı (birim başına, isteğe bağlı)</div><input class="input" id="ac" type="number" step="any" min="0"></div>
      <div><button class="btn" id="ab" style="width:100%">Ekle</button></div></div>
    <div class="tiny muted" id="sel" style="margin-top:6px">Seçilen: —</div>`;
  let kind = "us", pick = null;
  const as = box.querySelector("#as"), ar = box.querySelector("#ar"), ms = box.querySelector("#ms"), sel = box.querySelector("#sel");
  box.querySelector("#kt").onclick = (e) => {
    const k = e.target.dataset.k; if (!k) return; kind = k; pick = null; sel.textContent = "Seçilen: —";
    box.querySelectorAll("#kt .chip").forEach((c) => c.classList.toggle("on", c.dataset.k === k));
    as.hidden = k === "metal"; ms.hidden = k !== "metal";
    box.querySelector("#ac").placeholder = k === "bist" ? "₺" : "$";
  };
  let t = null;
  as.oninput = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const s = as.value.trim(); if (!s) { ar.hidden = true; return; }
      let l = [];
      if (kind === "us") l = (await tvSearch("america", s, 6).catch(() => [])).map((r) => [r.name, r.description]);
      if (kind === "bist") l = (await tvSearch("turkey", s, 6).catch(() => [])).map((r) => [r.name, r.description]);
      if (kind === "coin") { const low = s.toLowerCase(); l = (await coins().catch(() => [])).filter((c) => c.symbol.toLowerCase() === low || c.name.toLowerCase().includes(low)).slice(0, 6).map((c) => [c.id, c.name + " (" + c.symbol.toUpperCase() + ")"]); }
      ar.hidden = false;
      ar.innerHTML = l.map(([id, n]) => `<div class="sr" data-id="${esc(id)}" data-n="${esc(n)}"><b>${esc(kind === "coin" ? n : id)}</b> <span class="small muted">${kind === "coin" ? "" : esc(n)}</span></div>`).join("") || `<div class="sr muted">Sonuç yok</div>`;
      ar.querySelectorAll("[data-id]").forEach((d) => (d.onclick = () => {
        pick = { s: d.dataset.id, n: kind === "coin" ? d.dataset.n.replace(/\s*\(.*\)$/, "") : cleanName(d.dataset.n) };
        ar.hidden = true; as.value = pick.n; sel.textContent = "Seçilen: " + pick.n + " (" + pick.s + ")";
      }));
    }, 300);
  };
  box.querySelector("#ab").onclick = () => {
    const q = parseFloat(box.querySelector("#aq").value), c = parseFloat(box.querySelector("#ac").value);
    if (kind === "metal") pick = { s: ms.value, n: METAL[ms.value][0] };
    if (!pick) { alert("Önce listeden bir varlık seçin."); return; }
    if (!(q > 0)) { alert("Miktarı girin."); return; }
    const l = load(); l.push({ k: kind, s: pick.s, n: pick.n, q, cost: c > 0 ? c : null }); save(l);
    box.querySelector("#aq").value = ""; box.querySelector("#ac").value = ""; as.value = ""; pick = null; sel.textContent = "Seçilen: —";
    done();
  };
}
