// Şirket İnceleme: arama + karne + dersler + test
import { esc, price, pill, big, f1, f2, logo, tvLogo, usLogo, cleanName, sectorTr, metric } from "../ui.js";
import { tvSearch, store } from "../api.js";
import { go, onLeave } from "../core.js";
import { disclaimer } from "../widgets.js";
import { LESSONS, QUIZ } from "../lessons.js";
import { loadReport, pillars, yoy, pct1 } from "../report.js";

const POPULAR = [["us", "AAPL", "Apple"], ["us", "NVDA", "Nvidia"], ["us", "MSFT", "Microsoft"], ["us", "TSLA", "Tesla"], ["us", "KO", "Coca-Cola"],
  ["us", "IONQ", "IonQ"], ["bist", "THYAO", "Türk Hava Yolları"], ["bist", "ASELS", "Aselsan"], ["bist", "BIMAS", "BİM"], ["bist", "AKBNK", "Akbank"],
  ["bist", "TUPRS", "Tüpraş"], ["bist", "FROTO", "Ford Otosan"]];
const LCOL = { 2: "var(--up)", 1: "#b8860b", 0: "var(--down)", "-1": "#8a8f9a" };
const ltext = (l, pr) => ({ 2: pr ? "Ucuz" : "Güçlü", 1: pr ? "Makul" : "Orta", 0: pr ? "Pahalı" : "Zayıf" }[l] || "—");
const tryHref = (t) => (t && t.startsWith("bist:") ? "karne/bist/" + t.slice(5) : "karne/us/" + t);
const done = () => new Set(store.get("lessonsDone", []));

export async function render(el, params, key) {
  if (key === "karne") return reportPage(el, params[0], params[1]);
  if (key === "ders") return lessonPage(el, +params[0] || 0);
  if (key === "test") return quizPage(el);
  return home(el, params[0] === "ogren" ? 1 : 0);
}

// ------------------------------------------------------------------ ana sayfa
function home(el, tab) {
  el.innerHTML = `<h1>Şirket İnceleme</h1>
    <div class="chips"><a class="chip ${tab === 0 ? "on" : ""}" href="#/inceleme">🔍 Şirket incele</a><a class="chip ${tab === 1 ? "on" : ""}" href="#/inceleme/ogren">🎓 Öğren</a></div>
    <div id="body"></div>`;
  const body = el.querySelector("#body");
  if (tab === 1) return lessonList(body);
  const recent = store.get("reportRecent", []);
  body.innerHTML = `<div class="card navy"><div style="font-size:19px;font-weight:800">Bu şirket sağlam mı?</div>
      <div class="small muted" style="margin-top:4px">Bir ABD ya da Borsa İstanbul şirketi arayın. Karnesinde 7 alanda (büyüme, kârlılık, nakit, borç, hissedara davranış, fiyat, beklentiler) güçlü ve zayıf yanlarını, son bilançolarında neler açıkladığını ve her rakamın ne anlama geldiğini görün.</div></div>
    <div class="search" style="position:relative;max-width:560px;margin-top:12px"><input class="input" id="aq" placeholder="Şirket adı ya da kodu (ör. Apple, NVDA, THYAO, Aselsan)" style="font-size:16px;padding:12px"><div class="search-results" id="ar" hidden></div></div>
    ${recent.length ? `<h3>Son baktıklarınız</h3><div class="chips">${recent.map(([mk, s, n]) => `<a class="chip" href="#/karne/${mk}/${esc(s)}">${esc(n)} · ${esc(s)}</a>`).join("")}</div>` : ""}
    <h3>Örnek şirketler</h3>
    <div class="chips">${POPULAR.map(([mk, s, n]) => `<a class="chip" href="#/karne/${mk}/${s}">${mk === "bist" ? "🇹🇷 " : "🇺🇸 "}${esc(n)}</a>`).join("")}</div>
    <h2>Karnede neye bakıyoruz?</h2>
    <div class="grid g2">${[["📈 Büyüme", "Satışlar yıldan yıla artıyor mu? (BIST'te dolar bazında da)", 2], ["💎 Kârlılık", "Her 100 birim satıştan ne kadar kâr kalıyor?", 3],
      ["🌊 Nakit üretimi", "Kâr gerçekten kasaya giriyor mu?", 4], ["🛡️ Bilanço ve borç", "Borcunu ödeyebilir mi, zor günlere dayanır mı?", 5],
      ["🍕 Hissedara davranış", "Payınızı koruyor mu, seyreltiyor mu?", 6], ["🏷️ Fiyat", "Bu şirket için ödenen fiyat makul mü?", 7],
      ["🎯 Beklentiler", "Son bilançolarda sözünü tuttu mu?", 8], ["🇹🇷 Borsa İstanbul", "Enflasyon ve kur rakamları nasıl etkiler?", 11]]
      .map(([t, d, l]) => `<a class="card row" href="#/ders/${l}" style="color:inherit;text-decoration:none"><div class="grow"><b>${t}</b><div class="small muted">${d}</div></div><span class="small" style="color:var(--accent)">Ders ›</span></a>`).join("")}</div>
    <div class="footer-note">Karne rakamlardan kurallarla otomatik oluşur; yorum değil, inceleme rehberidir. Yatırım tavsiyesi değildir, kararı siz verirsiniz. Veriler: TradingView, Nasdaq, CNBC (dolar kuru).</div>`;
  const inp = body.querySelector("#aq"), res = body.querySelector("#ar");
  let t = null;
  inp.focus();
  inp.oninput = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const s = inp.value.trim(); if (s.length < 2) { res.hidden = true; return; }
      res.hidden = false; res.innerHTML = `<div class="spinner"></div>`;
      const [us, tr] = await Promise.all([tvSearch("america", s, 6).catch(() => []), tvSearch("turkey", s, 6).catch(() => [])]);
      const rows = [...us.map((r) => ["us", r]), ...tr.filter((r) => r.exchange === "BIST").map((r) => ["bist", r])];
      res.innerHTML = rows.map(([mk, r]) => {
        const n = cleanName(r.description);
        return `<div class="sr" data-h="karne/${mk}/${esc(r.name)}" data-n="${esc(n)}" data-mk="${mk}">${logo(tvLogo(r.logoid) || (mk === "us" ? usLogo(r.name) : ""), n, 30)}
          <div class="grow"><b>${esc(n)}</b><div class="tiny muted">${esc(r.name)} · ${mk === "bist" ? "Borsa İstanbul" : esc(r.exchange)} · ${big(r.market_cap_basic, mk === "bist" ? "₺" : "$")}</div></div>
          <span class="badge" style="background:${mk === "bist" ? "#c62828" : "#1f4e9c"}">${mk === "bist" ? "BIST" : "ABD"}</span></div>`;
      }).join("") || `<div class="sr muted">Sonuç yok</div>`;
      res.querySelectorAll("[data-h]").forEach((d) => (d.onclick = () => go(d.dataset.h)));
    }, 300);
  };
  inp.onkeydown = (e) => { if (e.key === "Enter") { const f = res.querySelector("[data-h]"); if (f) f.click(); } };
}

