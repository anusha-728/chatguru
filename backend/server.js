import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// ✔ Local network IP detection
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const details of iface) {
      if (details.family === "IPv4" && !details.internal) {
        return details.address;
      }
    }
  }
  return "localhost";
}

// Available Ollama models
const availableModels = ["llava:latest", "mistral:7b", "phi3", "gemma:2b"];

// Endpoint: Models list
app.get("/api/models", (req, res) => {
  res.json({ models: availableModels });
});

// Chat endpoint (Ollama)
app.post("/api/chat", async (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt)
    return res.status(400).json({ error: "Prompt is required" });

  const selectedModel = availableModels.includes(model) ? model : "llama3";

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Ollama error:", text);
      return res.status(500).json({ error: text });
    }

    const data = await response.json();
    res.json({ response: data.response, model: selectedModel });

  } catch (err) {
    console.error("Ollama connection error:", err);
    res.status(500).json({
      error: "Cannot reach Ollama. Run: ollama serve"
    });
  }
});

const PORT = 3000;

// ✔ LISTEN on ALL networks
app.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIPAddress();
  console.log("=====================================");
  console.log("AI Chatbot Server Started!");
  console.log(`Local access:     http://localhost:${PORT}`);
  console.log(`Phone access:     http://${ip}:${PORT}`);
  console.log("=====================================");
  console.log("Make sure Ollama is running: ollama serve");
});
