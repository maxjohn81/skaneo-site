import { redis } from "./lib/redis.js";

export default async function handler(req, res) {
  const [downloads, visits] = await redis.mget("downloads", "visits");

  res.status(200).json({
    downloads: downloads || 0,
    visits: visits || 0,
  });
}