function lessonList(body) {
  const d = done();
  const n = LESSONS.filter((_, i) => d.has(i)).length;
  body.innerHTML = `<div class="card navy"><div style="font-size:19px;font-weight:800">Şirket nasıl incelenir?</div>
      <div class="small muted" style="margin-top:4px">Sıfırdan başlayan ${LESSONS.length} kısa ders. Her ders birkaç slayt; ok tuşlarıyla, düğmelerle ya da telefonda kaydırarak ilerleyin. Rakamların dilini, hangi değerin neyi anlattığını ve sağlam bir şirketin nasıl tanınacağını öğrenin.</div>
      <div style="height:6px;background:#ffffff33;border-radius:3px;margin-top:10px"><div style="height:6px;width:${(n / LESSONS.length) * 100}%;background:var(--gold);border-radius:3px"></div></div>
      <div class="tiny muted" style="margin-top:3px">${n} / ${LESSONS.length} ders tamamlandı</div></div>
    <div class="grid g2" style="margin-top:12px">${LESSONS.map((l, i) => `<a class="card row lesson-card" href="#/ders/${i}" style="color:inherit;text-decoration:none">
      <span class="lesson-ico">${l.emoji}</span><div class="grow"><b>${i + 1}. ${esc(l.title)}</b><div class="small muted">${esc(l.summary)}</div><div class="tiny muted">${l.slides.length} slayt</div></div>
      ${d.has(i) ? `<b class="up" style="font-size:20px">✓</b>` : `<span class="muted" style="font-size:22px">›</span>`}</a>`).join("")}</div>
    <a class="card row" href="#/test" style="margin-top:12px;color:inherit;text-decoration:none;background:var(--soft)"><span style="font-size:26px">🧠</span><div class="grow"><b>Kendini dene</b><div class="small">${QUIZ.length} soruluk kısa test. Her cevaptan sonra açıklaması gelir.</div></div><span style="font-size:22px">›</span></a>
    <div class="footer-note">Dersler öğrenme amaçlıdır, yatırım tavsiyesi değildir.</div>`;
}

