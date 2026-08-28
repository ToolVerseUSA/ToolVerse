const FEDERAL_PLATFORM_STATES = new Set([
  'AL','AK','AZ','DE','FL','HI','IN','IA','KS','LA','MI','MS','MO','MT','NE','NH','NC','ND','OH','SC','SD','TN','TX','UT','WV','WI','WY','AR','OK','OR'
]);

const json = (res, status, body) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', 'https://toolverseusa.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(status).json(body);
};

const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const firstFinite = (...values) => values.map(finite).find((value) => value !== null) ?? null;
const firstString = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || null;

function findField(value, names, depth = 0) {
  if (!value || depth > 5 || typeof value !== 'object') return null;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(value, name)) return value[name];
  }
  for (const child of Object.values(value)) {
    const result = findField(child, names, depth + 1);
    if (result !== null && result !== undefined) return result;
  }
  return null;
}

function extractBenchmark(payload) {
  const direct = firstFinite(
    findField(payload, ['slcsp', 'slcsp_premium', 'benchmark_premium', 'benchmarkPremium', 'second_lowest_cost_silver_premium']),
    findField(payload, ['aptc_benchmark_premium', 'monthly_benchmark_premium'])
  );
  if (direct !== null && direct >= 0) return { premium: direct, source: 'CMS Marketplace eligibility estimate' };

  const plans = Array.isArray(payload?.plans) ? payload.plans : Array.isArray(payload?.data?.plans) ? payload.data.plans : Array.isArray(payload?.results) ? payload.results : [];
  const silver = plans.map((plan) => {
    const metal = String(plan.metal_level ?? plan.metalLevel ?? plan.metal ?? plan.plan_metal_level ?? '').toLowerCase();
    const premium = firstFinite(plan.premium, plan.monthly_premium, plan.premium_amount, plan.total_premium, plan.premiums?.monthly);
    return { metal, premium };
  }).filter((plan) => plan.premium !== null && plan.premium >= 0 && metalIsSilver(plan.metal)).sort((a, b) => a.premium - b.premium);
  if (silver.length >= 2) return { premium: silver[1].premium, source: 'CMS Marketplace plan search; second-lowest returned Silver premium' };
  if (silver.length === 1) return { premium: silver[0].premium, source: 'CMS Marketplace plan search; only one returned Silver premium' };
  return null;
}

function metalIsSilver(metal) {
  return /silver/.test(metal) || metal === '2';
}

async function cmsJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  if (!response.ok) {
    const error = new Error(`CMS request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' });

  const apiKey = process.env.CMS_MARKETPLACE_API_KEY || process.env.MARKETPLACE_API_KEY;
  if (!apiKey) return json(res, 503, { code: 'lookup_not_configured', message: 'Automatic Marketplace lookup is not configured yet. Use the advanced manual benchmark option.' });

  const body = req.body || {};
  const state = String(body.state || '').toUpperCase();
  const zip = String(body.zip || '').replace(/\D/g, '').slice(0, 5);
  const householdSize = Number(body.householdSize);
  const ages = Array.isArray(body.ages) ? body.ages.map(Number).filter(Number.isFinite) : [];
  const income = Number(body.income);
  const year = Number(body.year || 2026);
  if (!/^[A-Z]{2}$/.test(state) || !/^\d{5}$/.test(zip) || !Number.isInteger(householdSize) || householdSize < 1 || householdSize > 14 || !ages.length || ages.length > 14 || ages.some((age) => age < 0 || age > 120) || !Number.isFinite(income) || income < 0 || year !== 2026) {
    return json(res, 400, { code: 'invalid_input', message: 'Enter a valid 5-digit ZIP code, coverage household ages, household size, nonnegative MAGI, and 2026 coverage year.' });
  }
  if (ages.length !== householdSize) return json(res, 400, { code: 'age_count_mismatch', message: 'Provide one age for each person in the Marketplace coverage household.' });
  if (!FEDERAL_PLATFORM_STATES.has(state)) return json(res, 422, { code: 'state_data_unavailable', message: 'Automatic CMS lookup is currently available only for federal-platform states. Use the official state Marketplace or the advanced manual benchmark option.', marketplaceType: 'SBM' });

  try {
    const root = 'https://marketplace.api.healthcare.gov/api/v1';
    const countyPayload = await cmsJson(`${root}/counties/by/zip/${zip}?apikey=${encodeURIComponent(apiKey)}`);
    const countyItems = Array.isArray(countyPayload) ? countyPayload : countyPayload?.counties || countyPayload?.data || [];
    const county = countyItems.find((item) => String(item.state || item.state_code || state).toUpperCase() === state) || countyItems[0];
    const countyFips = String(county?.fips || county?.countyfips || county?.county_fips || county?.fips_code || '').replace(/\D/g, '');
    if (!countyFips) return json(res, 422, { code: 'county_not_resolved', message: 'The official CMS service did not return a county FIPS code for this ZIP/state combination.' });

    const people = ages.map((age, index) => ({ age, aptc_eligible: true, uses_tobacco: false, relationship: index === 0 ? 'Self' : undefined }));
    const household = { income, people };
    const requestBody = { household, market: 'Individual', place: { countyfips: countyFips, state, zipcode: zip }, year };
    let estimate = null;
    try {
      estimate = await cmsJson(`${root}/households/eligibility/estimates?apikey=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    } catch (error) {
      if (error.status !== 404 && error.status !== 405) throw error;
    }
    if (!estimate) estimate = await cmsJson(`${root}/plans/search?apikey=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    const benchmark = extractBenchmark(estimate);
    if (!benchmark) return json(res, 422, { code: 'benchmark_not_found', message: 'The official CMS response did not provide enough plan data to identify a benchmark Silver premium for this scenario.', countyFips, marketplaceType: 'FFM/SBE-FP' });
    return json(res, 200, { ok: true, benchmarkPremium: benchmark.premium, source: benchmark.source, dataYear: year, countyFips, state, marketplaceType: 'FFM/SBE-FP', retrievedAt: new Date().toISOString().slice(0, 10) });
  } catch (error) {
    const status = error.status === 429 ? 429 : 502;
    return json(res, status, { code: status === 429 ? 'rate_limited' : 'lookup_failed', message: 'The official Marketplace lookup could not be completed. Use the manual benchmark option or verify plans on HealthCare.gov.' });
  }
}
