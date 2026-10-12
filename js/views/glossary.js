import { esc } from "../ui.js";
import { CATEGORIES, TERMS } from "../glossary.js";

export async function render(el) {
  let cat = "", q = "";
  el.innerHTML = `<h1>Sözlük</h1><div class="small muted">${TERMS.length} terim. Bir terime tıklayınca açıklaması açılır.</div>
    <input class="input" id="q" placeholder="Terim ara (ör. F/K, enflasyon, halving)" style="max-width:360px;margin:10px 0">
    <div class="chips" id="cats"><button class="chip on" data-c="">Hepsi</button>${CATEGORIES.map((c) => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="card" id="list"></div>`;
  const list = el.querySelector("#list"), cats = el.querySelector("#cats");
  function draw() {
    cats.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.c === cat));
    const t = q.toLocaleLowerCase("tr");
    const l = TERMS.filter((x) => (!cat || x.cat === cat) && (!t || (x.term + " " + x.what).toLocaleLowerCase("tr").includes(t)));
    list.innerHTML = l.map((x) => `<div class="term" onclick="this.classList.toggle('open')"><div class="row between"><span class="tn">${esc(x.term)}</span><span class="tiny muted">${esc(x.cat)}</span></div>
      <div class="tx"><b>Nedir?</b> ${esc(x.what)}${x.meaning ? `<br><br><b>Ne anlama gelir?</b> ${esc(x.meaning)}` : ""}${x.effect ? `<br><br><b>Piyasaya etkisi:</b> ${esc(x.effect)}` : ""}</div></div>`).join("") || `<div class="muted">Sonuç yok.</div>`;
    if (l.length === 1) list.querySelector(".term").classList.add("open");
  }
  el.querySelector("#q").oninput = (e) => { q = e.target.value.trim(); draw(); };
  cats.onclick = (e) => { const c = e.target.dataset.c; if (c == null) return; cat = c; draw(); };
  draw();
}
