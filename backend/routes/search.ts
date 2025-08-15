import { Router } from "express";
import { hybridSearch } from "../memory/retrieve";

export default Router().get("/brain/search", async (req, res) => {
  const q = String(req.query.q || "");
  const user = String(req.query.user || "default");
  if (!q) return res.status(400).json({error:"q required"});
  const ctx = await hybridSearch(user, q, 5);
  res.json({ hits: ctx });
});