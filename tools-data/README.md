# Tool Definition Schema (Phase 1)

Each browser tool is defined by **one JSON file** in `tools-data/<category>/<slug>.json`.
The build script (`scripts/build-tools.mjs`) validates every file and generates
the static HTML page at `tools/<category>/<slug>.html`. No page is ever
hand-written.

## Required fields (build FAILS if missing or mistyped)

| Field | Type | Rule |
|---|---|---|
| `id` | string | Unique across all tools. `fail` on duplicate. |
| `slug` | string | Unique, URL-safe: `^[a-z0-9-]+$`. `fail` on duplicate or bad format. |
| `title` | string | Full `<title>` incl. `\| ToolVerse` suffix. Warning if > 70 chars. |
| `metaDescription` | string | 50–160 chars recommended. Warning outside range. |
| `category` | string | URL slug of the category, e.g. `text`. |
| `keywords` | string[] | Non-empty. Used for search index + meta keywords. |
| `inputs` | array | Input schema (documentation + future form generation). May be `[]`. |
| `logicRef` | string | Path to the tool's JS logic, or `"inline"`. File must exist. |
| `faq` | array | `{q, a}` objects. May be `[]`. FAQPage schema is generated **only** when non-empty. |
| `relatedTools` | string[] | Ids of related tools. Warning (not fail) if an id is unknown. |
| `version` | string | Semver-ish, e.g. `"1.0.0"`. |

## Presentation fields (required for rendering)

| Field | Purpose |
|---|---|
| `categoryLabel` | Human-readable category, e.g. `Text & Writing` |
| `contentRef` | Path to the tool UI HTML fragment (inserted into `<main>`) |
| `heroBadge`, `heroTitle`, `heroSubtitle` | Hero section |
| `asideBadge`, `asideTitle`, `asideText`, `asideLinkText`, `asideLinkUrl`, `asideNextTitle`, `asideNextText` | Side card |

## Rules enforced by the build

1. Duplicate `id` or `slug` → **build fails**.
2. Missing required field or wrong type → **build fails**.
3. Referenced `contentRef`/`logicRef` file missing → **build fails**.
4. `relatedTools` pointing at unknown id → warning only.
5. `title` > 70 chars or `metaDescription` outside 50–160 → warning only.

## Categories (Phase 1 pilot uses 3 of the 12 planned)

`text` (Text & Writing), `developer` (Developer / Code), `calculators` (Calculators).
Future: `pdf`, `image`, `seo`, `file`, `data`, `social`, `datetime`, `web`, `privacy`.
