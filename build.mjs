// Gera o site estático em dist/ a partir dos feeds definidos em config.mjs.
//   npm run build                       -> lê os feeds reais da internet
//   node build.mjs --fixtures pasta     -> lê ficheiros XML locais (testes)
//   node build.mjs --out pasta          -> escreve noutra pasta

import { XMLParser } from "fast-xml-parser";
import { mkdir, readFile, writeFile, copyFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { site, genres, feeds, fallbackGenre, excludeTitles } from "./config.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const FIXTURES = argValue("--fixtures");
const OUT = join(ROOT, argValue("--out") ?? "dist");
const NOW = new Date();
// Nos testes (--fixtures) não cortamos por data, para os exemplos não "envelhecerem".
const CUTOFF = FIXTURES ? new Date(0) : new Date(NOW.getTime() - site.days * 24 * 60 * 60 * 1000);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  cdataPropName: false,
  processEntities: true,
  htmlEntities: true,
});

// ---------- utilitários ----------

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === "object") return text(v["#text"] ?? "");
  return "";
};

const decodeEntities = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&hellip;/g, "…");

const stripHtml = (html) =>
  decodeEntities(
    String(html)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

const excerpt = (s, max = 220) => {
  // Remove o rodapé típico do WordPress ("The post X appeared first on Y").
  s = s
    .replace(/The post .* (appeared first|first appeared) on .*$/i, "")
    .replace(/Read full story on the Bandcamp Daily\s*\.?\s*$/i, "")
    .replace(/\s*Tracklisting:.*$/i, "")
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:–-]+$/, "") + "…";
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isHttpUrl = (u) => /^https?:\/\//i.test(u ?? "");

const firstImageInHtml = (html) => {
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return m && isHttpUrl(m[1]) ? decodeEntities(m[1]) : "";
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRegex = (kw) => new RegExp(`(?<![a-z0-9])${escapeRegex(kw.toLowerCase())}(?![a-z0-9])`, "i");
const genreMatchers = genres.map((g) => ({
  id: g.id,
  include: g.keywords.map(wordRegex),
  exclude: (g.excludeIf ?? []).map(wordRegex),
}));

function classify(feed, haystack) {
  const found = new Set(feed.genres ?? []);
  if (!feed.exclusive) {
    for (const m of genreMatchers) {
      if (m.exclude.some((r) => r.test(haystack))) continue;
      if (m.include.some((r) => r.test(haystack))) found.add(m.id);
    }
  }
  if (found.size === 0) for (const g of feed.defaultGenres ?? []) found.add(g);
  if (found.size === 0) found.add(fallbackGenre.id);
  return [...found];
}

// ---------- filtro de rigor: o artigo é sobre um disco concreto? ----------

const excludeRegex = excludeTitles.map(wordRegex);
const QUOTE = "[‘“\"'«].+[’”\"'»]";
const VERBS =
  "unveils?|releases?|returns?|debuts?|drops?|shares?|announces?|delivers?|presents?|lands?|revisits?|" +
  "introduces?|joins?|teams? up|links? up|premieres?|launch(es)?|serves? up|offers?|with";
const releasePatterns = [
  /\S\s[–—]\s\S/, // Artista – Título
  /\S\s-\s\S/, // Artista - Título
  /\S\s~\s\S/, // Artista ~ Título (A Closer Listen)
  /\S\s::\s\S/, // Artista :: Título (Igloo)
  new RegExp(`^[^,]+,\\s*${QUOTE}$`), // Artista, “Título” (Bandcamp Daily)
  /^premiere:/i,
  new RegExp(`\\b(${VERBS})\\b.*${QUOTE}`, "i"), // X unveils ‘Título’
  new RegExp(`\\b(${VERBS})\\b.*\\b(new )?(ep|lp|album|single|remix(es)?|12")\\b`, "i"), // X drops new EP
];

const CURRENT_YEAR = NOW.getFullYear();

function rejectReason(feed, title) {
  // Nas lojas, cada entrada é um disco: palavras como "Gallery" ou "Best Of" são nomes de discos.
  const hit = feed.kind === "loja" ? null : excludeTitles.find((_, i) => excludeRegex[i].test(title));
  if (hit) return `exclui "${hit}"`;
  const years = (title.match(/\b(19|20)\d\d\b/g) ?? []).map(Number);
  if (years.length && Math.max(...years) < CURRENT_YEAR - (site.maxYearsOld ?? 1)) return `ano antigo (${Math.max(...years)})`;
  if (feed.allPosts) return null;
  if (!releasePatterns.some((r) => r.test(title))) return "não parece um disco";
  return null;
}

// Terminal 313 dá notas com asteriscos ("***** Artista – Título").
const prettyTitle = (t) => t.replace(/^\*{1,5}\s+/, (m) => "★".repeat(m.trim().length) + " ");

// ---------- leitura dos feeds ----------

async function loadFeedXml(feed, index) {
  if (FIXTURES) {
    return readFile(join(ROOT, FIXTURES, `${index}.xml`), "utf8");
  }
  return fetchText(feed.url);
}

async function fetchText(url, encoding) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "NovosDiscosBot/1.0 (agregador de RSS; +" + site.url + ")",
      Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (encoding) return new TextDecoder(encoding).decode(await res.arrayBuffer());
  return res.text();
}

