export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const LUSHA_KEY = 'fe66a1ca-eeef-407b-acbd-0a926105b63a';
  const { action } = req.query;

  try {
    let url;

    if (action === 'companies-search') {
      // Busca por nome via prospecting — usa searchText ou names
      url = 'https://api.lusha.com/prospecting/company/search';
    } else if (action === 'company-enrich') {
      url = 'https://api.lusha.com/prospecting/company/enrich';
    } else if (action === 'contact-search') {
      url = 'https://api.lusha.com/prospecting/contact/search';
    } else if (action === 'contact-enrich') {
      url = 'https://api.lusha.com/prospecting/contact/enrich';
    } else {
      return res.status(400).json({ error: 'Invalid action: ' + action });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
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
