#!/usr/bin/env node
/**
 * ToolVerse browser-tools static generator (zero-framework).
 * Phases 1–2: tool pages, hub, search index, tools sitemap.
 * Phase 3: category landing pages + the marked "Free Online Tools"
 * section on the homepage.
 *
 * Reads tool definitions from tools-data (nested by category), validates them, and
 * generates static HTML pages under tools/<category>/<slug>.html plus:
 *   - tools/<category>/index.html (category landing page per used category)
 *   - tools/index.html        (hub: categories + search entry)
 *   - tools/search-index.json (client-side search data)
 *   - tools/sitemap-tools.xml (standalone sitemap for the new tools)
 *   - index.html              (ONLY the section between the TV-TOOLS-SECTION
 *                              markers is regenerated; nothing else is touched)
 *
 * SAFETY: apart from that one marked homepage section, this script only
 * writes inside tools/ — it never touches other existing site files.
 * Run: node scripts/build-tools.mjs   (from the repo root)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://toolverseusa.github.io/ToolVerse';
// Identical to the GA4 snippet already present on every existing page
// (public — copied verbatim from the site's own HTML into the template).
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const REQUIRED_FIELDS = {
  id: 'string', slug: 'string', title: 'string', metaDescription: 'string',
  category: 'string', keywords: 'array', inputs: 'array', logicRef: 'string',
  faq: 'array', relatedTools: 'array', version: 'string'
};
const PRESENTATION_FIELDS = [
  'categoryLabel', 'contentRef', 'heroBadge', 'heroTitle', 'heroSubtitle',
  'asideBadge', 'asideTitle', 'asideText', 'asideLinkText', 'asideLinkUrl',
  'asideNextTitle', 'asideNextText'
];
const SLUG_RE = /^[a-z0-9-]+$/;

let failures = 0;
const warnings = [];
function fail(msg) { failures++; console.error('  ERROR: ' + msg); }
function warn(msg) { warnings.push(msg); console.error('  warning: ' + msg); }

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function collectJson(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) collectJson(p, out);
    else if (entry.name.endsWith('.json')) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- validation
function validateTool(def, file) {
  for (const [field, type] of Object.entries(REQUIRED_FIELDS)) {
    if (!(field in def)) { fail(`${file}: missing required field "${field}"`); continue; }
    const v = def[field];
    const ok = type === 'array' ? Array.isArray(v) : typeof v === type;
    if (!ok) fail(`${file}: field "${field}" must be ${type}`);
    if (type === 'string' && !v.trim()) fail(`${file}: field "${field}" must not be empty`);
  }
  for (const field of PRESENTATION_FIELDS) {
    if (!(field in def) || !String(def[field]).trim()) fail(`${file}: missing presentation field "${field}"`);
  }
  if (def.slug && !SLUG_RE.test(def.slug)) fail(`${file}: slug "${def.slug}" is not URL-safe`);
  if (def.keywords && def.keywords.length === 0) fail(`${file}: keywords must be non-empty`);
  if (def.title && def.title.length > 70) warn(`${file}: title is ${def.title.length} chars (>70)`);
  if (def.metaDescription && (def.metaDescription.length < 50 || def.metaDescription.length > 160)) {
    warn(`${file}: metaDescription is ${def.metaDescription.length} chars (recommended 50-160)`);
  }
  for (const f of def.faq || []) {
    if (!f.q || !f.a) fail(`${file}: faq entries need "q" and "a"`);
  }
  for (const ref of ['contentRef', 'logicRef']) {
    const target = def[ref];
    if (target && target !== 'inline' && !existsSync(join(ROOT, target))) {
      fail(`${file}: ${ref} target not found: ${target}`);
    }
  }
}

// ------------------------------------------------------------------ rendering
function jsonLdFor(def, url, includeApp = true) {
  const graph = [
    {
      '@type': 'WebPage',
      name: def.title,
      url,
      description: def.metaDescription,
      isPartOf: { '@type': 'WebSite', name: 'ToolVerse', url: SITE_URL + '/' }
    },
    ...(includeApp ? [{
      '@type': 'SoftwareApplication',
      name: def.title.replace(/\s*\|\s*ToolVerse\s*$/, ''),
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      url,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    }] : []),
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: SITE_URL + '/tools/' },
        { '@type': 'ListItem', position: 3, name: def.categoryLabel, item: `${SITE_URL}/tools/${def.category}/` },
        { '@type': 'ListItem', position: 4, name: def.title.replace(/\s*\|\s*ToolVerse\s*$/, ''), item: url }
      ]
    }
  ];
  // FAQPage schema ONLY when actual FAQ content exists
  if (def.faq && def.faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: def.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    });
  }
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}\n</script>`;
}

function ogTagsFor(def, url) {
  return [
    `<meta property="og:site_name" content="ToolVerse">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:title" content="${escAttr(def.title)}">`,
    `<meta property="og:description" content="${escAttr(def.metaDescription)}">`,
    `<meta property="og:url" content="${url}">`
  ].join('\n');
}

function faqSectionHtml(def) {
  if (!def.faq || def.faq.length === 0) return '';
  const items = def.faq
    .map((f) => `<details><summary>${escHtml(f.q)}</summary><p>${escHtml(f.a)}</p></details>`)
    .join('\n');
  return `<section class="faq-section"><h2>Questions people ask</h2>\n${items}\n</section>`;
}

function relatedSectionHtml(def, registry) {
  const rel = (def.relatedTools || []).filter((id) => registry[id]);
  if (rel.length === 0) return '';
  const items = rel
    .map((id) => {
      const t = registry[id];
      const url = `${SITE_URL}/tools/${t.category}/${t.slug}.html`;
      return `<li><a href="${url}">${escHtml(t.title.replace(/\s*\|\s*ToolVerse\s*$/, ''))}</a></li>`;
    })
    .join('\n');
  return `<section><h2>Related tools</h2><ul class="link-list">\n${items}\n</ul></section>`;
}

// ------------------------------------------------------- category pages
// SEO copy for category landing pages. Tool lists themselves always come
// from the tool definitions — this map only holds per-category wording.
// A category without an entry still gets a page (generic copy + warning).
const CATEGORY_META = {
  text: {
    title: 'Free Text & Writing Tools Online | ToolVerse',
    description: 'Free text and writing tools that run in your browser: count words and characters, change text case, and more — no uploads, no sign-up.',
    intro: 'Count, convert and clean up text instantly. Everything runs locally in your browser, so your writing never leaves your device.'
  },
  developer: {
    title: 'Free Developer Tools Online | ToolVerse',
    description: 'Free developer tools that run in your browser: format and validate JSON, encode and decode Base64, and more — your code never leaves your device.',
    intro: 'Small, fast utilities for everyday coding tasks. Paste, convert and validate locally — nothing is sent to a server.'
  },
  calculators: {
    title: 'Free Online Calculators & Converters | ToolVerse',
    description: 'Free online calculators and converters that run in your browser: convert units instantly with no downloads, uploads, or sign-up.',
    intro: 'Quick conversions and calculations with instant results, calculated locally in your browser.'
  },
  image: {
    title: 'Free Image Tools Online | ToolVerse',
    description: 'Free image tools that run in your browser: compress and resize images to reduce file size — your images never leave your device.',
    intro: 'Shrink image file sizes for the web, email and uploads — processed entirely on your device, never uploaded.'
  },
  seo: {
    title: 'Free SEO Tools Online | ToolVerse',
    description: 'Free SEO tools that run in your browser: preview how your pages appear in Google search results and check title and description lengths.',
    intro: 'See your pages the way searchers do, and fix titles and descriptions before you publish.'
  },
  data: {
    title: 'Free Data Tools Online | ToolVerse',
    description: 'Free data tools that run in your browser: convert CSV to JSON and work with structured data — your files never leave your device.',
    intro: 'Convert and reshape structured data in seconds, entirely in your browser.'
  },
  privacy: {
    title: 'Free Privacy & Security Tools Online | ToolVerse',
    description: 'Free privacy and security tools that run in your browser: generate strong random passwords locally — nothing is sent or stored.',
    intro: 'Security tools that work locally by design. Generated values are created on your device and never transmitted or logged.'
  },
  datetime: {
    title: 'Free Date & Time Tools Online | ToolVerse',
    description: 'Free date and time tools that run in your browser: calculate the duration and number of days between two dates instantly, with no sign-up.',
    intro: 'Work out durations, deadlines and days between dates instantly, calculated locally in your browser.'
  }
};

function categoryMeta(slug, label) {
  if (CATEGORY_META[slug]) return CATEGORY_META[slug];
  warn(`category "${slug}" has no CATEGORY_META entry — using generic copy`);
  return {
    title: `Free ${label} Tools Online | ToolVerse`,
    description: `Free ${label} tools that run 100% in your browser — no uploads, no accounts, no sign-up.`,
    intro: `Every ${label} tool below runs entirely in your browser. Nothing is uploaded, stored, or sent anywhere.`
  };
}

function jsonLdCategory(slug, label, meta, tools) {
  const url = `${SITE_URL}/tools/${slug}/`;
  const graph = [
    {
      '@type': 'WebPage',
      name: meta.title,
      url,
      description: meta.description,
      isPartOf: { '@type': 'WebSite', name: 'ToolVerse', url: SITE_URL + '/' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: SITE_URL + '/tools/' },
        { '@type': 'ListItem', position: 3, name: label, item: url }
      ]
    },
    {
      '@type': 'ItemList',
      name: `${label} tools`,
      itemListElement: tools.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.title.replace(/\s*\|\s*ToolVerse\s*$/, ''),
        url: `${SITE_URL}/tools/${t.category}/${t.slug}.html`
      }))
    }
  ];
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}\n</script>`;
}

function renderCategoryPage(slug, cat, allCats, template) {
  const label = cat.label;
  const meta = categoryMeta(slug, label);
  const url = `${SITE_URL}/tools/${slug}/`;

  const cards = cat.tools
    .map((t) => {
      const short = t.title.replace(/\s*\|\s*ToolVerse\s*$/, '');
      const toolUrl = `/ToolVerse/tools/${t.category}/${t.slug}.html`;
      return `<div class="result-grid-card"><h3><a href="${toolUrl}">${escHtml(short)}</a></h3><p>${escHtml(t.metaDescription)}</p><p><a href="${toolUrl}">Use Tool &rarr;</a></p></div>`;
    })
    .join('\n');

  const otherCats = [...allCats.entries()]
    .filter(([s]) => s !== slug)
    .map(([s, c]) => `<li><a href="/ToolVerse/tools/${escAttr(s)}/">${escHtml(c.label)} tools</a></li>`)
    .join('\n');

  const content = `
<p class="disclaimer"><strong>100% private.</strong> Every ${escHtml(label)} tool below runs entirely in your browser — nothing is uploaded, stored, or sent anywhere.</p>
<section class="tool-card calculator-card">
<p class="section-label">${escHtml(label)}</p>
<h2>${escHtml(label)} tools</h2>
<p class="section-intro">${escHtml(meta.intro)}</p>
<div class="result-grid">
${cards}
</div>
</section>
<section><h2>More tool categories</h2><ul class="link-list">
<li><a href="/ToolVerse/tools/">All browser tools</a></li>
${otherCats}
</ul></section>`;

  const catDef = { id: `__cat_${slug}`, title: meta.title, metaDescription: meta.description, categoryLabel: label, category: slug };
  const replacements = {
    '{{PAGE_TITLE}}': `<title>${escHtml(meta.title)}</title>`,
    '{{META_DESCRIPTION}}': `<meta name="description" content="${escAttr(meta.description)}">`,
    '{{TWITTER_TITLE}}': `<meta name="twitter:title" content="${escAttr(meta.title)}">`,
    '{{TWITTER_DESCRIPTION}}': `<meta name="twitter:description" content="${escAttr(meta.description)}">`,
    '{{CANONICAL_LINK}}': `<link rel="canonical" href="${url}">`,
    '{{OG_TAGS}}': ogTagsFor(catDef, url),
    '{{JSON_LD}}': jsonLdCategory(slug, label, meta, cat.tools),
    '{{HERO_BADGE}}': 'Free browser tools',
    '{{HERO_H1}}': `${escHtml(label)} Tools`,
    '{{HERO_SUB}}': escHtml(meta.intro),
    '{{TOOL_CONTENT}}': content,
    '{{ASIDE_BADGE}}': 'Private by design',
    '{{ASIDE_TITLE}}': 'Your data stays on your device',
    '{{ASIDE_TEXT}}': 'ToolVerse browser tools run 100% locally in your browser. Nothing you enter is uploaded, stored, or tracked.',
    '{{ASIDE_LINK_URL}}': '/ToolVerse/tools/',
    '{{ASIDE_LINK_TEXT}}': 'Browse all tools',
    '{{ASIDE_NEXT_TITLE}}': 'Your next step',
    '{{ASIDE_NEXT_TEXT}}': 'Pick a tool above, or explore the full tools hub to search every category.',
    '{{PAGE_SCRIPTS}}': `<script defer src="/ToolVerse/tools/assets/tools-analytics.js"></script>`,
    '{{TOOL_SCRIPT}}': ''
  };
  let out = template;
  // breadcrumb for a category page ends at the category itself
  out = out.replace(
    /<nav class="tool-breadcrumb"[\s\S]*?<\/nav>/,
    `<nav class="tool-breadcrumb" aria-label="Breadcrumb">\n<a href="/ToolVerse/">Home</a> &rsaquo; <a href="/ToolVerse/tools/">Tools</a> &rsaquo; <span aria-current="page">${escHtml(label)}</span>\n</nav>`
  );
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value);
  }
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail(`category ${slug}: unreplaced token ${leftover[0]}`);
  return out;
}

// ------------------------------------------------------- homepage section
// The homepage (index.html) is a protected production file. The generator
// owns ONLY the block between the TV-TOOLS-SECTION markers; on first run
// the block is inserted immediately before the decision-paths section.
const HOME_ANCHOR = '<section id="decision-paths"';

function renderHomepageSection(defs) {
  const cards = defs
    .map((t) => {
      const short = t.title.replace(/\s*\|\s*ToolVerse\s*$/, '');
      return `<a class="focus-ring rounded-2xl border border-white/10 bg-slate-950/25 p-5 transition hover:border-violet-300/40 hover:bg-violet-300/[.06]" href="/ToolVerse/tools/${t.category}/${t.slug}.html"><span class="text-[11px] font-semibold uppercase tracking-[.16em] text-cyan-200">${escHtml(t.categoryLabel)}</span><span class="mt-2 block text-base font-bold text-white">${escHtml(short)}</span><span class="mt-2 block text-sm leading-6 text-slate-400">${escHtml(t.heroSubtitle)}</span><span class="mt-3 block text-sm font-semibold text-cyan-200">Use Tool <span aria-hidden="true">&rarr;</span></span></a>`;
    })
    .join('');
  return `<section id="free-online-tools" class="mx-auto mt-6 max-w-6xl rounded-3xl border border-white/10 bg-white/[.025] p-6 sm:p-8" aria-labelledby="free-online-tools-title"><p class="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Browser tools</p><h2 id="free-online-tools-title" class="mt-3 text-2xl font-bold text-white">Free Online Tools</h2><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Fast, private browser-based tools for text, developer, data, image, SEO, calculations and more. No sign-up required.</p><div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${cards}</div><p class="mt-6 text-sm"><a class="font-semibold text-cyan-200 underline" href="/ToolVerse/tools/">Browse all browser tools <span aria-hidden="true">&rarr;</span></a></p></section>`;
}

function updateHomepageSection(defs, written) {
  const path = join(ROOT, 'index.html');
  let html = readFileSync(path, 'utf8');
  const block =
    `<!-- TV-TOOLS-SECTION:START — generated by scripts/build-tools.mjs from tools-data/; do not hand-edit -->\n` +
    `      ${renderHomepageSection(defs)}\n` +
    `      <!-- TV-TOOLS-SECTION:END -->`;
  if (html.includes('TV-TOOLS-SECTION:START')) {
    html = html.replace(/<!-- TV-TOOLS-SECTION:START[\s\S]*?<!-- TV-TOOLS-SECTION:END -->/, () => block);
  } else if (html.includes(HOME_ANCHOR)) {
    html = html.replace(HOME_ANCHOR, () => `${block}\n      ${HOME_ANCHOR}`);
  } else {
    fail('index.html: TV-TOOLS-SECTION markers and decision-paths anchor both missing — homepage section NOT inserted');
    return;
  }
  writeFileSync(path, html);
  written.push('index.html (Free Online Tools section)');
}

function renderToolPage(def, template, registry) {
  const url = `${SITE_URL}/tools/${def.category}/${def.slug}.html`;
  const content = readFileSync(join(ROOT, def.contentRef), 'utf8');
  const logic = def.logicRef === 'inline' ? '' : readFileSync(join(ROOT, def.logicRef), 'utf8');
  const shortTitle = def.title.replace(/\s*\|\s*ToolVerse\s*$/, '');

  const pageScripts =
    `<script defer src="/ToolVerse/tools/assets/tools-analytics.js"></script>`;
  const toolScript = logic
    ? `<script>\n/* ${def.id} v${def.version} — generated, do not hand-edit */\n${logic}\n</script>`
    : '';

  const replacements = {
    '{{PAGE_TITLE}}': `<title>${escHtml(def.title)}</title>`,
    '{{META_DESCRIPTION}}': `<meta name="description" content="${escAttr(def.metaDescription)}">`,
    '{{TWITTER_TITLE}}': `<meta name="twitter:title" content="${escAttr(def.title)}">`,
    '{{TWITTER_DESCRIPTION}}': `<meta name="twitter:description" content="${escAttr(def.metaDescription)}">`,
    '{{CANONICAL_LINK}}': `<link rel="canonical" href="${url}">`,
    '{{OG_TAGS}}': ogTagsFor(def, url),
    '{{JSON_LD}}': jsonLdFor(def, url),
    '{{HERO_BADGE}}': escHtml(def.heroBadge),
    '{{HERO_H1}}': escHtml(def.heroTitle),
    '{{HERO_SUB}}': escHtml(def.heroSubtitle),
    '{{CATEGORY_SLUG}}': escAttr(def.category),
    '{{CATEGORY_LABEL}}': escHtml(def.categoryLabel),
    '{{TOOL_SHORT_TITLE}}': escHtml(shortTitle),
    '{{TOOL_CONTENT}}': content + '\n' + faqSectionHtml(def) + '\n' + relatedSectionHtml(def, registry),
    '{{ASIDE_BADGE}}': escHtml(def.asideBadge),
    '{{ASIDE_TITLE}}': escHtml(def.asideTitle),
    '{{ASIDE_TEXT}}': escHtml(def.asideText),
    '{{ASIDE_LINK_URL}}': escAttr(def.asideLinkUrl),
    '{{ASIDE_LINK_TEXT}}': escHtml(def.asideLinkText),
    '{{ASIDE_NEXT_TITLE}}': escHtml(def.asideNextTitle),
    '{{ASIDE_NEXT_TEXT}}': escHtml(def.asideNextText),
    '{{PAGE_SCRIPTS}}': pageScripts,
    '{{TOOL_SCRIPT}}': toolScript
  };
  let out = template;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value);
  }
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail(`${def.id}: unreplaced token ${leftover[0]}`);
  return out;
}

// ---------------------------------------------------------------------- main
function main() {
  console.log('ToolVerse tools build — reading definitions…');
  const template = readFileSync(join(ROOT, 'templates', 'tool-shell.html'), 'utf8');
  const files = collectJson(join(ROOT, 'tools-data')).sort();
  if (files.length === 0) fail('no tool definitions found in tools-data/');

  const defs = [];
  for (const f of files) {
    let def;
    try {
      def = JSON.parse(readFileSync(f, 'utf8'));
    } catch (e) {
      fail(`${f}: invalid JSON (${e.message})`);
      continue;
    }
    validateTool(def, f);
    def.__file = f;
    defs.push(def);
  }

  // duplicate detection — build FAILS on duplicates
  for (const key of ['id', 'slug']) {
    const seen = new Map();
    for (const d of defs) {
      if (seen.has(d[key])) fail(`duplicate ${key} "${d[key]}" in ${seen.get(d[key]).__file} and ${d.__file}`);
      seen.set(d[key], d);
    }
  }
  const registry = Object.fromEntries(defs.map((d) => [d.id, d]));
  for (const d of defs) {
    for (const r of d.relatedTools || []) {
      if (!registry[r]) warn(`${d.id}: relatedTools references unknown id "${r}"`);
    }
  }
  if (failures > 0) {
    console.error(`\nBUILD FAILED with ${failures} error(s).`);
    process.exit(1);
  }

  const written = [];
  // tool pages
  for (const d of defs) {
    const html = renderToolPage(d, template, registry);
    const dir = join(ROOT, 'tools', d.category);
    mkdirSync(dir, { recursive: true });
    const outPath = join(dir, `${d.slug}.html`);
    writeFileSync(outPath, html);
    written.push(`tools/${d.category}/${d.slug}.html`);
  }

  // category landing pages (one per category actually used by a tool)
  const byCat = new Map();
  for (const d of defs) {
    if (!byCat.has(d.category)) byCat.set(d.category, { label: d.categoryLabel, tools: [] });
    byCat.get(d.category).tools.push(d);
  }
  for (const [slug, cat] of byCat) {
    const html = renderCategoryPage(slug, cat, byCat, template);
    const dir = join(ROOT, 'tools', slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    written.push(`tools/${slug}/index.html`);
  }

  // hub page
  const hubHtml = renderHub(defs, template);
  mkdirSync(join(ROOT, 'tools'), { recursive: true });
  writeFileSync(join(ROOT, 'tools', 'index.html'), hubHtml);
  written.push('tools/index.html');

  // search index
  const index = defs.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title.replace(/\s*\|\s*ToolVerse\s*$/, ''),
    description: d.metaDescription,
    category: d.category,
    categoryLabel: d.categoryLabel,
    keywords: d.keywords,
    url: `/ToolVerse/tools/${d.category}/${d.slug}.html`
  }));
  writeFileSync(join(ROOT, 'tools', 'search-index.json'), JSON.stringify(index, null, 2) + '\n');
  written.push('tools/search-index.json');

  // standalone sitemap for the new tools (existing sitemap.xml untouched)
  const urls = [
    `${SITE_URL}/tools/`,
    ...[...byCat.keys()].map((slug) => `${SITE_URL}/tools/${slug}/`),
    ...defs.map((d) => `${SITE_URL}/tools/${d.category}/${d.slug}.html`)
  ];
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`;
  writeFileSync(join(ROOT, 'tools', 'sitemap-tools.xml'), sitemap);
  written.push('tools/sitemap-tools.xml');

  // homepage: refresh ONLY the marked Free Online Tools section
  updateHomepageSection(defs, written);

  if (failures > 0) {
    console.error(`\nBUILD FAILED with ${failures} error(s).`);
    process.exit(1);
  }

  console.log(`\nBUILD OK — ${defs.length} tool(s), ${written.length} file(s) written:`);
  for (const w of written) console.log('  + ' + w);
  if (warnings.length > 0) console.log(`\n${warnings.length} warning(s) — see above.`);
}

