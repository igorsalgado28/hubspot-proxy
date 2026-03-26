export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const LUSHA_KEY = 'fe66a1ca-eeef-407b-acbd-0a926105b63a';
  const { action, name, domain, requestId, ids, page } = req.query;

  try {
    let url, payload, method = 'POST';

    if (action === 'companies-search') {
      // Usa prospecting/company/search com searchText — não exige id
      url = 'https://api.lusha.com/prospecting/company/search';
      payload = {
        pages: { page: parseInt(page||'0'), size: 10 },
        filters: { companies: { include: { searchText: String(name||'') } } }
      };

    } else if (action === 'company-enrich') {
      // Enrich após search — requestId e ids vêm como query params
      url = 'https://api.lusha.com/prospecting/company/enrich';
      payload = {
        requestId: String(requestId||''),
        companiesIds: String(ids||'').split(',').filter(Boolean)
      };

    } else if (action === 'contact-search') {
      // Para contact-search lemos o body via stream pois tem filtros complexos
      url = 'https://api.lusha.com/prospecting/contact/search';
      let raw = '';
      await new Promise(r => { req.on('data',c=>raw+=c); req.on('end',r); });
      try { payload = JSON.parse(raw); } catch(e) { payload = {}; }

    } else if (action === 'contact-enrich') {
      url = 'https://api.lusha.com/prospecting/contact/enrich';
      payload = {
        requestId: String(requestId||''),
        contactIds: String(ids||'').split(',').filter(Boolean)
      };

    } else {
      return res.status(400).json({ error: 'Invalid action: ' + action });
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'api_key': LUSHA_KEY },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
