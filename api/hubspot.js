export const config = {
  api: { bodyParser: false },
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk.toString('utf8'); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Usa o path RAW da query string sem decodificar
  // req.query.path já é decodificado pelo Next.js — usamos a URL raw
  const rawUrl = req.url || '';
  const pathMatch = rawUrl.match(/[?&]path=([^&]*)/);
  const hsPath = pathMatch ? decodeURIComponent(pathMatch[1]) : '';

  if (!hsPath) return res.status(400).json({ error: 'path required' });

  const url = `https://api.hubapi.com/${hsPath}`;

  let body = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const raw = await readBody(req);
    if (raw && raw.trim()) {
      try {
        JSON.parse(raw);
        body = raw;
      } catch(e) {
        return res.status(400).json({ error: 'Invalid JSON', detail: e.message });
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body } : {}),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
