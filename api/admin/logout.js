import { clearedSessionCookie, destroySession } from "../lib/auth.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    await destroySession(req);
    res.setHeader("Set-Cookie", clearedSessionCookie());
    return res.status(200).json({ ok: true });
}
