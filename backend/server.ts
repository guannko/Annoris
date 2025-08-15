import express from "express";
import search from "./routes/search";
import indexSwap from "./routes/index-swap";

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Brain system routes
app.use("/", search);
app.use("/", indexSwap);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Brain System v2.0 running on port ${PORT}`);
  console.log(`Features: pgvector, hybrid search, blue-green deployment`);
});