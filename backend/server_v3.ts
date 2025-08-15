// backend/server_v3.ts
// Server with autosave_v3 and timezone support
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import autosaveV3 from "./routes/autosave_v3";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Logging middleware
app.use((req, res, next) => {
  const offset = parseInt(process.env.TIMEZONE_OFFSET || "3");
  const localTime = new Date(Date.now() + offset * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19) + ` UTC+${offset}`;
  console.log(`${localTime} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/", autosaveV3);  // USING V3 WITH TIMEZONE!

// Health check
app.get("/health", (req, res) => {
  const offset = parseInt(process.env.TIMEZONE_OFFSET || "3");
  const localTime = new Date(Date.now() + offset * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19) + ` UTC+${offset}`;
    
  res.json({
    service: "Annoris Backend",
    version: "3.0.0",
    status: "operational",
    local_time: localTime,
    timezone: `UTC+${offset}`,
    env: {
      has_github_token: !!process.env.GITHUB_TOKEN,
      has_auth_token: !!process.env.AUTH_TOKEN,
      timezone_offset: offset,
      repos: {
        annoris: process.env.GITHUB_REPO_ANNORIS || "guannko/Annoris",
        eyes: process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com"
      }
    }
  });
});

// Root endpoint
app.get("/", (req, res) => {
  const offset = parseInt(process.env.TIMEZONE_OFFSET || "3");
  const localTime = new Date(Date.now() + offset * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19) + ` UTC+${offset}`;
    
  res.json({
    service: "Annoris Backend",
    version: "3.0.0",
    status: "operational",
    time: localTime,
    endpoints: {
      autosave: "POST /autosave",
      health: "GET /health",
      autosave_health: "GET /autosave/health"
    },
    message: "Autosave v3 with timezone support active!"
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  const offset = parseInt(process.env.TIMEZONE_OFFSET || "3");
  console.log(`🚀 Annoris Backend v3 running on port ${PORT}`);
  console.log(`🕐 Timezone: UTC+${offset}`);
  console.log(`📁 Repos: ${process.env.GITHUB_REPO_ANNORIS || "guannko/Annoris"} / ${process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com"}`);
  console.log(`✅ Autosave v3 with local time support active!`);
});

export default app;