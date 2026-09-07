import { randomUUID, timingSafeEqual } from "node:crypto";
import { redis } from "./redis.js";

const SESSION_TTL = 60 * 60 * 24;
const COOKIE_NAME = "skaneo_admin";

function parseCookies(req) {
    return Object.fromEntries(
        (req.headers.cookie || "")
            .split(";")
            .filter(Boolean)
            .map((part) => {
                const index = part.indexOf("=");
                return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
            })
    );
}

function passwordsMatch(input) {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || typeof input !== "string") return false;

    const inputBuffer = Buffer.from(input);
    const expectedBuffer = Buffer.from(expected);
    return inputBuffer.length === expectedBuffer.length &&
        timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function createSession(password) {
    if (!passwordsMatch(password)) return false;

    const token = randomUUID();
    await redis.set(`admin:session:${token}`, "1", { ex: SESSION_TTL });
    return token;
}

export async function isAuthenticated(req) {
    const token = parseCookies(req)[COOKIE_NAME];
    return Boolean(token && await redis.get(`admin:session:${token}`));
}

export async function destroySession(req) {
    const token = parseCookies(req)[COOKIE_NAME];
    if (token) await redis.del(`admin:session:${token}`);
}

export function sessionCookie(token) {
    return `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL}; Path=/; HttpOnly; SameSite=Strict; Secure`;
}

export function clearedSessionCookie() {
    return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict; Secure`;
}
