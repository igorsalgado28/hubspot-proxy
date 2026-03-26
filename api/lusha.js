export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const LUSHA_KEY = 'fe66a1ca-eeef-407b-acbd-0a926105b63a';
  const { action, name, domain } = req.query;

  try {
    let url, payload;

    if (action === 'companies-search') {
      // Usa query params para evitar problema de body parsing no Vercel
      // name e domain vêm como ?name=Nubank&action=companies-search
      url = 'https://api.lusha.com/v2/company';
      const co = {};
      if (name) co.name = String(name);
      if (domain) co.domain = String(domain);
      payload = { companies: [co] };

    } else if (action === 'contact-search') {
      url = 'https://api.lusha.com/prospecting/contact/search';
      // Body ainda vem via POST para contact-search (tem filtros complexos)
      let body = '';
      await new Promise(r => {
        req.on('data', c => body += c);
        req.on('end', r);
      });
      try { payload = JSON.parse(body); } catch(e) { payload = {}; }

    } else if (action === 'contact-enrich') {
      url = 'https://api.lusha.com/prospecting/contact/enrich';
      let body = '';
      await new Promise(r => {
        req.on('data', c => body += c);
        req.on('end', r);
      });
      try { payload = JSON.parse(body); } catch(e) { payload = {}; }

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