// ------------------------------------------------------------------ dersler
function visual(v) {
  if (!v) return "";
  switch (v.t) {
    case "emoji": return `<div style="text-align:center;font-size:72px;line-height:1.2">${v.e}</div>`;
    case "waterfall": {
      const mx = Math.max(...v.rows.map((r) => Math.abs(r[1])));
      return v.rows.map(([l, x, tot]) => `<div class="row" style="margin:4px 0"><span class="small" style="width:170px;flex-shrink:0;${tot ? "font-weight:700" : ""}">${esc(l)}</span>
        <div class="grow"><div style="height:24px;width:${(Math.abs(x) / mx) * 100}%;background:${tot ? "var(--accent)" : "var(--down)"};opacity:${tot ? 1 : 0.75};border-radius:4px"></div></div>
        <b class="small" style="width:44px;text-align:right;${x < 0 ? "color:var(--down)" : ""}">${x < 0 ? "−" : ""}${Math.abs(x)}</b></div>`).join("");
    }
    case "bars": {
      const mx = Math.max(...v.values);
      return `<div style="display:flex;align-items:flex-end;gap:6px;height:150px">${v.values.map((x, i) => `<div style="flex:1;text-align:center"><div class="tiny muted">${x < 10 ? f2(x) : Math.round(x)}</div>
        <div style="height:${(x / mx) * 120}px;background:${i === v.values.length - 1 ? "var(--gold-d)" : "var(--accent)"};opacity:${i === v.values.length - 1 ? 1 : 0.75};border-radius:4px 4px 0 0"></div></div>`).join("")}</div>
        <div style="display:flex;gap:6px">${v.labels.map((l) => `<div class="tiny muted" style="flex:1;text-align:center">${esc(l)}</div>`).join("")}</div><div class="small muted" style="margin-top:6px">${esc(v.caption)}</div>`;
    }
    case "versus": return `<div class="grid g2">${[[v.goodTitle, v.good, "var(--up)", "✓"], [v.badTitle, v.bad, "var(--down)", "⚠"]].map(([t, l, c, ic]) =>
      `<div style="border:1.5px solid ${c};border-radius:10px;padding:10px"><b style="color:${c}">${ic} ${esc(t)}</b>${l.map((x) => `<div class="small" style="margin-top:4px">• ${esc(x)}</div>`).join("")}</div>`).join("")}</div>`;
    case "pizza": return `<div class="row" style="justify-content:center;gap:18px">${pizza(v.before)}<span style="font-size:28px">→</span>${pizza(v.after)}</div><div class="small muted" style="text-align:center;margin-top:6px">${esc(v.caption)}</div>`;
    case "scale": return `<div style="display:flex;gap:4px">${v.zones.map(([l, z]) => `<div style="flex:1"><div style="height:14px;border-radius:4px;background:${LCOL[z]}"></div><div class="tiny" style="text-align:center;margin-top:4px">${esc(l)}</div></div>`).join("")}</div><div class="small muted" style="margin-top:6px">${esc(v.caption)}</div>`;
    case "checklist": return v.items.map((x) => `<div style="padding:4px 0">${esc(x)}</div>`).join("");
  }
  return "";
}
function pizza(n) {
  const R = 46, c = 50; let s = "";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    s += `<path d="M${c},${c} L${c + R * Math.cos(a0)},${c + R * Math.sin(a0)} A${R},${R} 0 0 1 ${c + R * Math.cos(a1)},${c + R * Math.sin(a1)} Z" fill="${i === 0 ? "#e53935" : "#ffd54f"}" stroke="#fff" stroke-width="2"/>`;
  }
  return `<svg width="100" height="100" viewBox="0 0 100 100">${s}<circle cx="50" cy="50" r="${R}" fill="none" stroke="#b8860b" stroke-width="4"/></svg>`;
}