// A Decks.de (Cloudflare) recusa o fetch do Node mas aceita o curl, que existe
// nos servidores do GitHub. Lemos as páginas com o curl.
const execFileP = promisify(execFile);
async function fetchWithCurl(url, encoding) {
  const { stdout } = await execFileP(
    "curl",
    ["-sSL", "--fail", "-m", "25", "-A", "NovosDiscosBot/1.0 (+" + site.url + ")", url],
    { encoding: "buffer", maxBuffer: 20 * 1024 * 1024 }
  );
  return new TextDecoder(encoding).decode(stdout);
}

// ---------- Decks.de (loja sem RSS: lemos as listas de novidades) ----------

const titleCase = (s) =>
  s === s.toUpperCase() && /[A-Z]/.test(s)
    ? s
        .toLowerCase()
        .replace(/(^|[\s(\-/"'.])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())
        .replace(/\b(\d*)(lp|ep|cd|va|dj|mc|uk|usa|ltd)\b/gi, (_, n, w) => n + w.toUpperCase())
    : s;

async function loadDecks(feed, index) {
  const pages = FIXTURES
    ? [await readFile(join(ROOT, FIXTURES, `${index}.html`), "utf8")]
    : await Promise.all(feed.pages.map((u) => fetchWithCurl(u, "windows-1252")));
  const items = [];
  for (const html of pages) {
    for (const block of html.split(/<div class="oneLine\b/).slice(1)) {
      const pick = (re) => (block.match(re)?.[1] ?? "").trim();
      const artist = stripHtml(pick(/class="LArtist[^"]*">([\s\S]*?)<\/div>/));
      const title = stripHtml(pick(/class="LTitel[^"]*">([\s\S]*?)<\/div>/));
      const path = pick(/href="(\/track\/[^"]+)"/);
      const rel = pick(/class="RelFeature">\s*(\d\d\.\d\d\.\d\d)/);
      if (!artist || !title || !path || !rel) continue;
      const [d, m, y] = rel.split(".").map(Number);
      const styles = [...block.matchAll(/class="LStyle"><a[^>]*>([^<]+)</g)]
        .map((x) => decodeEntities(x[1]).trim())
        .filter((x) => !/^(1st at decks|vinyl only|repress|presale)$/i.test(x));
      const format = stripHtml(pick(/class="LFormat[^"]*"><span>([^<]*)/));
      const label = stripHtml(pick(/class="LLabel maxOneLine">([^<]*)/));
      const cat = stripHtml(pick(/class="LLabelcat maxOneLine">([^<]*)/));
      const memo = stripHtml(pick(/class="LMemo[^"]*">([\s\S]*?)<\/div>/));
      items.push({
        title: `${titleCase(artist)} – ${titleCase(title)}`,
        link: "https://www.decks.de" + path,
        // Data de lançamento indicada pela loja (meio-dia UTC, para não mudar de dia).
        date: new Date(Date.UTC(2000 + y, m - 1, d, 12)).toISOString(),
        categories: styles,
        summary: [[format, [label, cat].filter(Boolean).join(" ")].filter(Boolean).join(" · "), memo && memo[0].toUpperCase() + memo.slice(1)]
          .filter(Boolean)
          .join(" — "),
        image: pick(/<img class="lazy"[^>]*src="([^"]+)"/),
      });
    }
  }
  // A mesma referência pode aparecer em várias listas (ex.: Techno e House).
  const seen = new Set();
  return normalize(items.filter((it) => !seen.has(it.link) && seen.add(it.link)), feed);
}

function parseFeed(xml, feed) {
  const doc = parser.parse(xml);
  const items = [];

  // RSS 2.0
  for (const it of asArray(doc?.rss?.channel?.item)) {
    const html = text(it["content:encoded"]) || text(it.description);
    const image =
      [it["media:content"], it["media:thumbnail"], it.enclosure]
        .flatMap(asArray)
        .map((m) => m?.["@url"])
        .find((u) => isHttpUrl(u) && !/\.(mp3|m4a|ogg|wav)(\?|$)/i.test(u)) || firstImageInHtml(html);
    items.push({
      title: stripHtml(text(it.title)),
      link: text(it.link).trim() || text(it.guid).trim(),
      date: text(it.pubDate) || text(it["dc:date"]),
      categories: asArray(it.category).map(text).map(stripHtml).filter(Boolean),
      summary: stripHtml(text(it.description) || html),
      image,
    });
  }

  // Atom
  for (const it of asArray(doc?.feed?.entry)) {
    const links = asArray(it.link);
    const alt = links.find((l) => !l["@rel"] || l["@rel"] === "alternate") ?? links[0];
    const html = text(it.content) || text(it.summary);
    items.push({
      title: stripHtml(text(it.title)),
      link: alt?.["@href"] ?? "",
      date: text(it.published) || text(it.updated),
      categories: asArray(it.category).map((c) => c?.["@term"] ?? text(c)).filter(Boolean),
      summary: stripHtml(text(it.summary) || html),
      image: asArray(it["media:thumbnail"])[0]?.["@url"] || firstImageInHtml(html),
    });
  }

  if (feed.titleFormat === "colon") for (const it of items) it.title = it.title.replace(/^([^:]+):\s+/, "$1 – ");
  return normalize(items, feed);
}

function normalize(items, feed) {
  return items
    .map((it) => {
      const date = new Date(it.date);
      const haystack = [it.title, it.categories.join(" "), it.summary].join(" ").toLowerCase();
      return {
        title: prettyTitle(it.title),
        reject: rejectReason(feed, it.title),
        link: it.link,
        date,
        summary: excerpt(it.summary),
        image: isHttpUrl(it.image) ? it.image : "",
        source: feed.name,
        kind: feed.kind ?? "blog",
        sourceUrl: new URL(feed.url).origin,
        genres: classify(feed, haystack),
      };
    })
    .filter((it) => it.title && isHttpUrl(it.link) && !isNaN(it.date));
}

// ---------- geração do HTML ----------

const allGenres = site.showUnmatched ? [...genres, fallbackGenre] : genres;
const genreName = (id) => allGenres.find((g) => g.id === id)?.name ?? id;
const dateFmt = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", timeZone: "Europe/Lisbon" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Lisbon" });

function card(it) {
  const img = it.image
    ? `<img src="${escapeHtml(it.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('noimg');this.remove()">`
    : "";
  return `
    <article class="card" data-genres="${it.genres.join(" ")}" data-source="${escapeHtml(it.source)}" data-kind="${it.kind}" data-search="${escapeHtml((it.title + " " + it.summary + " " + it.source).toLowerCase())}">
      <a class="cover${it.image ? "" : " noimg"}" href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${img}</a>
      <div class="body">
        <p class="meta"><span class="source">${escapeHtml(it.source)}</span> · <time datetime="${it.date.toISOString()}">${dateFmt.format(it.date)}</time></p>
        <h2><a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.title)}</a></h2>
        ${it.summary ? `<p class="summary">${escapeHtml(it.summary)}</p>` : ""}
        <p class="tags">${it.genres.map((g) => `<span>${escapeHtml(genreName(g))}</span>`).join("")}</p>
      </div>
    </article>`;
}

function page(items, status) {
  const usedGenres = allGenres.filter((g) => items.some((it) => it.genres.includes(g.id)));
  const usedSources = feeds.map((f) => f.name).filter((n) => items.some((it) => it.source === n));
  const chips = [`<button class="chip active" data-genre="">Todos <small>${items.length}</small></button>`]
    .concat(
      usedGenres.map(
        (g) =>
          `<button class="chip" data-genre="${g.id}">${escapeHtml(g.name)} <small>${items.filter((it) => it.genres.includes(g.id)).length}</small></button>`
      )
    )
    .join("");
  const sourcesOk = status.filter((s) => s.ok);
  return `<!doctype html>
<html lang="${site.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(site.title)}</title>
<meta name="description" content="${escapeHtml(site.tagline)}">
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.title)}" href="feed.xml">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23111'/><circle cx='50' cy='50' r='16' fill='%23e8572a'/><circle cx='50' cy='50' r='3' fill='%23fff'/></svg>">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top">
  <div class="wrap">
    <h1><span class="disc" aria-hidden="true"></span>${escapeHtml(site.title)}</h1>
    <p class="tagline">${escapeHtml(site.tagline)} Últimos ${site.days} dias.</p>
  </div>
</header>
<nav class="filters wrap" aria-label="Filtros">
  <div class="chips" role="group" aria-label="Estilo">${chips}</div>
  <div class="row">
    <input id="q" type="search" placeholder="Procurar artista, editora…" aria-label="Procurar">
    <select id="kind" aria-label="Tipo">
      <option value="">Blogs e lojas</option>
      <option value="blog">Só críticas (blogs)</option>
      <option value="loja">Só novidades das lojas</option>
    </select>
    <select id="src" aria-label="Fonte">
      <option value="">Todas as fontes</option>
      ${["blog", "loja"]
        .map((k) => {
          const names = usedSources.filter((n) => (feeds.find((f) => f.name === n).kind ?? "blog") === k);
          return names.length
            ? `<optgroup label="${k === "loja" ? "Lojas" : "Blogs"}">${names.map((n) => `<option>${escapeHtml(n)}</option>`).join("")}</optgroup>`
            : "";
        })
        .join("")}
    </select>
  </div>
</nav>
<main class="wrap">
  <p id="count" class="count" aria-live="polite"></p>
  <div class="grid">${items.map(card).join("")}</div>
  <p id="empty" class="empty" hidden>Nada encontrado com estes filtros.</p>
  ${items.length === 0 ? `<p class="empty">Ainda não há artigos dos últimos ${site.days} dias.</p>` : ""}
</main>
<footer class="wrap foot">
  <p>Atualizado a ${dateTimeFmt.format(NOW)}. Fontes: ${sourcesOk
    .map((s) => `<a href="${escapeHtml(s.origin)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>`)
    .join(", ")}.</p>
  <p>Os textos e imagens pertencem aos respetivos autores; aqui mostramos apenas títulos e excertos com ligação para o artigo original. <a href="feed.xml">RSS</a></p>
</footer>
<script src="app.js"></script>
</body>
</html>
`;
}

function rss(items) {
  const x = (s) => escapeHtml(s).replace(/'/g, "&apos;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${x(site.title)}</title>
<link>${x(site.url)}</link>
<description>${x(site.tagline)}</description>
<language>${site.language}</language>
<lastBuildDate>${NOW.toUTCString()}</lastBuildDate>
${items
  .map(
    (it) => `<item>
<title>${x(`${it.title} (${it.source})`)}</title>
<link>${x(it.link)}</link>
<guid isPermaLink="true">${x(it.link)}</guid>
<pubDate>${it.date.toUTCString()}</pubDate>
${it.genres.map((g) => `<category>${x(genreName(g))}</category>`).join("")}
<description>${x(it.summary)}</description>
</item>`
  )
  .join("\n")}
</channel>
</rss>
`;
}

// ---------- principal ----------

const results = await Promise.all(
  feeds.map(async (feed, i) => {
    try {
      const items = feed.type === "decks" ? await loadDecks(feed, i) : parseFeed(await loadFeedXml(feed, i), feed);
      return { feed, items, ok: true };
    } catch (err) {
      return { feed, items: [], ok: false, error: err.message };
    }
  })
);

const status = results.map((r) => ({
  name: r.feed.name,
  url: r.feed.url,
  origin: new URL(r.feed.url).origin,
  ok: r.ok,
  error: r.error,
  total: r.items.length,
  recent: r.items.filter((it) => it.date >= CUTOFF).length,
}));

console.log(`\nFeeds (últimos ${site.days} dias desde ${CUTOFF.toISOString()}):`);
for (const s of status) {
  console.log(s.ok ? `  ✓ ${s.name}: ${s.recent} recentes de ${s.total}` : `  ✗ ${s.name}: ERRO ${s.error} (${s.url})`);
}

if (status.every((s) => !s.ok)) {
  console.error("\nNenhum feed respondeu. O site não foi gerado, para não publicar uma página vazia.");
  process.exit(1);
}

// Junta, remove duplicados (mesmo link) e ordena do mais recente para o mais antigo.
const seen = new Set();
const rejected = [];
const items = results
  .flatMap((r) => r.items)
  .filter((it) => it.date >= CUTOFF && it.date <= new Date(NOW.getTime() + 36e5))
  .filter((it) => {
    if (!it.reject && !site.showUnmatched && it.genres.includes(fallbackGenre.id)) it.reject = "fora dos estilos";
    if (it.reject) rejected.push(it);
    return !it.reject;
  })
  .filter((it) => {
    const key = it.link.replace(/[?#].*$/, "").replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .sort((a, b) => b.date - a.date);

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, "index.html"), page(items, status));
await writeFile(join(OUT, "feed.xml"), rss(items));
await writeFile(join(OUT, "status.json"), JSON.stringify({ updated: NOW.toISOString(), feeds: status }, null, 2));
for (const f of await readdir(join(ROOT, "src"))) await copyFile(join(ROOT, "src", f), join(OUT, f));

console.log(`\nArtigos incluídos:`);
for (const it of items) console.log(`  [${it.source}] ${it.title}  {${it.genres.join(", ")}}${it.image ? "" : "  (sem imagem)"}\n      ${it.summary.slice(0, 160)}`);

console.log(`\nArtigos publicados por fonte:`);
for (const f of feeds) console.log(`  ${f.name}: ${items.filter((it) => it.source === f.name).length}`);

console.log(`\nArtigos recusados (${rejected.length}):`);
for (const it of rejected) console.log(`  [${it.source}] ${it.title}  -> ${it.reject}`);

console.log(`\nSite gerado em ${OUT} com ${items.length} artigos.`);
