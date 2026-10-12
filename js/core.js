// Sayfalar arası ortak yardımcılar: zamanlayıcı temizliği, gezinme, favoriler
import { store } from "./api.js";

let cleanups = [];
export function onLeave(fn) { cleanups.push(fn); }
export function leaveAll() { cleanups.forEach((f) => { try { f(); } catch (e) { /* yoksay */ } }); cleanups = []; }
export function every(ms, fn) { const id = setInterval(() => { if (!document.hidden) fn(); }, ms); onLeave(() => clearInterval(id)); }
export const go = (path) => { location.hash = "#/" + path; };

/** İzleme listesi: {k: "us"|"bist"|"coin", s, n} */
export const favs = {
  all: () => store.get("favs", []),
  has: (k, s) => favs.all().some((f) => f.k === k && f.s === s),
  toggle(k, s, n) {
    const l = favs.all(); const i = l.findIndex((f) => f.k === k && f.s === s);
    if (i >= 0) l.splice(i, 1); else l.push({ k, s, n });
    store.set("favs", l); return i < 0;
  },
};
export function starBtn(k, s, n) {
  const on = favs.has(k, s);
  return `<button class="btn ghost star" data-k="${k}" data-s="${s}" data-n="${String(n).replace(/"/g, "&quot;")}">${on ? "★ İzleniyor" : "☆ İzlemeye al"}</button>`;
}
export function bindStars(root) {
  root.querySelectorAll(".star").forEach((b) => (b.onclick = () => {
    const on = favs.toggle(b.dataset.k, b.dataset.s, b.dataset.n);
    b.textContent = on ? "★ İzleniyor" : "☆ İzlemeye al";
  }));
}
/** data-h özniteliği olan öğelere tıklayınca gezinme */
export function bindLinks(root) {
  root.querySelectorAll("[data-h]").forEach((el) => el.addEventListener("click", (e) => {
    if (e.target.closest("a,button,input,select")) return;
    go(el.dataset.h);
  }));
}
/** Görünür olunca çalıştır (tembel yükleme) */
export function whenVisible(el, fn) {
  const io = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }, { rootMargin: "200px" });
  io.observe(el); onLeave(() => io.disconnect());
}