function lessonPage(el, idx) {
  const L = LESSONS[idx]; if (!L) return go("inceleme/ogren");
  const total = L.slides.length + 1;
  let p = 0;
  el.innerHTML = `<div class="lesson"><div class="row between"><a href="#/inceleme/ogren" class="small">‹ Dersler</a><span class="small muted">${L.emoji} Ders ${idx + 1} / ${LESSONS.length}</span></div>
    <div class="prog" id="prog"></div><div class="card slide" id="sl"></div>
    <div class="row between" style="margin-top:12px"><button class="btn ghost" id="pv">‹ Geri</button><span class="small muted" id="pn"></span><button class="btn" id="nx">İleri ›</button></div>
    <div class="tiny muted" style="text-align:center;margin-top:8px">İpucu: klavyede ← → tuşlarıyla ya da telefonda sağa-sola kaydırarak da ilerleyebilirsiniz.</div></div>`;
  const sl = el.querySelector("#sl"), prog = el.querySelector("#prog"), pv = el.querySelector("#pv"), nx = el.querySelector("#nx"), pn = el.querySelector("#pn");
  function draw() {
    prog.innerHTML = Array.from({ length: total }, (_, i) => `<span class="${i <= p ? "on" : ""}"></span>`).join("");
    pv.disabled = p === 0; nx.style.visibility = p < total - 1 ? "visible" : "hidden";
    pn.textContent = p < L.slides.length ? `${p + 1} / ${L.slides.length}` : "";
    if (p < L.slides.length) {
      const s = L.slides[p];
      sl.innerHTML = `<div class="small muted">${esc(L.title)}</div><h1 style="margin:6px 0 14px">${esc(s.title)}</h1>
        ${s.visual ? `<div class="vis">${visual(s.visual)}</div>` : ""}
        <div class="body">${esc(s.body).replace(/\n/g, "<br>")}</div>
        ${s.example ? `<div class="example"><b>Örnek</b><br>${esc(s.example)}</div>` : ""}`;
    } else {
      const d = done(); d.add(idx); store.set("lessonsDone", [...d]);
      sl.innerHTML = `<div style="text-align:center;padding:20px 0"><div style="font-size:64px">🎉</div><h1>Ders tamamlandı!</h1><div class="muted">${esc(L.title)}</div>
        <div style="display:flex;flex-direction:column;gap:8px;max-width:420px;margin:22px auto 0">
        ${L.tryIt ? `<a class="btn" href="#/${tryHref(L.tryIt)}">Gerçek bir şirkette gör: ${esc(L.tryIt.replace("bist:", ""))} karnesi</a>` : ""}
        ${idx + 1 < LESSONS.length ? `<a class="btn ghost" href="#/ders/${idx + 1}">Sonraki ders: ${esc(LESSONS[idx + 1].title)}</a>` : `<a class="btn ghost" href="#/test">Kendini dene</a>`}
        <a class="btn ghost" href="#/inceleme/ogren">Ders listesine dön</a></div></div>`;
    }
    window.scrollTo(0, 0);
  }
  const move = (d) => { const n = Math.max(0, Math.min(total - 1, p + d)); if (n !== p) { p = n; draw(); } };
  pv.onclick = () => move(-1); nx.onclick = () => move(1);
  const key = (e) => { if (e.key === "ArrowRight") move(1); if (e.key === "ArrowLeft") move(-1); };
  document.addEventListener("keydown", key); onLeave(() => document.removeEventListener("keydown", key));
  let sx = null;
  sl.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  sl.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) move(dx < 0 ? 1 : -1); sx = null; });
  draw();
}

function quizPage(el) {
  let i = 0, score = 0, picked = null;
  function draw() {
    if (i >= QUIZ.length) {
      const ic = score >= QUIZ.length - 1 ? "🏆" : score >= QUIZ.length / 2 ? "👍" : "📚";
      el.innerHTML = `<div class="card" style="max-width:640px;margin:20px auto;text-align:center;padding:30px"><div style="font-size:64px">${ic}</div><h1>${QUIZ.length} sorudan ${score} doğru</h1>
        <div class="muted">${score >= QUIZ.length - 1 ? "Harika! Artık bir şirketin karnesini okuyabilirsiniz." : "Yanlış yaptığınız konuların derslerine tekrar göz atabilirsiniz."}</div>
        <div class="row" style="justify-content:center;margin-top:18px"><button class="btn" id="again">Tekrar çöz</button><a class="btn ghost" href="#/inceleme/ogren">Derslere dön</a></div></div>`;
      el.querySelector("#again").onclick = () => { i = 0; score = 0; picked = null; draw(); };
      return;
    }
    const q = QUIZ[i];
    el.innerHTML = `<div style="max-width:720px;margin:0 auto"><a href="#/inceleme/ogren" class="small">‹ Dersler</a>
      <div class="small muted" style="margin-top:8px">Soru ${i + 1} / ${QUIZ.length}</div><h2 style="margin-top:4px">${esc(q.q)}</h2>
      ${q.options.map((o, k) => {
        let bg = "var(--card)";
        if (picked != null) { if (k === q.correct) bg = "var(--upbg)"; else if (k === picked) bg = "var(--downbg)"; }
        return `<div class="card quiz-opt" data-k="${k}" style="background:${bg};${picked == null ? "cursor:pointer" : ""}"><b style="color:var(--accent)">${"ABCD"[k]}</b> ${esc(o)}
          ${picked != null && k === q.correct ? " <b class='up'>✓</b>" : ""}${picked === k && k !== q.correct ? " <b class='down'>✗</b>" : ""}</div>`;
      }).join("")}
      ${picked != null ? `<div class="example" style="margin-top:12px"><b class="${picked === q.correct ? "up" : "down"}">${picked === q.correct ? "Doğru!" : "Doğru cevap: " + esc(q.options[q.correct])}</b><br>${esc(q.why)}</div>
        <button class="btn" id="nx" style="margin-top:12px;width:100%">${i + 1 < QUIZ.length ? "Sonraki soru" : "Sonucu gör"}</button>` : ""}</div>`;
    if (picked == null) el.querySelectorAll(".quiz-opt").forEach((c) => (c.onclick = () => { picked = +c.dataset.k; if (picked === q.correct) score++; draw(); }));
    else el.querySelector("#nx").onclick = () => { i++; picked = null; draw(); };
  }
  draw();
}

