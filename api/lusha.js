export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const LUSHA_KEY = 'fe66a1ca-eeef-407b-acbd-0a926105b63a';
  const { action } = req.query;

  try {
    let url, body;

    if (action === 'companies-search') {
      // POST /v2/company — enrichment by name/domain, returns rich data directly
      // Body: { companies: [{name, domain, fqdn}] }
      url = 'https://api.lusha.com/v2/company';
      body = req.body;

    } else if (action === 'contact-search') {
      // POST /prospecting/contact/search
      url = 'https://api.lusha.com/prospecting/contact/search';
      body = req.body;

    } else if (action === 'contact-enrich') {
      // POST /prospecting/contact/enrich
      // Body: { requestId, contactIds: [string] }
      url = 'https://api.lusha.com/prospecting/contact/enrich';
      body = req.body;

    } else if (action === 'company-search') {
      // POST /prospecting/company/search
      url = 'https://api.lusha.com/prospecting/company/search';
      body = req.body;

    } else if (action === 'company-enrich') {
      // POST /prospecting/company/enrich
      url = 'https://api.lusha.com/prospecting/company/enrich';
      body = req.body;

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

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
