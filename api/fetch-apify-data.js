const ACTOR_ID = 'apify~hello-world';
const ALLOWED_ORIGIN = 'https://toolverseusa.github.io';

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(body);
}

async function apifyJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.APIFY_API_TOKEN}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error('Apify request failed');
    error.status = response.status;
    throw error;
  }
  return body;
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { code: 'method_not_allowed' });
  if (!process.env.APIFY_API_TOKEN) return json(res, 503, { code: 'apify_not_configured' });

  try {
    const runPayload = await apifyJson(`https://api.apify.com/v2/actors/${ACTOR_ID}/runs?waitForFinish=120`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ToolVerse connectivity test' }),
    });
    const run = runPayload?.data || {};
    const datasetId = typeof run.defaultDatasetId === 'string' ? run.defaultDatasetId : '';
    if (!datasetId) return json(res, 502, { code: 'dataset_unavailable' });

    const datasetPayload = await apifyJson(`https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?clean=true&limit=1`);
    const items = Array.isArray(datasetPayload) ? datasetPayload : [];
    const first = items[0] || {};
    return json(res, 200, {
      ok: true,
      actor: 'apify/hello-world',
      runStatus: typeof run.status === 'string' ? run.status : 'UNKNOWN',
      datasetRetrieved: true,
      itemCount: items.length,
      outputMessage: typeof first.message === 'string' ? first.message.slice(0, 80) : null,
    });
  } catch (error) {
    const status = error?.status === 401 || error?.status === 403 ? 502 : 502;
    return json(res, status, { code: 'apify_request_failed' });
  }
}

export { handler };
