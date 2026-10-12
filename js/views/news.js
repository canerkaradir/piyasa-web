import { esc, timeAgo } from "../ui.js";
import { local, store } from "../api.js";
import { every } from "../core.js";
import { newsCard, disclaimer } from "../widgets.js";

export async function render(el) {
  let level = store.get("newsLevel", 2), text = "", list = [];
  el.innerHTML = `<h1>Önemli gelişmeler</h1>
    <div class="small muted" id="upd">ABD piyasaları, Fed, ekonomik veriler, dev şirketler, yapay zekâ, altın ve gümüş</div>
    <div class="row wrap" style="margin:10px 0">
      <div class="chips" id="lv" style="margin:0">
        <button class="chip" data-l="3">Çok önemli</button><button class="chip" data-l="2">Önemli</button><button class="chip" data-l="1">Hepsi</button>
      </div>
      <input class="input" id="ft" placeholder="Haberlerde ara (ör. Nvidia, Fed, altın)" style="max-width:320px">
    </div>
    <div class="tiny muted" style="margin-bottom:6px">Habere tıklayınca "olası etki" notu ve kaynağa bağlantı açılır. Haberler her 30 dakikada bir toplanıp Türkçeye çevrilir.</div>
    <div id="list"><div class="spinner"></div></div>
    ${disclaimer("CNBC, MarketWatch, Fed, Google Haberler; çeviri Google Çeviri")}`;
  const lv = el.querySelector("#lv"), box = el.querySelector("#list");
  const draw = () => {
    lv.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", +c.dataset.l === level));
    const t = text.toLocaleLowerCase("tr");
    const l = list.filter((n) => n.score >= level && (!t || (n.tr + " " + n.title + " " + (n.tags || []).join(" ")).toLocaleLowerCase("tr").includes(t)));
    box.innerHTML = l.length ? groupByDay(l) : `<div class="muted">Bu seviyede haber yok.</div>`;
  };
  lv.onclick = (e) => { const l = e.target.dataset.l; if (!l) return; level = +l; store.set("newsLevel", level); draw(); };
  el.querySelector("#ft").oninput = (e) => { text = e.target.value.trim(); draw(); };
  async function load() {
    try {
      list = await local("news.json");
      const u = await local("updated.json").catch(() => null);
      if (u) el.querySelector("#upd").textContent = "Son güncelleme: " + timeAgo(u.at);
      draw();
    } catch (e) { box.innerHTML = `<div class="err">Haberler alınamadı.</div>`; }
  }
  load(); every(5 * 60_000, load);
}

function groupByDay(l) {
  let out = "", last = "";
  for (const n of l) {
    const d = n.time ? new Date(n.time).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) : "";
    if (d !== last) { out += `<h3>${esc(d)}</h3>`; last = d; }
    out += newsCard(n);
  }
  return out;
}
