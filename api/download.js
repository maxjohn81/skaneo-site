import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    await redis.incr("skaneo_downloads");
  } catch (err) {
    console.error("Erreur compteur:", err);
  }

  res.writeHead(302, { Location: "/apk/Skaneo-v1.0.0.apk" });
  res.end();
}