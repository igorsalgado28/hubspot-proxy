export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const LUSHA_KEY = 'fe66a1ca-eeef-407b-acbd-0a926105b63a';
  const { action } = req.query;

  // Debug: retorna o body recebido para diagnosticar
  if (action === 'debug') {
    return res.status(200).json({
      body: req.body,
      bodyType: typeof req.body,
      headers: req.headers['content-type']
    });
  }

  try {
    let url;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }
    if (!body) body = {};

    if (action === 'companies-search') {
      // /v2/company — envia exatamente {companies:[{name}]} sem campo id
      url = 'https://api.lusha.com/v2/company';
      // Limpa o body: só name, domain, fqdn — NUNCA id (causa o erro)
      if (body.companies) {
        body = {
          companies: body.companies.map(c => {
            const obj = {};
            if (c.name) obj.name = String(c.name);
            if (c.domain) obj.domain = String(c.domain);
            if (c.fqdn) obj.fqdn = String(c.fqdn);
            // NÃO incluir id — é o que causa o erro "must be a string"
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
      headers: {
        'Content-Type': 'application/json',
        'api_key': LUSHA_KEY
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
