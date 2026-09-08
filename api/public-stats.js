import { redis } from "./lib/redis.js";

export default async function handler(req, res) {
  const [downloads, visits] = await redis.mget("downloads", "visits");
  return res.status(200).json({
    downloads: Number(downloads || 0),
    visits: Number(visits || 0),
  });
}
