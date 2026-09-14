import { Readable } from "node:stream";
import { get } from "@vercel/blob";
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

  if (!release.blobUrl) {
    return res.redirect(release.url);
  }

  try {
    const result = await get(release.blobUrl, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200) {
      return res.status(404).json({ error: "APK introuvable" });
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", result.blob.contentType);
    res.setHeader("Content-Length", String(result.blob.size));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${release.filename}"`,
    );
    res.setHeader("Cache-Control", "public, max-age=300");
    Readable.fromWeb(result.stream).pipe(res);
  } catch (error) {
    console.error("Private APK download failed", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
    });
    return res.status(502).json({ error: "Le téléchargement de l'APK est indisponible" });
  }
}
