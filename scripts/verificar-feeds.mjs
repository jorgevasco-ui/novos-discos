// Testa uma lista de feeds RSS e mostra quantos artigos têm e os títulos mais recentes.
//   node scripts/verificar-feeds.mjs https://exemplo.com/feed/ https://outro.com/feed/
import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" });
const t = (v) => (v == null ? "" : typeof v === "object" ? (v["#text"] ?? "") : String(v));
const urls = process.argv.slice(2);
await Promise.all(urls.map(async (url) => {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "NovosDiscosBot/1.0" }, signal: AbortSignal.timeout(20000) });
    const body = await res.text();
    const doc = parser.parse(body);
    const items = [].concat(doc?.rss?.channel?.item ?? doc?.feed?.entry ?? []);
    const dates = items.map((i) => new Date(t(i.pubDate) || t(i.published) || t(i.updated))).filter((d) => !isNaN(d)).sort((a, b) => b - a);
    const days = dates.length ? ((Date.now() - dates[0]) / 864e5).toFixed(1) : "?";
    const cats = [...new Set(items.flatMap((i) => [].concat(i.category ?? []).map((c) => t(c) || c?.["@term"] || "")))].slice(0, 15);
    console.log(`\n=== ${url}\n  HTTP ${res.status} · ${items.length} artigos · último há ${days} dias · em 15 dias: ${dates.filter((d) => Date.now() - d < 15 * 864e5).length}`);
    console.log(`  categorias: ${cats.join(" | ")}`);
    for (const i of items.slice(0, 8)) console.log(`  - ${t(i.title).replace(/\s+/g, " ").slice(0, 110)}`);
  } catch (e) {
    console.log(`\n=== ${url}\n  ERRO ${e.message}`);
  }
}));
