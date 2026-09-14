import { put } from "@vercel/blob";
import formidable from "formidable";
import { readFile } from "node:fs/promises";
import { isAuthenticated } from "../lib/auth.js";
import {
  getLatestRelease,
  getReleaseHistory,
  incrementVersion,
  INITIAL_RELEASE_VERSION,
  RELEASE_KEY,
} from "../lib/release.js";
import { redis } from "../lib/redis.js";

export const config = { api: { bodyParser: false } };
const MAX_APK_SIZE = 200 * 1024 * 1024;

function firstField(value) {
  return Array.isArray(value) ? value[0] : value;
}

function firstFile(value) {
  return Array.isArray(value) ? value[0] : value;
}

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
      filename !== expectedFilename ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > MAX_APK_SIZE
    ) {
      return res.status(400).json({ error: "Les informations de publication sont invalides." });
    }

    const release = {
      version,
      url: `${String(req.headers["x-forwarded-proto"] || "https").split(",")[0]}://${String(req.headers["x-forwarded-host"] || req.headers.host).split(",")[0]}/api/download`,
      filename,
      notes: typeof notes === "string" ? notes.trim().slice(0, 500) : "",
      size,
      publishedAt: new Date().toISOString(),
      blobUrl,
    };
    await redis.set(RELEASE_KEY, JSON.stringify(release));
    await redis.lpush("mobile:release-history", JSON.stringify(release));
    await redis.ltrim("mobile:release-history", 0, 19);
    return res.status(201).json(release);
  }

  const form = formidable({ maxFileSize: MAX_APK_SIZE, multiples: false });
  let fields;
  let files;
  try {
    [fields, files] = await form.parse(req);
  } catch (error) {
    const message = error?.code === "ETOOBIG"
      ? "Le fichier APK ne doit pas dépasser 200 Mo."
      : "Impossible de lire le fichier envoyé.";
    return res.status(400).json({ error: message });
  }

  const apk = firstFile(files.apk);
  if (!apk?.filepath) {
    return res.status(400).json({ error: "Sélectionne un fichier APK." });
  }
  if (!apk.originalFilename?.toLowerCase().endsWith(".apk")) {
    return res.status(400).json({ error: "Le fichier doit être au format APK." });
  }

  const current = await getLatestRelease();
  const version = incrementVersion(current?.version || INITIAL_RELEASE_VERSION);
  const filename = `Skaneo-v${version}.apk`;
  let blob;
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: "La configuration Vercel Blob est absente du serveur." });
    }
    const apkData = await readFile(apk.filepath);
    blob = await put(`releases/${filename}`, apkData, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: "application/vnd.android.package-archive",
    });
  } catch (error) {
    console.error("APK blob upload failed", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });
    return res.status(502).json({
      error: "Le stockage de l’APK est indisponible. Vérifie BLOB_READ_WRITE_TOKEN dans Vercel.",
    });
  }

  const release = {
    version,
    url: `${String(req.headers["x-forwarded-proto"] || "https").split(",")[0]}://${req.headers.host}/api/download`,
    blobUrl: blob.url,
    filename,
    notes: String(firstField(fields.notes) || "").trim().slice(0, 500),
    size: apk.size,
    publishedAt: new Date().toISOString(),
  };
  await redis.set(RELEASE_KEY, JSON.stringify(release));
  await redis.lpush("mobile:release-history", JSON.stringify(release));
  await redis.ltrim("mobile:release-history", 0, 19);
  return res.status(201).json(release);
}
