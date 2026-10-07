#!/usr/bin/env node
/**
 * ToolVerse browser-tools static generator (zero-framework).
 * Phases 1–2: tool pages, hub, search index, tools sitemap.
 * Phase 3: category landing pages + the marked "Free Online Tools"
 * section on the homepage.
 * Phase 4 (system upgrade, structure modelled on the reference tools-site
 * architecture — taxonomy, card system, hub layout — in the ToolVerse theme):
 * category display registry, compact tool cards, hub restructure (category
 * grid with counts, popular row, why tiles, FAQ, separate Financial Tools
 * zone), an A–Z all-tools page at tools/all/, related-tools card grids,
 * share blocks and "When NOT to use" sections on tool pages.
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
  // Explicit relatedTools first, then same-category tools, capped at 4 —
  // rendered as compact cards (Phase 4 card system).
  const seen = new Set([def.id]);
  const picked = [];
  for (const id of def.relatedTools || []) {
    if (registry[id] && !seen.has(id)) { picked.push(registry[id]); seen.add(id); }
  }
  for (const t of Object.values(registry)) {
    if (picked.length >= 4) break;
    if (t.category === def.category && !seen.has(t.id)) { picked.push(t); seen.add(t.id); }
  }
  if (picked.length === 0) return '';
  const cards = picked.map((t) => toolCard(t)).join('\n');
  return `<section><h2>Related tools</h2><div class="tv-card-grid">\n${cards}\n</div></section>`;
}

function whenNotToUseHtml(def) {
  if (!def.whenNotToUse || def.whenNotToUse.length === 0) return '';
  const items = def.whenNotToUse.map((x) => `<li>${escHtml(x)}</li>`).join('\n');
  const short = def.heroTitle || def.title.replace(/\s*\|\s*ToolVerse\s*$/, '');
  return `<section><h2>When NOT to use ${escHtml(short)}</h2><ul>\n${items}\n</ul></section>`;
}

function shareSectionHtml() {
  return `<section class="tv-share"><h2>Share this tool</h2><p>Found it useful? Share it with someone who needs it — the tool is free and runs entirely in the browser.</p><p><button type="button" class="tv-share-btn" data-share-tool>Share / copy link</button> <span class="tv-share-note" data-share-note aria-live="polite"></span></p></section>
<script>
(function(){var b=document.querySelector('[data-share-tool]');if(!b)return;var n=document.querySelector('[data-share-note]');b.addEventListener('click',function(){var url=window.location.href;function done(msg){if(n)n.textContent=msg;}if(navigator.share){navigator.share({title:document.title,url:url}).then(function(){done('Thanks for sharing.');}).catch(function(){});}else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){done('Link copied to clipboard.');}).catch(function(){done('Copy this page URL from the address bar to share.');});}else{done('Copy this page URL from the address bar to share.');}});})();
</script>`;
}

// ------------------------------------------- category display registry
// Display taxonomy for the hub / category grid / all-tools page, modelled on
// the reference architecture's 12 categories. Slugs for categories that
// already exist are UNCHANGED (their URLs must not move); display labels
// live here only — tool pages keep each definition's own categoryLabel.
// Categories with no tools yet appear as "coming soon" chips, never as
// empty landing pages.
const CATEGORY_DISPLAY = [
  { slug: 'pdf', label: 'PDF Tools', blurb: 'Merge, split, compress and convert PDF files — entirely in your browser.', icon: 'file' },
  { slug: 'image', label: 'Image Tools', blurb: 'Compress, resize and convert images. Processed on your device, never uploaded.', icon: 'image' },
  { slug: 'text', label: 'Text & Writing Tools', blurb: 'Word counters, case converters and text cleaners for writers, students and marketers.', icon: 'text' },
  { slug: 'file-converters', label: 'File & Format Converters', blurb: 'Convert documents, data and media formats without installing software.', icon: 'convert' },
  { slug: 'developer', label: 'Developer Tools', blurb: 'JSON and Base64 formatters, encoders and validators for everyday coding tasks.', icon: 'code' },
  { slug: 'seo', label: 'SEO & Website Tools', blurb: 'SERP previews and on-page checks — fix titles and descriptions before you publish.', icon: 'chart' },
  { slug: 'social-media', label: 'Social Media Tools', blurb: 'Character counters, caption and hashtag helpers for every platform.', icon: 'share' },
  { slug: 'generators', label: 'Generators', blurb: 'Passwords, names, UUIDs, QR codes and more — generated locally, instantly.', icon: 'sparkles' },
  { slug: 'ai', label: 'AI Tools', blurb: 'Smart writing helpers for summarizing, rephrasing and drafting content faster.', icon: 'bot' },
  { slug: 'video-audio', label: 'Video & Audio Tools', blurb: 'Trim, convert and compress media files right in your browser.', icon: 'video' },
  { slug: 'color-design', label: 'Color & Design Tools', blurb: 'Palettes, contrast checkers and gradient makers for designers.', icon: 'palette' },
  { slug: 'privacy', label: 'Security & Privacy Tools', blurb: 'Password generators and privacy-first utilities that never transmit or store your data.', icon: 'shield' },
  { slug: 'data', label: 'Data Tools', blurb: 'Convert CSV to JSON and reshape structured data in seconds.', icon: 'data' },
  { slug: 'datetime', label: 'Date & Time Tools', blurb: 'Durations, deadlines and days between dates, calculated instantly.', icon: 'clock' },
  { slug: 'calculators', label: 'Converters & Calculators', blurb: 'Quick unit conversions and calculations with instant local results.', icon: 'calc' }
];
const DISPLAY_BY_SLUG = Object.fromEntries(CATEGORY_DISPLAY.map((c) => [c.slug, c]));

const ICON_PATHS = {
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  text: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  convert: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  code: '<path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4"/><path d="M15.4 6.5l-6.8 4"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M9 17h6"/>',
  video: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/><path d="M12 21a2.5 2.5 0 0 1-2-4c.8-.3 2-.8 2-2"/>',
  shield: '<path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 15h.01"/><path d="M12 15h.01"/><path d="M16 15h.01"/>'
};
function iconSvg(name) {
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ICON_PATHS.file}</svg>`;
}

// Curated "most popular" tools (hub row + card badge). Order = display order.
const POPULAR_IDS = ['word-counter', 'json-formatter', 'image-compressor', 'password-generator', 'unit-converter', 'serp-preview'];
// Homepage featured grid = POPULAR_IDS + NEWEST_IDS (12 cards max, approved
// 2026-10-07 so index.html stays comfortably below the push size limit no
// matter how many tools exist). Update NEWEST_IDS with each Phase B batch.
const NEWEST_IDS = ['qr-code-generator', 'random-number-generator', 'lottery-number-generator', 'random-picker', 'username-generator', 'dice-roller'];

// Compact tool card (Phase 4 card system — ToolVerse theme). Whole card is
// the link: name + category label, optional one-line description variant,
// optional Popular badge.
function toolCard(t, opts = {}) {
  const short = t.title.replace(/\s*\|\s*ToolVerse\s*$/, '');
  const url = `/ToolVerse/tools/${t.category}/${t.slug}.html`;
  const badge = POPULAR_IDS.includes(t.id) ? '<span class="tv-badge tv-badge-popular">Popular</span>' : '';
  const desc = opts.desc ? `<span class="tv-tool-card-desc">${escHtml(t.metaDescription)}</span>` : '';
  return `<a class="tv-tool-card" href="${url}"><span class="tv-tool-card-main"><span class="tv-tool-card-name">${escHtml(short)}</span><span class="tv-tool-card-cat">${escHtml(t.categoryLabel)}</span>${desc}</span>${badge}</a>`;
}

// Category grid card: gradient icon tile + name + blurb + live count.
function categoryCard(disp, count) {
  return `<a class="tv-cat-card" href="/ToolVerse/tools/${escAttr(disp.slug)}/"><span class="tv-cat-icon tv-cat-icon--${escAttr(disp.slug)}">${iconSvg(disp.icon)}</span><span class="tv-cat-card-name">${escHtml(disp.label)}</span><span class="tv-cat-card-blurb">${escHtml(disp.blurb)}</span><span class="tv-cat-card-count">${count} free tool${count === 1 ? '' : 's'} &rarr;</span></a>`;
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
  },
  generators: {
    title: 'Free Random Generators Online | ToolVerse',
    description: 'Free generators that run in your browser with cryptographic randomness: random numbers, dice, coin flips, lottery quick picks, names, usernames, QR codes and more — nothing is uploaded or stored.',
    intro: 'Every generator below uses your browser\u2019s cryptographic RNG for fair, unbiased results — generated locally on your device, never sent anywhere.'
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
    .map((t) => toolCard(t, { desc: true }))
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
<div class="tv-card-grid">
${cards}
</div>
</section>
<section><h2>More tool categories</h2><ul class="link-list">
<li><a href="/ToolVerse/tools/">All browser tools</a></li>
<li><a href="/ToolVerse/tools/all/">All tools A&ndash;Z</a></li>
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
  const counts = new Map();
  for (const t of defs) counts.set(t.category, (counts.get(t.category) || 0) + 1);
  const catChips = CATEGORY_DISPLAY
    .filter((c) => counts.has(c.slug))
    .map((c) => `<a class="focus-ring rounded-full border border-white/10 bg-slate-950/25 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:text-white" href="/ToolVerse/tools/${c.slug}/">${escHtml(c.label)} <span class="text-cyan-200">&middot; ${counts.get(c.slug)}</span></a>`)
    .join('');
  const byId = new Map(defs.map((t) => [t.id, t]));
  const featuredIds = [];
  for (const id of [...POPULAR_IDS, ...NEWEST_IDS]) {
    if (byId.has(id) && !featuredIds.includes(id)) featuredIds.push(id);
  }
  const homeCard = (t) => {
    const short = t.title.replace(/\s*\|\s*ToolVerse\s*$/, '');
    return `<a class="focus-ring rounded-2xl border border-white/10 bg-slate-950/25 p-5 transition hover:border-violet-300/40 hover:bg-violet-300/[.06]" href="/ToolVerse/tools/${t.category}/${t.slug}.html"><span class="text-[11px] font-semibold uppercase tracking-[.16em] text-cyan-200">${escHtml(t.categoryLabel)}</span><span class="mt-2 block text-base font-bold text-white">${escHtml(short)}</span><span class="mt-2 block text-sm leading-6 text-slate-400">${escHtml(t.heroSubtitle)}</span><span class="mt-3 block text-sm font-semibold text-cyan-200">Use Tool <span aria-hidden="true">&rarr;</span></span></a>`;
  };
  const cards = featuredIds.map((id) => homeCard(byId.get(id))).join('');
  const viewAllCard = `<a class="focus-ring mt-4 block rounded-2xl border border-dashed border-cyan-300/40 bg-cyan-300/[.04] p-5 text-center transition hover:border-cyan-300/70 hover:bg-cyan-300/[.08]" href="/ToolVerse/tools/all/"><span class="text-base font-bold text-white">View All ${defs.length} Tools <span aria-hidden="true">&rarr;</span></span><span class="mt-1 block text-sm text-slate-400">Every browser tool, A&ndash;Z &mdash; plus the full hub with live search.</span></a>`;
  const toolsSection = `<section id="free-online-tools" class="mx-auto mt-6 max-w-6xl rounded-3xl border border-white/10 bg-white/[.025] p-6 sm:p-8" aria-labelledby="free-online-tools-title"><p class="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Browser tools</p><h2 id="free-online-tools-title" class="mt-3 text-2xl font-bold text-white">Free Online Tools</h2><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Fast, private browser-based tools for text, developer, data, image, SEO, calculations and more. No sign-up required.</p><div class="mt-5 flex flex-wrap gap-2">${catChips}</div><div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>${viewAllCard}<p class="mt-6 text-sm"><a class="font-semibold text-cyan-200 underline" href="/ToolVerse/tools/">Browse all browser tools <span aria-hidden="true">&rarr;</span></a> <span class="text-slate-500">&middot;</span> <a class="font-semibold text-cyan-200 underline" href="/ToolVerse/tools/all/">All tools A&ndash;Z <span aria-hidden="true">&rarr;</span></a></p></section>`;
  // Financial Tools is a SEPARATE section of ToolVerse USA — it is rendered
  // as its own panel inside the generated block and never merged with the
  // browser-tools grid above.
  const finLinks = [
    ['Affordability Calculator', 'Start with income, rent, debt, and expenses.', '/ToolVerse/index.html#calculator'],
    ['Salary Needed for Rent', 'Work backward from a rent target.', '/ToolVerse/salary-needed-for-rent-calculator.html'],
    ['Mortgage Payment', 'Estimate principal, interest, taxes and insurance.', '/ToolVerse/mortgage-payment-calculator.html'],
    ['Rent vs Buy', 'Compare entered renting and buying assumptions.', '/ToolVerse/rent-vs-buy-calculator.html']
  ].map(([name, sub, url]) => `<a class="focus-ring rounded-2xl border border-emerald-300/20 bg-slate-950/25 p-5 transition hover:border-emerald-300/50 hover:bg-emerald-300/[.05]" href="${url}"><span class="block text-base font-bold text-white">${name}</span><span class="mt-2 block text-sm leading-6 text-slate-400">${sub}</span><span class="mt-3 block text-sm font-semibold text-emerald-200">Open Calculator <span aria-hidden="true">&rarr;</span></span></a>`).join('');
  const finSection = `<section id="financial-tools" class="mx-auto mt-6 max-w-6xl rounded-3xl border border-emerald-300/20 bg-white/[.025] p-6 sm:p-8" aria-labelledby="financial-tools-title"><p class="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Financial Tools</p><h2 id="financial-tools-title" class="mt-3 text-2xl font-bold text-white">Financial Tools &amp; Calculators</h2><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">ToolVerse USA&rsquo;s money calculators live in their own section — separate from the browser tools above. Rent affordability, salary, mortgage and everyday U.S. money decisions, always free planning estimates.</p><div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${finLinks}</div><p class="mt-6 text-sm"><a class="font-semibold text-emerald-200 underline" href="/ToolVerse/all-categories.html">Explore all financial calculators <span aria-hidden="true">&rarr;</span></a></p></section>`;
  return toolsSection + '\n' + finSection;
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
    '{{TOOL_CONTENT}}': content + '\n' + whenNotToUseHtml(def) + '\n' + faqSectionHtml(def) + '\n' + relatedSectionHtml(def, registry) + '\n' + shareSectionHtml(),
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

  // all-tools A–Z index page
  const allHtml = renderAllToolsPage(defs, template);
  mkdirSync(join(ROOT, 'tools', 'all'), { recursive: true });
  writeFileSync(join(ROOT, 'tools', 'all', 'index.html'), allHtml);
  written.push('tools/all/index.html');

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
    `${SITE_URL}/tools/all/`,
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

// ------------------------------------------------------------- all-tools page
function jsonLdAllTools(defs) {
  const url = `${SITE_URL}/tools/all/`;
  const graph = [
    {
      '@type': 'WebPage',
      name: 'All Browser Tools A–Z | ToolVerse',
      url,
      description: 'Every ToolVerse browser tool in one A–Z list, grouped by category. All tools run 100% in your browser — free, no sign-up.',
      isPartOf: { '@type': 'WebSite', name: 'ToolVerse', url: SITE_URL + '/' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: SITE_URL + '/tools/' },
        { '@type': 'ListItem', position: 3, name: 'All Tools A–Z', item: url }
      ]
    },
    {
      '@type': 'ItemList',
      name: 'All ToolVerse browser tools',
      itemListElement: defs.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.title.replace(/\s*\|\s*ToolVerse\s*$/, ''),
        url: `${SITE_URL}/tools/${t.category}/${t.slug}.html`
      }))
    }
  ];
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}\n</script>`;
}

function renderAllToolsPage(defs, template) {
  const byCat = new Map();
  for (const d of defs) {
    if (!byCat.has(d.category)) byCat.set(d.category, []);
    byCat.get(d.category).push(d);
  }
  const groups = CATEGORY_DISPLAY
    .filter((c) => byCat.has(c.slug))
    .map((c) => {
      const tools = byCat.get(c.slug);
      const cards = tools.map((t) => toolCard(t, { desc: true })).join('\n');
      return `<section id="all-${escAttr(c.slug)}"><h2>${escHtml(c.label)} <span class="tv-count-note">(${tools.length})</span></h2><div class="tv-card-grid">\n${cards}\n</div><p><a href="/ToolVerse/tools/${escAttr(c.slug)}/">Open the ${escHtml(c.label)} category page &rarr;</a></p></section>`;
    })
    .join('\n');

  const content = `
<p class="disclaimer"><strong>100% private.</strong> Every tool below runs entirely in your browser — nothing is uploaded, stored, or sent anywhere.</p>
<section class="tool-card calculator-card">
<p class="section-label">ToolVerse Tools</p>
<h2>All tools, grouped by category</h2>
<p class="section-intro">${defs.length} free browser tools across ${byCat.size} categories. Looking for the money calculators? Those live in the separate <a href="/ToolVerse/all-categories.html">Financial Tools</a> section.</p>
</section>
${groups}`;

  const url = `${SITE_URL}/tools/all/`;
  const title = 'All Browser Tools A–Z | ToolVerse';
  const desc = 'Every ToolVerse browser tool in one list, grouped by category: text, developer, image, SEO, data, privacy, date and converter tools — free, private, no sign-up.';
  const pageDef = { id: '__all__', title, metaDescription: desc, categoryLabel: 'Tools', category: 'all' };
  const replacements = {
    '{{PAGE_TITLE}}': `<title>${escHtml(title)}</title>`,
    '{{META_DESCRIPTION}}': `<meta name="description" content="${escAttr(desc)}">`,
    '{{TWITTER_TITLE}}': `<meta name="twitter:title" content="${escAttr(title)}">`,
    '{{TWITTER_DESCRIPTION}}': `<meta name="twitter:description" content="${escAttr(desc)}">`,
    '{{CANONICAL_LINK}}': `<link rel="canonical" href="${url}">`,
    '{{OG_TAGS}}': ogTagsFor(pageDef, url),
    '{{JSON_LD}}': jsonLdAllTools(defs),
    '{{HERO_BADGE}}': 'ToolVerse Tools',
    '{{HERO_H1}}': 'All Tools A–Z',
    '{{HERO_SUB}}': 'The complete ToolVerse browser-tools library in one place, grouped by category.',
    '{{TOOL_CONTENT}}': content,
    '{{ASIDE_BADGE}}': 'Private by design',
    '{{ASIDE_TITLE}}': 'Your data stays on your device',
    '{{ASIDE_TEXT}}': 'ToolVerse browser tools run 100% locally in your browser. Nothing you enter is uploaded, stored, or tracked.',
    '{{ASIDE_LINK_URL}}': '/ToolVerse/tools/',
    '{{ASIDE_LINK_TEXT}}': 'Browse the tools hub',
    '{{ASIDE_NEXT_TITLE}}': 'Your next step',
    '{{ASIDE_NEXT_TEXT}}': 'Pick a tool from the list, or use the hub search to find one by name or keyword.',
    '{{PAGE_SCRIPTS}}': `<script defer src="/ToolVerse/tools/assets/tools-analytics.js"></script>`,
    '{{TOOL_SCRIPT}}': ''
  };
  let out = template;
  out = out.replace(
    /<nav class="tool-breadcrumb"[\s\S]*?<\/nav>/,
    `<nav class="tool-breadcrumb" aria-label="Breadcrumb">\n<a href="/ToolVerse/">Home</a> &rsaquo; <a href="/ToolVerse/tools/">Tools</a> &rsaquo; <span aria-current="page">All Tools A&ndash;Z</span>\n</nav>`
  );
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value);
  }
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail(`all-tools: unreplaced token ${leftover[0]}`);
  return out;
}

// ---------------------------------------------------------------------- hub
function renderHub(defs, template) {
  const byCat = new Map();
  for (const d of defs) {
    if (!byCat.has(d.category)) byCat.set(d.category, { label: d.categoryLabel, tools: [] });
    byCat.get(d.category).tools.push(d);
  }
  const registry = Object.fromEntries(defs.map((d) => [d.id, d]));

  // Browse-by-category grid (live categories) + coming-soon card (planned)
  const liveDisplays = CATEGORY_DISPLAY.filter((c) => byCat.has(c.slug));
  const plannedDisplays = CATEGORY_DISPLAY.filter((c) => !byCat.has(c.slug));
  const catCards = liveDisplays
    .map((c) => categoryCard(c, byCat.get(c.slug).tools.length))
    .join('\n');
  const plannedChips = plannedDisplays
    .map((c) => `<span class="tv-soon-chip">${escHtml(c.label)}</span>`)
    .join('');
  const soonCard = plannedDisplays.length
    ? `<div class="tv-cat-card tv-cat-card--soon"><span class="tv-cat-card-name">More categories on the way</span><span class="tv-cat-card-blurb">The library keeps growing. These categories are in the works:</span><span class="tv-soon-chips">${plannedChips}</span></div>`
    : '';

  // Most popular row
  const popularCards = POPULAR_IDS.filter((id) => registry[id]).map((id) => toolCard(registry[id])).join('\n');

  // Per-category compact sections (existing anchors preserved)
  const sections = [...byCat.entries()]
    .map(([slug, cat]) => {
      const cards = cat.tools.map((t) => toolCard(t, { desc: true })).join('\n');
      return `<section id="cat-${escAttr(slug)}"><h2>${escHtml(cat.label)}</h2><div class="tv-card-grid">\n${cards}\n</div><p><a href="/ToolVerse/tools/${escAttr(slug)}/">View all ${escHtml(cat.label)} tools &rarr;</a></p></section>`;
    })
    .join('\n');

  const content = `
<p class="disclaimer"><strong>100% private.</strong> Every tool below runs entirely in your browser — nothing is uploaded, stored, or sent anywhere.</p>
<section class="tool-card calculator-card">
<p class="section-label">ToolVerse Tools</p>
<h2>Find a tool</h2>
<p class="section-intro">Search across all browser tools, or browse by category below.</p>
<div class="form-section">
<label for="tools-search-input">Search tools</label>
<div class="tools-search-wrap"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.8-3.8"></path></svg><input class="tools-search-field" id="tools-search-input" type="search" placeholder="Try &quot;word count&quot; or &quot;json&quot;&hellip;" aria-label="Search tools" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="tools-search-results"><div id="tools-search-results" class="tv-search-results" aria-live="polite"></div></div>
</div>
</section>
<section>
<p class="section-label">Categories</p>
<h2>Browse by category</h2>
<p class="section-intro">${liveDisplays.length} categories, ${defs.length} tools — all free.</p>
<div class="tv-cat-grid">
${catCards}
${soonCard}
</div>
</section>
<section>
<p class="section-label">Start here</p>
<h2>Most popular tools</h2>
<p class="section-intro">The tools people reach for first.</p>
<div class="tv-card-grid">
${popularCards}
</div>
</section>
${sections}
<section>
<p class="section-label">Why ToolVerse tools</p>
<h2>Built to respect your data</h2>
<div class="tv-why-grid">
<div class="tv-why-tile"><h3>Privacy-first</h3><p>Every tool processes everything in your browser, so your text and files never leave your device — and are never stored.</p></div>
<div class="tv-why-tile"><h3>No sign-up, ever</h3><p>No accounts, no emails, no trials. Open a tool and use it — that is the whole process.</p></div>
<div class="tv-why-tile"><h3>Fast by design</h3><p>Lightweight static pages with no uploads and no waiting on a server. Results appear as you type.</p></div>
<div class="tv-why-tile"><h3>Works on any device</h3><p>Every tool works on phones, tablets and desktops. No app to install.</p></div>
</div>
</section>
<section class="tv-fin-panel">
<p class="section-label">Financial Tools</p>
<h2>Financial Tools &amp; Calculators</h2>
<p class="section-intro">ToolVerse USA&rsquo;s money calculators live in their own separate section — they are not part of the browser-tools library above.</p>
<ul class="link-list">
<li><a href="/ToolVerse/index.html#calculator">Affordability Calculator</a> — start with income, rent, debt, and expenses</li>
<li><a href="/ToolVerse/salary-needed-for-rent-calculator.html">Salary Needed for Rent</a> — work backward from a rent target</li>
<li><a href="/ToolVerse/mortgage-payment-calculator.html">Mortgage Payment</a> — principal, interest, taxes and insurance</li>
<li><a href="/ToolVerse/rent-vs-buy-calculator.html">Rent vs Buy</a> — compare renting and buying assumptions</li>
<li><a href="/ToolVerse/all-categories.html">All financial calculators &amp; categories</a></li>
</ul>
</section>
<section class="faq-section"><h2>Questions people ask</h2>
<details><summary>Are the tools really free?</summary><p>Yes — every browser tool is free to use, with no trials, watermarks, or feature locks.</p></details>
<details><summary>Do I need to create an account?</summary><p>No. There are no accounts on ToolVerse. Open a tool and use it straight away.</p></details>
<details><summary>Are my files or text uploaded to your servers?</summary><p>No. The tools run entirely in your browser using JavaScript, so what you enter never leaves your device.</p></details>
<details><summary>Do the tools work on my phone?</summary><p>Yes — every tool is responsive and works on phones, tablets, and desktops.</p></details>
</section>
<section>
<h2>Browse everything at once</h2>
<p>Prefer one long list? The <a href="/ToolVerse/tools/all/">All Tools A&ndash;Z</a> page shows every browser tool grouped by category.</p>
</section>`;

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
