export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const hsPath = req.query.path || "";
  const url = `https://api.hubapi.com/${hsPath}`;

  // Lê o body raw para garantir que o JSON chega intacto
  let rawBody = "";
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => { data += chunk.toString(); });
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${process.env.HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      ...(rawBody ? { body: rawBody } : {}),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