// ------------------------------------------------------------------ karne
function barChart(labels, values, cur) {
  const vals = values.map((v) => (v == null ? null : v));
  const real = vals.filter((v) => v != null);
  if (real.length < 2) return `<div class="small muted">Yeterli veri yok.</div>`;
  const mx = Math.max(0, ...real), mn = Math.min(0, ...real), span = mx - mn || 1;
  const H = 130, W = 100 / vals.length;
  const zero = (mx / span) * H;
  const short = (v) => { const a = Math.abs(v), s = v < 0 ? "−" : ""; return a >= 1e12 ? s + f1(a / 1e12) + "T" : a >= 1e9 ? s + f1(a / 1e9) + "Mr" : a >= 1e6 ? s + Math.round(a / 1e6) + "M" : s + Math.round(a); };
  return `<div style="display:flex;gap:4px">${vals.map((v) => `<div class="tiny muted" style="flex:1;text-align:center;white-space:nowrap;overflow:hidden">${v == null ? "" : short(v)}</div>`).join("")}</div>
    <svg width="100%" height="${H}" viewBox="0 0 100 ${H}" preserveAspectRatio="none" style="display:block">
    ${vals.map((v, i) => { if (v == null) return ""; const h = (Math.abs(v) / span) * H; const y = v >= 0 ? zero - h : zero;
      return `<rect x="${i * W + W * 0.12}" y="${y}" width="${W * 0.76}" height="${Math.max(h, 0.8)}" fill="${v < 0 ? "#c62828" : i === vals.length - 1 ? "#b8860b" : "#5b7fc7"}" rx="0.6"/>`; }).join("")}
    <line x1="0" x2="100" y1="${zero}" y2="${zero}" stroke="#8888" stroke-width="0.4"/></svg>
    <div style="display:flex;gap:4px">${labels.map((l) => `<div class="tiny muted" style="flex:1;text-align:center;line-height:1.15">${esc(l)}</div>`).join("")}</div>`;
}

async function reportPage(el, mk, sym) {
  const isBist = mk === "bist";
  el.innerHTML = `<div style="text-align:center;padding:60px 0"><div class="spinner"></div><div class="muted">Bilançolar inceleniyor…</div></div>`;
  let r;
  try { r = await loadReport(mk, sym); } catch (e) { el.innerHTML = `<div class="card err">Bu şirketin verileri alınamadı. Kodun doğru olduğundan emin olun ya da başka bir şirket deneyin.</div>`; return; }
  const m = r.m, cur = r.cur, name = cleanName(m.description) || sym;
  const rec = store.get("reportRecent", []).filter((x) => !(x[0] === mk && x[1] === sym));
  store.set("reportRecent", [[mk, sym, name], ...rec].slice(0, 8));
  const P = pillars(r);
  const quality = P.filter((x) => !x.price && x.level >= 0);
  const strong = quality.filter((x) => x.level === 2).map((x) => x.title), weak = quality.filter((x) => x.level === 0).map((x) => x.title);
  const pricePil = P.find((x) => x.price);
  const fs = m.piotroski_f_score_ttm;
  let unit = isBist ? store.get("karneUnit", "usd") : "tl";

  el.innerHTML = `<div class="row wrap" style="gap:14px">${logo(tvLogo(m.logoid) || (isBist ? "" : usLogo(sym)), name, 54)}
      <div class="grow"><h1 style="margin:0">${esc(name)} <span class="muted" style="font-size:15px;font-weight:400">karnesi</span></h1>
      <div class="small muted">${esc(sym)} · ${isBist ? "Borsa İstanbul" : esc(m.exchange || "ABD")} · ${esc(sectorTr(m.sector))}</div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:800">${price(m.close)} ${cur}</div>${pill(m.change)}<div class="tiny muted">${big(m.market_cap_basic, cur)}</div></div></div>
    ${isBist ? `<div class="card small" style="margin-top:10px;border-left:4px solid var(--gold-d)">🇹🇷 <b>Borsa İstanbul şirketi:</b> Rakamlar TL'dir ve yüksek enflasyon nedeniyle TL büyümesi yanıltıcı olabilir. Bu yüzden büyüme <b>dolar bazında</b> değerlendirilir (her çeyrek, çeyrek sonu kuruyla dolara çevrilir). <a href="#/ders/11">Bu konunun dersi ›</a></div>` : ""}
    <div class="card" style="margin-top:12px"><h3 style="margin-top:0">Karne özeti</h3>
      <div class="pill-row">${P.map((x) => `<div class="pdot" title="${esc(x.title)}"><span class="pdi" style="background:${LCOL[x.level]}22">${x.icon}</span><span class="pdd" style="background:${LCOL[x.level]}"></span><span class="tiny muted">${esc(x.title.split(" ")[0])}</span></div>`).join("")}</div>
      <div style="font-weight:600;margin-top:8px">Şirketin temel sağlığına dair ${quality.length} alanın ${strong.length} tanesi güçlü${weak.length ? `, ${weak.length} tanesi zayıf` : ", hiçbiri zayıf değil"}.</div>
      ${strong.length ? `<div class="up small" style="margin-top:4px">✓ Güçlü yanları: ${strong.join(", ")}</div>` : ""}
      ${weak.length ? `<div class="down small" style="margin-top:2px">⚠ Dikkat edilecekler: ${weak.join(", ")}</div>` : ""}
      ${pricePil ? `<div class="small" style="margin-top:2px">🏷️ Fiyat: ${esc(pricePil.verdict)}</div>` : ""}
      ${fs != null ? `<div style="margin-top:8px">${metric("Piotroski puanı", `${fs} / 9`, "Muhasebe profesörü Joseph Piotroski'nin geliştirdiği 9 maddelik sağlamlık testi: kâr ediyor mu, nakit üretiyor mu, kârlılık artıyor mu, borç azalıyor mu, yeni hisse basıldı mı, marj ve verimlilik iyileşiyor mu… Her “evet” 1 puan.\n\n7–9 güçlü, 4–6 orta, 0–3 zayıf kabul edilir. Özellikle ucuz görünen şirketlerde “ucuz mu, yoksa sorunlu mu?” sorusuna cevap aramak için kullanılır.",
        fs >= 7 ? "Güçlü: finansal durumu iyileşiyor." : fs >= 4 ? "Orta." : "Zayıf: finansal durum kötüleşiyor olabilir.")}</div>` : ""}
    </div>
    <div class="grid g2" style="margin-top:4px;align-items:start">
      <div><h2>Karne</h2><div class="tiny muted">Bir alana tıklayın: rakamları ve ne anlama geldiklerini görün.</div><div id="pil"></div></div>
      <div><h2>Son bilançolar ne anlattı?</h2><div id="story"></div></div>
    </div>
    <div class="row between wrap" style="margin-top:8px"><h2>Son 8 çeyrek</h2>${isBist ? `<div class="chips" id="unit"><button class="chip" data-u="usd">Dolar ($)</button><button class="chip" data-u="tl">TL (₺)</button></div>` : ""}</div>
    <div class="grid g3" id="qch"></div>
    <h2>Yıllar içinde</h2><div class="grid g2" id="ych"></div>
    <div id="next"></div>
    <div class="row wrap" style="margin-top:14px"><a class="btn" href="#/${isBist ? "bist" : "hisse"}/${esc(sym)}">Şirket sayfası: grafik ve tanıtım ›</a><a class="btn ghost" href="#/inceleme/ogren">🎓 Şirket nasıl incelenir?</a><a class="btn ghost" href="#/inceleme">🔍 Başka şirket incele</a></div>
    <div class="footer-note">Karne, şirketin açıkladığı rakamlardan kurallarla otomatik oluşturulur; şirketin geleceği hakkında bir tahmin ya da al-sat tavsiyesi değildir. Sektöre özgü durumlar (bankalar, yeni kurulan şirketler) rakamları farklı yorumlamayı gerektirebilir. Veriler: TradingView${isBist ? ", CNBC (dolar kuru)" : ", Nasdaq"}.</div>`;

  // karne kartları
  el.querySelector("#pil").innerHTML = P.map((x, i) => `<div class="card pillar" data-i="${i}">
    <div class="row" style="cursor:pointer"><span style="font-size:24px">${x.icon}</span><div class="grow"><b>${esc(x.title)}</b><div class="small">${esc(x.verdict)}</div></div>
      <span class="badge" style="background:${LCOL[x.level]}">${ltext(x.level, x.price)}</span><span class="tiny muted">▼</span></div>
    <div class="pbody">${x.rows.map((rw) => metric(rw[0], rw[1], rw[2], rw[3])).join("")}
      ${x.price ? `<div class="tiny muted" style="margin-top:6px">Not: Bu alan şirketin kalitesini değil, ödenen fiyatı ölçer. Harika bir şirket pahalı, zayıf bir şirket ucuz görünebilir.</div>` : ""}
      <a class="small" href="#/ders/${x.lesson}" style="display:inline-block;margin-top:8px">🎓 Bu konuyu öğren: ${esc(LESSONS[x.lesson].title)} ›</a></div></div>`).join("");
  el.querySelectorAll(".pillar > .row").forEach((h) => (h.onclick = () => h.parentElement.classList.toggle("open")));

  // son 4 bilanço
  const q = r.quarters, B = (v) => big(v, cur);
  const titles = ["Son bilanço", "Bir önceki çeyrek", "İki önceki çeyrek", "Üç önceki çeyrek"];
  el.querySelector("#story").innerHTML = q.slice(0, 4).map((x, i) => {
    const py = q[i + 4];
    const rY = yoy(x.revenue, py?.revenue), nY = yoy(x.netIncome, py?.netIncome);
    const rYu = isBist && x.rate && py?.rate ? yoy(x.revenue / x.rate, py.revenue / py.rate) : null;
    const gm = x.gross != null && x.revenue > 0 ? (x.gross / x.revenue) * 100 : null, gmP = py && py.gross != null && py.revenue > 0 ? (py.gross / py.revenue) * 100 : null;
    const bits = [];
    const gRef = isBist ? rYu : rY;
    if (gRef != null) bits.push(gRef >= 0 ? `gelir ${isBist ? "dolar bazında " : ""}büyüdü` : `gelir ${isBist ? "dolar bazında " : ""}geriledi`);
    if (x.netIncome != null && py?.netIncome != null) bits.push(x.netIncome > 0 && py.netIncome <= 0 ? "zarardan kâra geçti" : x.netIncome <= 0 && py.netIncome > 0 ? "kârdan zarara geçti"
      : x.netIncome > py.netIncome ? (x.netIncome > 0 ? "kâr arttı" : "zarar azaldı") : (x.netIncome > 0 ? "kâr azaldı" : "zarar büyüdü"));
    if (x.surprise != null) bits.push(x.surprise >= 0 ? "beklenti aşıldı" : "beklentinin altında kalındı");
    const sum = bits.join(", ");
    const good = (gRef ?? 0) >= 0 && (x.surprise ?? 0) >= 0 && (x.netIncome ?? 0) >= (py?.netIncome ?? -Infinity);
    const line = (l, v, n) => `<div class="row" style="align-items:flex-start;padding:3px 0"><span class="small muted" style="width:140px;flex-shrink:0">${l}</span><div><b class="small">${v}</b>${n ? `<div class="tiny">${n}</div>` : ""}</div></div>`;
    return `<div class="card story ${i === 0 ? "open" : ""}"><div class="row" style="cursor:pointer"><span style="width:10px;height:10px;border-radius:50%;background:${good ? "var(--up)" : "#b8860b"}"></span>
      <div class="grow"><b>${titles[i]} · ${esc(x.label)} çeyreği</b>${x.reported ? `<div class="tiny muted">Açıklama: ${esc(trDate(x.reported))}</div>` : ""}</div><span class="tiny muted">▼</span></div>
      ${sum ? `<div class="small" style="margin-top:6px">${esc(sum.charAt(0).toLocaleUpperCase("tr") + sum.slice(1))}.</div>` : ""}
      <div class="pbody">
        ${line("Gelir", B(x.revenue), [rY != null ? `geçen yılın aynı çeyreğine göre ${pct1(rY)}${isBist ? " (TL)" : ""}` : "", rYu != null ? `dolar bazında ${pct1(rYu)} (${big(x.revenue / x.rate)})` : ""].filter(Boolean).join(" · "))}
        ${line((x.netIncome ?? 0) >= 0 ? "Net kâr" : "Net zarar", B(x.netIncome != null ? Math.abs(x.netIncome) : null), py?.netIncome != null ? `geçen yıl ${B(py.netIncome)}${nY != null && x.netIncome > 0 && py.netIncome > 0 ? ` (${pct1(nY)})` : ""}` : "")}
        ${gm != null ? line("Brüt marj", "%" + f1(gm), gmP != null ? "geçen yıl %" + f1(gmP) : "") : ""}
        ${x.epsAdj != null ? line("Hisse başına kâr", `${f2(x.epsAdj)} ${cur}`, x.epsCons != null ? `beklenti ${f2(x.epsCons)} ${cur}` + (x.surprise != null ? (x.surprise >= 0 ? ` → %${f1(x.surprise)} aştı` : ` → %${f1(-x.surprise)} kaçırdı`) : "") : "")
          : x.eps != null ? line("Hisse başına kâr", `${f2(x.eps)} ${cur}`, "") : ""}
        ${x.fcf != null && m.sector !== "Finance" ? line("Serbest nakit akışı", (x.fcf < 0 ? "−" : "") + B(Math.abs(x.fcf)), x.fcf < 0 ? "nakit yaktı" : "") : ""}
        <div class="tiny muted" style="margin-top:6px">Hisse başına kâr beklentisi ve sürpriz, analistlerin takip ettiği “düzeltilmiş” rakamdır; tek seferlik kalemler hariç tutulur.</div></div></div>`;
  }).join("");
  el.querySelectorAll(".story > .row").forEach((h) => (h.onclick = () => h.parentElement.classList.toggle("open")));

  // grafikler
  function charts() {
    if (isBist) el.querySelectorAll("#unit .chip").forEach((c) => c.classList.toggle("on", c.dataset.u === unit));
    const conv = (v, rate) => (unit === "usd" && isBist ? (v == null || !rate ? null : v / rate) : v);
    const q8 = q.slice(0, 8).reverse();
    const lab = q8.map((x) => x.short);
    const card = (t, ex, labels, vals) => `<div class="card"><div class="row between"><b>${t}</b><span class="tiny" style="color:var(--accent);cursor:pointer" onclick="this.closest('.card').querySelector('.cx').classList.toggle('show')">Ne anlatıyor? ▼</span></div>
      <div class="cx small">${ex}</div>${barChart(labels, vals)}</div>`;
    const u = isBist ? (unit === "usd" ? " ($)" : " (₺)") : "";
    el.querySelector("#qch").innerHTML =
      card("Gelir" + u, "Her çeyrekte yapılan toplam satış. Sağa doğru yükseliyorsa şirket büyüyor. Mevsimsel şirketlerde aynı aylardaki sütunları karşılaştırın.", lab, q8.map((x) => conv(x.revenue, x.rate))) +
      card("Net kâr / zarar" + u, "Her çeyrekte kalan son kâr. Kırmızı sütunlar zarar edilen çeyreklerdir.", lab, q8.map((x) => conv(x.netIncome, x.rate))) +
      (m.sector !== "Finance" ? card("Serbest nakit akışı" + u, "Her çeyrekte kasaya kalan gerçek nakit. Kârla benzer gidiyorsa sağlıklıdır.", lab, q8.map((x) => conv(x.fcf, x.rate))) : "");
    const ys = r.years.slice(0, 10).reverse();
    el.querySelector("#ych").innerHTML = ys.length >= 3 ? card("Yıllık gelir" + u, "Uzun vadeli büyüme hikâyesi. İstikrarlı yükselen sütunlar güven verir." + (isBist ? " TL'de enflasyon nedeniyle her yıl yükselmiş görünebilir; dolar görünümüne geçerek karşılaştırın." : ""), ys.map((y) => y.label), ys.map((y) => conv(y.revenue, y.rate))) +
      card("Yıllık net kâr" + u, "Şirketin her yıl kalan son kârı.", ys.map((y) => y.label), ys.map((y) => conv(y.netIncome, y.rate))) : `<div class="small muted">Yıllık veri yok.</div>`;
  }
  if (isBist) el.querySelector("#unit").onclick = (e) => { const u = e.target.dataset.u; if (!u) return; unit = u; store.set("karneUnit", u); charts(); };
  charts();

  // sıradaki bilanço
  if (m.earnings_release_next_date) {
    const d = new Date(m.earnings_release_next_date * 1000);
    const when = m.earnings_release_next_time === -1 ? "piyasa açılmadan önce" : m.earnings_release_next_time === 1 ? "piyasa kapandıktan sonra" : "";
    el.querySelector("#next").innerHTML = `<h2>Sıradaki bilanço</h2><div class="card navy"><div style="font-size:18px;font-weight:800">${d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
      ${when ? `<div class="small muted">${when}</div>` : ""}
      ${m.earnings_per_share_forecast_next_fq != null ? `<div class="small" style="margin-top:6px">Beklenen hisse başına kâr: ${f2(m.earnings_per_share_forecast_next_fq)} ${cur}</div>` : ""}
      ${m.revenue_forecast_next_fq ? `<div class="small">Beklenen gelir: ${big(m.revenue_forecast_next_fq, cur)}</div>` : ""}</div>`;
  }
}

function trDate(s) {
  const m = /^(\d+)\/(\d+)\/(\d{4})$/.exec(s || "");
  if (!m) return s;
  return new Date(+m[3], +m[1] - 1, +m[2]).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
