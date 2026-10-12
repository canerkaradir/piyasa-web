import { store, local } from "../api.js";
import { timeAgo } from "../ui.js";

export async function render(el) {
  const th = store.get("theme", "");
  el.innerHTML = `<h1>Ayarlar</h1>
    <div class="card"><h3 style="margin-top:0">Görünüm</h3><div class="chips" id="th">
      <button class="chip" data-t="">Sistem ayarı</button><button class="chip" data-t="light">Açık</button><button class="chip" data-t="dark">Koyu</button></div></div>
    <div class="card" style="margin-top:12px"><h3 style="margin-top:0">Öğren</h3><a href="#/sozluk">📖 Sözlük</a> — faiz, F/K, enflasyon, kripto ve daha fazlası.</div>
    <div class="card" style="margin-top:12px"><h3 style="margin-top:0">Veriler nasıl güncellenir?</h3><div class="small">
      • Fiyatlar, grafikler ve şirket bilgileri sayfayı açtığınızda doğrudan kaynaklardan (CNBC, TradingView, CoinGecko) canlı gelir; açık sayfalar dakikada bir yenilenir.<br>
      • Haberler, korku-açgözlülük endeksi, ekonomik takvim ve içeriden alımlar GitHub tarafından her 30 dakikada bir toplanıp Türkçeye çevrilir.<br>
      • İzleme listeniz ve portföyünüz yalnızca bu tarayıcıda saklanır. Portföy sayfasından yedek alabilirsiniz.<br>
      • Bildirim ve fiyat alarmları telefon uygulamasındadır; web sürümünde yoktur.</div>
      <div class="small muted" id="upd" style="margin-top:6px"></div></div>
    <div class="card" style="margin-top:12px"><h3 style="margin-top:0">Verileri sıfırla</h3><div class="small">İzleme listesi, portföy, tercihler ve çeviri önbelleği silinir.</div>
      <button class="btn ghost" id="rst" style="margin-top:8px">Hepsini sil</button></div>
    <div class="footer-note">Piyasa Pusulası · Kişisel kullanım için. Öğrenme amaçlıdır, yatırım tavsiyesi değildir.</div>`;
  const chips = el.querySelector("#th");
  const mark = (t) => chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.t === t));
  mark(th);
  chips.onclick = (e) => {
    const t = e.target.dataset.t; if (t == null) return;
    store.set("theme", t); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; mark(t);
  };
  el.querySelector("#rst").onclick = () => { if (confirm("İzleme listesi ve portföy dahil her şey silinsin mi?")) { localStorage.clear(); location.reload(); } };
  local("updated.json").then((u) => (el.querySelector("#upd").textContent = "Son veri toplama: " + timeAgo(u.at))).catch(() => {});
}
