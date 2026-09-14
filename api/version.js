import { getLatestRelease } from "./lib/release.js";
import { redis } from "./lib/redis.js";

export default async function handler(_req, res) {
  const release = await getLatestRelease();
  const { blobUrl, ...publicRelease } = release;
  const downloads = await redis.get("downloads");
  return res.status(200).json({
    ...publicRelease,
    downloads: Number(downloads || 0),
  });
}
