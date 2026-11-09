// Fetch remote jobs from the Jobicy free API and cache them as a small JSON file.
// No dependencies. Run with: node scripts/fetch-jobs.mjs
// The API needs no key and returns jobs from the last 7 days, newest first.
// Output keeps only the fields the jobs page needs. The full job description
// is never stored, so the output file stays small.
// On any fetch failure the script retries once after 60 seconds, then exits
// non-zero without touching the existing jobs.json.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://jobicy.com/api/jobs?count=100&geo=usa';
const MAX_JOBS = 150; // Keeps the cached file under the 150 KB target.
const RETRY_DELAY_MS = 60_000;

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = join(REPO_ROOT, 'earn', 'remote-jobs', 'jobs.json');

// Fields kept for each job. jobDescription is deliberately left out.
const KEEP_FIELDS = [
  'id',
  'jobTitle',
  'companyName',
  'companyLogo',
  'jobIndustry',
  'jobType',
  'jobGeo',
  'jobLevel',
  'jobExcerpt',
  'pubDate',
  'salaryMin',
  'salaryMax',
  'salaryCurrency',
  'salaryPeriod',
  'url',
];

function cleanText(value) {
  // The site never uses the em dash character, so replace any that arrive
  // in API data with a comma before storing.
  if (typeof value === 'string') {
    return value.replace(/\s?\u2014\s?/g, ', ');
  }
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item));
  }
  return value;
}

function pickFields(job) {
  const kept = {};
  for (const field of KEEP_FIELDS) {
    if (job[field] !== undefined) {
      kept[field] = cleanText(job[field]);
    }
  }
  return kept;
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'ToolVerse-Jobs-Fetcher' },
  });
  if (!response.ok) {
    throw new Error(`Jobicy API returned HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchAllJobs() {
  const first = await fetchPage(API_URL);
  let jobs = Array.isArray(first.jobs) ? first.jobs : [];

  // Follow one extra page at most, only when the API says there is more
  // and we are still under the job cap.
  if (first.hasMore && first.nextCursor && jobs.length < MAX_JOBS) {
    const nextUrl = String(first.nextCursor).startsWith('http')
      ? String(first.nextCursor)
      : `${API_URL}&cursor=${encodeURIComponent(first.nextCursor)}`;
    const second = await fetchPage(nextUrl);
    if (Array.isArray(second.jobs)) {
      jobs = jobs.concat(second.jobs);
    }
  }

  const seen = new Set();
  const unique = [];
  for (const job of jobs) {
    if (!job || job.id === undefined || job.id === null) continue;
    const key = String(job.id);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(pickFields(job));
  }

  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return unique.slice(0, MAX_JOBS);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let jobs;
  try {
    jobs = await fetchAllJobs();
  } catch (error) {
    console.error(`First fetch failed: ${error.message}`);
    console.error('Retrying once after 60 seconds.');
    await sleep(RETRY_DELAY_MS);
    // A failed retry throws here and exits non-zero, leaving the
    // existing jobs.json untouched.
    jobs = await fetchAllJobs();
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'Jobicy',
    count: jobs.length,
    jobs,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
  console.log(`Wrote ${jobs.length} jobs to ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(`Failed to fetch jobs: ${error.message}`);
  process.exit(1);
});
