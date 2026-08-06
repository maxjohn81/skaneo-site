import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    await redis.incr("skaneo_downloads");
  } catch (err) {
    console.error("Erreur compteur:", err);
  }

  res.writeHead(302, { Location: "/apk/Skaneo-v1.0.0.apk" });
  res.end();
}