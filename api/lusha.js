export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const LUSHA_KEY = '431634ed-795f-40cc-8398-ae0dc0ec931f';
  const { action } = req.query;
  
  try {
    let url, body, method = 'POST';

    if (action === 'company-search') {
      url = 'https://api.lusha.com/prospecting/company/search';
      body = req.body;
    } else if (action === 'company-enrich') {
      url = 'https://api.lusha.com/prospecting/company/enrich';
      body = req.body;
    } else if (action === 'contact-search') {
      url = 'https://api.lusha.com/prospecting/contact/search';
      body = req.body;
    } else if (action === 'contact-enrich') {
      url = 'https://api.lusha.com/prospecting/contact/enrich';
      body = req.body;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url, {
      method,
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
