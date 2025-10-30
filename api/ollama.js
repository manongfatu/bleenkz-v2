// Serverless function for proxying to Ollama (optional)
// In production on Vercel, set OLLAMA_URL env var to a reachable Ollama instance,
// e.g. https://your-private-ollama-host or https://<your-domain>/api/ollama via tunnel.
// If not configured, we return 501 so the client gracefully falls back.

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { prompt, model = "llama3.1", options } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const baseUrl = process.env.OLLAMA_URL;
    if (!baseUrl) {
      return res.status(501).json({ error: "OLLAMA_URL not configured in production" });
    }

    const endpoint = String(baseUrl).replace(/\/$/, "") + "/api/generate";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, options: options || { temperature: 0.6 } }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: "Ollama error", detail: text });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy failure", detail: String(err) });
  }
};

