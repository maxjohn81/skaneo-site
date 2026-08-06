import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const secret = process.env.STATS_SECRET;

  if (!secret || req.query.key !== secret) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const count = (await redis.get("skaneo_downloads")) || 0;
  res.status(200).json({ downloads: count });
}