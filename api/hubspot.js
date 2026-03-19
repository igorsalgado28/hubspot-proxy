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

  // Extrai o path da URL raw para preservar query strings internas
  const rawUrl = req.url || '';
  const pathMatch = rawUrl.match(/[?&]path=([^&]*)/);
  const rawPath = pathMatch ? pathMatch[1] : '';
  const hsPath = decodeURIComponent(rawPath);

  if (!hsPath) return res.status(400).json({ error: 'path required' });

  // Endpoint especial: busca empresa por name ou domain sem body
  // GET /api/hubspot?path=find-company&name=BTG pactual&domain=btgpactual.com
  if (hsPath === 'find-company') {
    const name = req.query.name || '';
    const domain = req.query.domain || '';
    try {
      const results = [];
      // Busca por domain exato
      if (domain) {
        const r = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/search`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }], properties: ['name', 'domain'], limit: 1 })
        });
        const d = await r.json();
        if (d.results?.length) return res.status(200).json({ id: d.results[0].id, name: d.results[0].properties.name });
      }
      // Busca por name exato
      if (name) {
        for (const val of [name, name.toUpperCase(), name.toLowerCase()]) {
          const r = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/search`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'name', operator: 'EQ', value: val }] }], properties: ['name', 'domain'], limit: 1 })
          });
          const d = await r.json();
          if (d.results?.length) return res.status(200).json({ id: d.results[0].id, name: d.results[0].properties.name });
        }
      }
      return res.status(200).json({ id: null });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Endpoint especial: busca contatos por domínio de email
  // GET /api/hubspot?path=find-contacts&domain=btgpactual.com
  if (hsPath === 'find-contacts') {
    const domain = req.query.domain || '';
    if (!domain) return res.status(200).json({ ids: [] });
    try {
      const r = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'email', operator: 'CONTAINS_TOKEN', value: `@${domain}` }] }], properties: ['email'], limit: 20 })
      });
      const d = await r.json();
      const ids = (d.results || []).filter(c => (c.properties?.email || '').toLowerCase().endsWith('@' + domain)).map(c => c.id);
      return res.status(200).json({ ids });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Proxy genérico para todas as outras chamadas
  const url = `https://api.hubapi.com/${hsPath}`;
  let body = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const raw = await readBody(req);
    if (raw && raw.trim()) {
      try { JSON.parse(raw); body = raw; } catch(e) {
        return res.status(400).json({ error: 'Invalid JSON', detail: e.message });
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
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
