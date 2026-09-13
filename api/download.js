import { redis } from "./lib/redis.js";
import { getLatestRelease } from "./lib/release.js";

export default async function handler(req, res) {
  const date = new Date().toISOString().slice(0, 10);
  await redis.incr("downloads");
  await redis.incr(`stats:downloads:${date}`);
  await redis.expire(`stats:downloads:${date}`, 60 * 60 * 24 * 400);

  const release = await getLatestRelease();
  if (release.source === "initial") {
    return res.status(404).json({ error: "Aucun APK n'est encore publié" });
  }
  return res.redirect(release.url);
}
