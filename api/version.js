import { getLatestRelease } from "./lib/release.js";
import { redis } from "./lib/redis.js";

export default async function handler(req, res) {
  const release = await getLatestRelease();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "skaneo.vercel.app")
    .split(",")[0]
    .trim();
  const protocol = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const { blobUrl, ...publicRelease } = release;
  const downloads = await redis.get("downloads");
  return res.status(200).json({
    ...publicRelease,
    url: `${protocol}://${host}/api/download`,
    downloads: Number(downloads || 0),
  });
}
