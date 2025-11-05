const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Static files (serve the Bleenkz app)
app.use(express.static(__dirname));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Proxy to Ollama
app.post("/api/ollama", async (req, res) => {
  try {
    const { prompt, model = "llama3.1", options } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: options || { temperature: 0.6 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: "Ollama error", detail: text });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy failure", detail: String(err) });
  }
});

// Serve the app cockpit at /app
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "app.html"));
});

// Fallback to index.html for direct file opens
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[Bleenkz] Server running on http://localhost:${PORT}`);
});
