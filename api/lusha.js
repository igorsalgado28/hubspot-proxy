export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const LUSHA_KEY = 'fe66a1ca-eeef-407b-acbd-0a926105b63a';
  const { action } = req.query;

  // Lê o body manualmente via stream (garante leitura em qualquer contexto Vercel)
  async function readBody(req) {
    return new Promise((resolve) => {
      if (req.body && typeof req.body === 'object') {
        resolve(req.body);
        return;
      }
      let data = '';
      req.on('data', chunk => { data += chunk.toString(); });
      req.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({}); }
      });
      req.on('error', () => resolve({}));
    });
  }

  if (action === 'debug') {
    const body = await readBody(req);
    return res.status(200).json({ body, bodyType: typeof body, raw: JSON.stringify(body) });
  }

  try {
    const body = await readBody(req);
    let url;
    let payload = body;

    if (action === 'companies-search') {
      url = 'https://api.lusha.com/v2/company';
      // Limpa o body — só name, domain, fqdn. NUNCA id (causa erro "must be a string")
      if (payload.companies) {
        payload = {
          companies: payload.companies.map(c => {
            const obj = {};
            if (c.name) obj.name = String(c.name);
            if (c.domain) obj.domain = String(c.domain);
            if (c.fqdn) obj.fqdn = String(c.fqdn);
            return obj;
          })
        };
      }
    } else if (action === 'contact-search') {
      url = 'https://api.lusha.com/prospecting/contact/search';
    } else if (action === 'contact-enrich') {
      url = 'https://api.lusha.com/prospecting/contact/enrich';
    } else if (action === 'company-enrich') {
      url = 'https://api.lusha.com/prospecting/company/enrich';
    } else {
      return res.status(400).json({ error: 'Invalid action: ' + action });
    }

    const response = await fetch(url, {
      method: 'POST',
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
