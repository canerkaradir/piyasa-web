// Canlı siteyi gerçek tarayıcıda açıp ekran görüntüsü ve hata kaydı alır.
import { chromium } from "playwright";
import fs from "fs";
const base = process.env.SITE || "https://canerkaradir.github.io/piyasa-web/";
const routes = (process.env.ROUTES || "|haberler|liste/NASDAQ|liste/BIST30|hisse/NVDA|bist/THYAO|kripto|kripto/bitcoin|emtia/altin|altin-tahmin|bilancolar|bilanco/AAPL|gelecek|isi|hareketliler|takvim|iceriden|karsilastir/NVDA/AMD|neolurdu/AAPL|portfoy|sozluk|endeks/.SPX").split("|");
fs.mkdirSync("out", { recursive: true });
const b = await chromium.launch();
const log = [];
for (const [vw, tag] of [[{ width: 1300, height: 900 }, "d"], [{ width: 390, height: 844 }, "m"]]) {
  const p = await b.newPage({ viewport: vw });
  p.on("pageerror", (e) => log.push(`[${tag}] PAGEERR ${p.url()} ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error") log.push(`[${tag}] CONSOLE ${p.url()} ${m.text().slice(0, 300)}`); });
  p.on("requestfailed", (r) => log.push(`[${tag}] REQFAIL ${r.url().slice(0, 150)} ${r.failure()?.errorText}`));
  p.on("response", (r) => { if (r.status() >= 400) log.push(`[${tag}] HTTP ${r.status()} ${r.url().slice(0, 150)}`); });
  for (const r of tag === "m" ? routes.slice(0, 6) : routes) {
    await p.goto(base + "#/" + r, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(6000);
    if (process.env.MEASURE && tag === "d") {
      const c = await p.$("canvas.chart");
      if (c) { const bb = await c.boundingBox(); await p.mouse.click(bb.x + bb.width * 0.2, bb.y + 100); await p.mouse.click(bb.x + bb.width * 0.7, bb.y + 100); await p.waitForTimeout(400); }
    }
    if (process.env.MEASURE && tag === "m") {
      const c = await p.$("canvas.chart");
      if (c) { const bb = await c.boundingBox(); await p.mouse.move(bb.x + bb.width * 0.1, bb.y + 100); await p.mouse.down(); for (let k = 1; k <= 10; k++) await p.mouse.move(bb.x + bb.width * (0.1 + 0.06 * k), bb.y + 100); await p.mouse.up(); await p.waitForTimeout(400); }
    }
    const errs = await p.$$eval(".err", (e) => e.map((x) => x.textContent.trim()));
    if (errs.length) log.push(`[${tag}] UI-ERR #/${r}: ${errs.join(" | ")}`);
    await p.screenshot({ path: `out/${tag}_${(r || "home").replace(/[\/.]/g, "_")}.png`, fullPage: tag === "d" });
  }
  await p.close();
}
await b.close();
fs.writeFileSync("out/log.txt", log.join("\n") + "\n");
console.log(log.join("\n"));
