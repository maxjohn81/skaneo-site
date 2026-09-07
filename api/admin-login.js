import { createSession, sessionCookie } from "./_auth.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const token = await createSession(req.body?.password);
    if (!token) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    res.setHeader("Set-Cookie", sessionCookie(token));
    return res.status(200).json({ ok: true });
}
