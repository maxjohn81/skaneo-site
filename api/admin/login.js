import {
  clearFailedLogins,
  createSession,
  isLoginRateLimited,
  recordFailedLogin,
  sessionCookie,
} from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  if (await isLoginRateLimited(req)) {
    res.setHeader("Retry-After", "900");
    return res.status(429).json({
      error: "Trop de tentatives. Réessaie dans 15 minutes.",
    });
  }

  const token = await createSession(req.body?.password);
  if (!token) {
    await recordFailedLogin(req);
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  await clearFailedLogins(req);
  res.setHeader("Set-Cookie", sessionCookie(token, req));
  return res.status(200).json({ ok: true });
}
