import { isAuthenticated } from "../lib/auth.js";
import { handleUpload } from "@vercel/blob/client";

export const config = { api: { bodyParser: false } };

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw);
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  if (!(await isAuthenticated(req))) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    const body = await readJson(req);
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^releases\/Skaneo-v\d+\.\d+\.\d+\.apk$/.test(pathname)) {
          throw new Error("Nom de fichier APK invalide.");
        }
        return {
          allowedContentTypes: ["application/vnd.android.package-archive"],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: false,
        };
      },
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error("Direct APK upload token failed", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
    });
    return res.status(400).json({ error: "Impossible de préparer l’upload direct de l’APK." });
  }
}
