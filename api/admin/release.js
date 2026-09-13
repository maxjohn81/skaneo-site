import { isAuthenticated } from "../lib/auth.js";
import {
  getLatestRelease,
  getReleaseHistory,
  incrementVersion,
  INITIAL_RELEASE_VERSION,
  RELEASE_KEY,
} from "../lib/release.js";
import { redis } from "../lib/redis.js";

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!(await isAuthenticated(req))) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    return res.status(200).json({
      latest: await getLatestRelease(),
      history: await getReleaseHistory(),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  if (!(await isAuthenticated(req))) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  if (req.headers["content-type"]?.includes("application/json")) {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return res.status(400).json({ error: "Corps de requête JSON invalide." });
    }
    const { blobUrl, filename, notes, size } = body;
    const current = await getLatestRelease();
    const version = incrementVersion(current?.version || INITIAL_RELEASE_VERSION);
    const expectedFilename = `Skaneo-v${version}.apk`;

    if (
      typeof blobUrl !== "string" ||
      !/^https:\/\/.*\.public\.blob\.vercel-storage\.com\//.test(blobUrl) ||
      filename !== expectedFilename
    ) {
      return res.status(400).json({ error: "Les informations de publication sont invalides." });
    }

    const release = {
      version,
      url: blobUrl,
      filename,
      notes: typeof notes === "string" ? notes.trim().slice(0, 500) : "",
      size: Number.isFinite(size) ? size : null,
      publishedAt: new Date().toISOString(),
    };

    await redis.set(RELEASE_KEY, JSON.stringify(release));
    await redis.lpush("mobile:release-history", JSON.stringify(release));
    await redis.ltrim("mobile:release-history", 0, 19);
    return res.status(201).json(release);
  }

  return res.status(400).json({ error: "Utilise le flux d’upload direct Blob." });
}
