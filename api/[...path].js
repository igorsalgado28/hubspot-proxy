export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "path required" });

  const hsPath = Array.isArray(path) ? path.join("/") : path;
  const url = `https://api.hubapi.com/${hsPath}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${process.env.HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      ...(["POST","PUT","PATCH"].includes(req.method) && req.body
        ? { body: JSON.stringify(req.body) }
        : {}),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
