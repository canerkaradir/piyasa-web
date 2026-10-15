import { esc, price, pill, big, logo, tvLogo, cleanName, sectorTr, spark } from "../ui.js";
import { listPage, breadth, bars, cnbcSym, local } from "../api.js";
import { bindLinks, whenVisible } from "../core.js";
import { disclaimer } from "../widgets.js";

export const KINDS = {
  NASDAQ: ["Nasdaq", "Nasdaq borsasında işlem gören bütün şirketler, piyasa değerine göre. Teknoloji ağırlıklıdır.", "$"],
  SPX: ["S&P 500", "ABD'nin en büyük 500 şirketi. Dünyada en çok takip edilen endekstir; 'piyasa' denince çoğu zaman bu kastedilir.", "$"],
  ALL: ["Tüm ABD şirketleri", "Nasdaq, New York Borsası (NYSE) ve NYSE American'da işlem gören bütün şirketler, piyasa değerine göre. Bir şirketi bulamadığınızda buradan arayın.", "$"],
  RUT: ["Russell 2000", "ABD'nin 2000 küçük ölçekli şirketi. Faiz indirimlerinden ve ABD iç ekonomisinden en çok etkilenen gruptur.", "$"],
  BIST30: ["BIST 30", "Borsa İstanbul'un en büyük ve en çok işlem gören 30 şirketi.", "₺"],
  BIST100: ["BIST 100", "Borsa İstanbul'un en büyük 100 şirketi. Diğer BIST şirketlerini üstteki arama kutusundan bulabilirsiniz.", "₺"],
};

export async function render(el, [kind = "NASDAQ"]) {
  const [title, desc, cur] = KINDS[kind] || KINDS.NASDAQ;
  const bist = kind.startsWith("BIST");
  let offset = 0, query = "", total = 0;
  el.innerHTML = `<h1>${title}</h1><div class="small muted">${desc}</div>
    <div id="br" class="small" style="margin:6px 0"></div>
    <input class="input" id="q" placeholder="Bu listede ara (ad ya da kod)" style="max-width:340px;margin:8px 0">
    <div class="tscroll"><table class="t"><thead><tr><th class="hide-m">#</th><th>Şirket</th><th class="hide-m">${bist ? "Son 1 ay" : "Bugün"}</th><th class="r">Fiyat</th><th class="r">Değişim</th><th class="r hide-m">Piyasa değeri</th><th class="hide-m">Sektör</th></tr></thead><tbody id="tb"></tbody></table></div>
    <div id="more" style="text-align:center;margin:12px"></div>
    ${disclaimer("TradingView, CNBC")}`;
  const tb = el.querySelector("#tb"), more = el.querySelector("#more");

  if (!bist) breadth(kind).then((b) => {
    const t = b.up + b.down;
    el.querySelector("#br").innerHTML = `Bugün <b class="up">${b.up}</b> şirket yükseldi, <b class="down">${b.down}</b> düştü.
      <span class="muted">Şirketlerin %${Math.round((b.a200 / (b.a200 + b.b200 || 1)) * 100)}'ı 200 günlük ortalamasının üstünde.</span>
      <div style="height:6px;background:var(--downbg);border-radius:3px;max-width:340px;margin-top:4px"><div style="height:6px;width:${(b.up / (t || 1)) * 100}%;background:var(--up);border-radius:3px"></div></div>`;
  }).catch(() => {});

  async function load(reset) {
    if (reset) { offset = 0; tb.innerHTML = ""; }
    more.innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await listPage(kind, offset, bist ? 120 : 100, query);
      total = r.total;
      const html = r.rows.map((x, i) => {
        const name = cleanName(x.description);
        return `<tr class="click" data-h="${bist ? "bist" : "hisse"}/${esc(x.name)}">
          <td class="muted small hide-m">${offset + i + 1}</td>
          <td><div class="row">${logo(tvLogo(x.logoid), name, 32)}<div style="min-width:0"><div class="ell" style="max-width:260px"><b>${esc(name)}</b></div><div class="tiny muted">${esc(x.name)}</div></div></div></td>
          <td class="hide-m" data-sp="${esc(x.name)}" style="width:120px"></td>
          <td class="r">${price(x.close)} ${cur}</td><td class="r">${pill(x.change)}</td>
          <td class="r hide-m">${big(x.market_cap_basic, cur)}</td><td class="hide-m small muted">${esc(sectorTr(x.sector))}</td></tr>`;
      }).join("");
      const tmp = document.createElement("tbody"); tmp.innerHTML = html;
      const rows = [...tmp.children];
      rows.forEach((tr) => tb.appendChild(tr));
      bindLinks(tb);
      rows.forEach((tr) => {
        const td = tr.querySelector("[data-sp]"); if (!td) return;
        whenVisible(td, async (c) => {
          const s = c.dataset.sp;
          try {
            if (bist) { const d = await local(`bist/${s}.json`); c.innerHTML = spark(d.slice(-22).map((p) => p[1]), 110, 32); }
            else { const b = await bars(cnbcSym(s), "1G"); const prev = null; c.innerHTML = spark(b.map((p) => p.c), 110, 32, prev); }
          } catch (e) { /* grafik yok */ }
        });
      });
      offset += r.rows.length;
      more.innerHTML = offset < total ? `<button class="btn">Daha fazla göster (${offset} / ${total})</button>` : `<span class="small muted">${total} şirket</span>`;
      const b = more.querySelector("button"); if (b) b.onclick = () => load(false);
    } catch (e) { more.innerHTML = `<div class="err">Liste alınamadı. Biraz sonra tekrar deneyin.</div>`; }
  }
  let t = null;
  el.querySelector("#q").oninput = (e) => { clearTimeout(t); t = setTimeout(() => { query = e.target.value.trim(); load(true); }, 350); };
  load(true);
}
