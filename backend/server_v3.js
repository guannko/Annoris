// backend/server_v3.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { startPulse } = require("./pulse_worker");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// health
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "annoris-autosave",
    timestamp: new Date().toISOString(),
    pulse: process.env.PULSE_ENABLED === "true" ? "enabled" : "disabled",
  });
});

// autosave
app.post("/autosave", (req, res) => {
  const token = req.headers.authorization || req.body?.token;
  if (token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("Autosave received:", req.body);
  res.json({ success: true });
});

// root
app.get("/", (_req, res) => {
  res.json({
    service: "Annoris Autosave Service",
    version: "3.2",
    endpoints: ["/health", "/autosave"],
    pulse: process.env.PULSE_ENABLED === "true" ? "beating" : "stopped",
  });
});

app.listen(PORT, () => {
  console.log(`Server v3.2 on :${PORT}`);
  startPulse(); // запускаем пульс (теперь точно экспортируется)
});
