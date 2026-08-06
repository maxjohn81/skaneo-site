import { redis } from "./redis.js";

export default async function handler(req, res) {
    await redis.incr("downloads");

    return res.redirect("../apk/Skaneo-v1.0.0.apk");
}