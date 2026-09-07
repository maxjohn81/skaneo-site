import { redis } from "./redis.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const date = new Date().toISOString().slice(0, 10);
    await redis.incr("visits");
    await redis.incr(`stats:visits:${date}`);
    await redis.expire(`stats:visits:${date}`, 60 * 60 * 24 * 400);

    res.status(200).json({ ok: true });
}