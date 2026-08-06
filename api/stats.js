import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const secret = process.env.STATS_SECRET;

  if (!secret || req.query.key !== secret) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const count = (await redis.get("skaneo_downloads")) || 0;
  res.status(200).json({ downloads: count });
}