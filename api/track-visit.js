import { redis } from "./redis.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    await redis.incr("visits");

    res.status(200).json({ ok: true });
}