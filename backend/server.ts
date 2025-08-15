import express from "express";
import search from "./routes/search";
import indexSwap from "./routes/index-swap";
import autosave from "./routes/autosave_v2";

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    features: ["pgvector", "hybrid-search", "blue-green", "autosave"],
  });
});

// Brain system routes
app.use("/", search);
app.use("/", indexSwap);
app.use("/", autosave);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Brain System v2.0 running on port ${PORT}`);
  console.log(`Features: pgvector, hybrid search, blue-green, autosave`);
  console.log(`ENV required: DATABASE_URL, OPENAI_API_KEY, REDIS_URL, AUTH_TOKEN`);
  console.log(`GitHub ENV: GITHUB_TOKEN, GITHUB_REPO, GITHUB_PATH`);
});