import { esc, big, logo, usLogo } from "../ui.js";
import { local, store } from "../api.js";
import { bindLinks } from "../core.js";
import { disclaimer } from "../widgets.js";

const WHY = "Şirket yöneticileri ve büyük ortaklar kendi şirketlerinin hisselerini aldığında ya da sattığında bunu 3 iş günü içinde SEC'e (ABD Sermaye Piyasası Kurulu) bildirmek zorundadır (Form 4).<br><br>Alımlar satışlardan çok daha anlamlıdır. Yöneticiler hisse satarken pek çok sebepleri olabilir (vergi, ev almak, önceden planlanmış satış programları). Ama kendi cebinden para koyup hisse almasının genelde tek bir sebebi vardır: şirketin değerinin artacağına inanması.<br><br>Özellikle güçlü sinyaller: CEO ya da CFO'nun alımı, birden fazla yöneticinin aynı dönemde alım yapması (küme alım), yöneticinin elindeki hisseyi büyük oranda artırması. Yine de tek başına alım sebebi değildir; yöneticiler de yanılabilir.";
function role(t) {
  return t.split(",").map((p) => {
    p = p.trim();
    if (/^CEO$/i.test(p)) return "CEO (genel müdür)";
    if (/^CFO$/i.test(p)) return "CFO (finans direktörü)";
    if (/^COO$/i.test(p)) return "COO (operasyon direktörü)";
    if (/^Dir$/i.test(p)) return "Yönetim kurulu üyesi";
    if (p.startsWith("10%")) return "%10+ büyük ortak";
    if (/^Pres$/i.test(p)) return "Başkan";
    if (/^(Chair|COB)$/i.test(p)) return "Yönetim kurulu başkanı";
    if (/^(EVP|SVP|VP)/.test(p) || /Vice President|Officer/i.test(p)) return /Chief Executive/i.test(p) ? "CEO (genel müdür)" : /Chief Financial/i.test(p) ? "CFO (finans direktörü)" : "Üst yönetici";
    if (/^Director$/i.test(p)) return "Yönetim kurulu üyesi";
    if (/Beneficial Owner|10% Owner/i.test(p)) return "%10+ büyük ortak";
    if (/^President$/i.test(p)) return "Başkan";
    if (/Chairman/i.test(p)) return "Yönetim kurulu başkanı";
    return p;
  }).join(", ");
}

export async function render(el) {
  let min = store.get("insMin", 1e5);
  el.innerHTML = `<h1>İçeriden alımlar</h1>
    <div class="card navy metric" onclick="this.classList.toggle('open')"><b>Yöneticiler kendi hisselerini alıyor</b><div class="small muted">Bu neden önemli? Tıklayın.</div><div class="mx" style="color:var(--text)">${WHY}</div></div>
    <div class="chips"><button class="chip" data-m="1e5">100 bin $+</button><button class="chip" data-m="1e6">1 milyon $+</button><button class="chip" data-m="1e7">10 milyon $+</button></div>
    <div id="list"><div class="spinner"></div></div>
    ${disclaimer("Nasdaq / SEC Form 4 kayıtları; S&P 500, Nasdaq'ın en büyük 250 ve Russell 2000'in en büyük 250 şirketi ile Gelecek vaat edenler şirketleri 6 saatte bir taranır, son 30 gün gösterilir. \"Payı\": yöneticinin elindeki hisse miktarının bu alımla yüzde kaç arttığı")}`;
  const box = el.querySelector("#list"), chips = el.querySelector(".chips");
  let all = [];
  try { all = await local("insiders.json"); } catch (e) { box.innerHTML = `<div class="err">Veri alınamadı.</div>`; return; }
  function draw() {
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", +c.dataset.m === min));
    const l = all.filter((b) => b.value >= min);
    const cnt = {}; l.forEach((b) => (cnt[b.ticker] = (cnt[b.ticker] || 0) + 1));
    box.innerHTML = l.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${l.map((b) => `<div class="card row" data-h="hisse/${esc(b.ticker)}" style="cursor:pointer;align-items:flex-start">
      ${logo(usLogo(b.ticker), b.company, 34)}<div class="grow"><div class="ell"><b>${esc(b.company)}</b></div>
      <div class="tiny muted ell">${esc(b.ticker)} · ${esc(b.insider)}</div><div class="tiny">${esc(role(b.title))}</div>
      ${cnt[b.ticker] > 1 ? `<span class="badge" style="background:#1b7f3b">KÜME ALIM: ${cnt[b.ticker]} kayıt</span>` : ""}</div>
      <div style="text-align:right"><b class="up">${big(b.value)}</b><div class="tiny muted">${esc(b.qty)} hisse · ${esc(b.price)}</div><div class="tiny muted">Payı ${esc(b.own)} · ${esc(b.date)}</div></div></div>`).join("")}</div>`
      : `<div class="muted">Bu tutarın üstünde alım yok.</div>`;
    bindLinks(box);
  }
  chips.onclick = (e) => { const m = e.target.dataset.m; if (!m) return; min = +m; store.set("insMin", min); draw(); };
  draw();
}
