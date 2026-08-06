import { redis } from "./redis.js";

export default async function handler(req, res) {
    const downloads = await redis.get("downloads");

    res.status(200).json({
        downloads: downloads || 0
    });
}