function renderHub(defs, template) {
  const byCat = new Map();
  for (const d of defs) {
    if (!byCat.has(d.category)) byCat.set(d.category, { label: d.categoryLabel, tools: [] });
    byCat.get(d.category).tools.push(d);
  }
  const sections = [...byCat.entries()]
    .map(([slug, cat]) => {
      const cards = cat.tools
        .map((t) => {
          const short = t.title.replace(/\s*\|\s*ToolVerse\s*$/, '');
          return `<div class="result-grid-card"><h3><a href="/ToolVerse/tools/${t.category}/${t.slug}.html">${escHtml(short)}</a></h3><p>${escHtml(t.metaDescription)}</p></div>`;
        })
        .join('\n');
      return `<section id="cat-${escAttr(slug)}"><h2>${escHtml(cat.label)}</h2><div class="result-grid">\n${cards}\n</div></section>`;
    })
    .join('\n');

  const content = `
<p class="disclaimer"><strong>100% private.</strong> Every tool below runs entirely in your browser — nothing is uploaded, stored, or sent anywhere.</p>
<section class="tool-card calculator-card">
<p class="section-label">ToolVerse Tools</p>
<h2>Find a tool</h2>
<p class="section-intro">Search across all browser tools, or browse by category.</p>
<div class="form-section">
<label for="tools-search-input">Search tools</label>
<div class="tools-search-wrap"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.8-3.8"></path></svg><input class="tools-search-field" id="tools-search-input" type="search" placeholder="Try &quot;word count&quot; or &quot;json&quot;&hellip;" aria-label="Search tools" autocomplete="off"></div>
<div id="tools-search-results" aria-live="polite" style="margin-top:12px"></div>
</div>
</section>
${sections}`;

  const url = `${SITE_URL}/tools/`;
  const title = 'Browser Tools — Free Online Utilities | ToolVerse';
  const desc = 'Browse ToolVerse browser tools: free utilities that run 100% in your browser. Text, developer, calculator tools and more — no uploads, no accounts.';
  const hubDef = {
    id: '__hub__', title, metaDescription: desc, categoryLabel: 'Tools', category: ''
  };
  const replacements = {
    '{{PAGE_TITLE}}': `<title>${escHtml(title)}</title>`,
    '{{META_DESCRIPTION}}': `<meta name="description" content="${escAttr(desc)}">`,
    '{{TWITTER_TITLE}}': `<meta name="twitter:title" content="${escAttr(title)}">`,
    '{{TWITTER_DESCRIPTION}}': `<meta name="twitter:description" content="${escAttr(desc)}">`,
    '{{CANONICAL_LINK}}': `<link rel="canonical" href="${url}">`,
    '{{OG_TAGS}}': ogTagsFor(hubDef, url),
    '{{JSON_LD}}': jsonLdFor({ ...hubDef, faq: [] }, url, false),
    '{{HERO_BADGE}}': 'ToolVerse',
    '{{HERO_H1}}': 'Browser Tools',
    '{{HERO_SUB}}': 'Free utilities that run entirely in your browser. No uploads, no accounts, no tracking of your input.',
    '{{TOOL_CONTENT}}': content,
    '{{ASIDE_BADGE}}': 'Growing library',
    '{{ASIDE_TITLE}}': 'More tools on the way',
    '{{ASIDE_TEXT}}': 'This library is expanding. Every tool runs 100% in your browser.',
    '{{ASIDE_LINK_URL}}': '/ToolVerse/',
    '{{ASIDE_LINK_TEXT}}': 'Back to ToolVerse home',
    '{{ASIDE_NEXT_TITLE}}': 'Your next step',
    '{{ASIDE_NEXT_TEXT}}': 'Pick a category above or search for a tool.',
    '{{PAGE_SCRIPTS}}': `<script defer src="/ToolVerse/tools/assets/tools-analytics.js"></script>\n<script defer src="/ToolVerse/tools/assets/tools-search.js"></script>`,
    '{{TOOL_SCRIPT}}': ''
  };
  let out = template;
  // hub has no category breadcrumb — drop the breadcrumb nav
  out = out.replace(/<nav class="tool-breadcrumb"[\s\S]*?<\/nav>/, '');
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value);
  }
  return out;
}

main();
