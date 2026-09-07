import { redis } from "./lib/redis.js";

export default async function handler(req, res) {
    const date = new Date().toISOString().slice(0, 10);
    await redis.incr("downloads");
    await redis.incr(`stats:downloads:${date}`);
    await redis.expire(`stats:downloads:${date}`, 60 * 60 * 24 * 400);

    return res.redirect("../apk/Skaneo-v1.0.2.apk");
}