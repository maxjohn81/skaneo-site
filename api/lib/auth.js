import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { redis } from "./redis.js";

const SESSION_TTL = 60 * 60 * 24;
const COOKIE_NAME = "skaneo_admin";
const LOGIN_ATTEMPT_TTL = 60 * 15;
const MAX_LOGIN_ATTEMPTS = 5;

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [
          part.slice(0, index).trim(),
          decodeURIComponent(part.slice(index + 1).trim()),
        ];
      }),
  );
}

function passwordsMatch(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== "string") return false;

  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  return (
    inputBuffer.length === expectedBuffer.length &&
    timingSafeEqual(inputBuffer, expectedBuffer)
  );
}

export async function createSession(password) {
  if (!passwordsMatch(password)) return false;

  const token = randomUUID();
  await redis.set(`admin:session:${token}`, "1", { ex: SESSION_TTL });
  return token;
}

export async function isAuthenticated(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  return Boolean(token && (await redis.get(`admin:session:${token}`)));
}

export async function destroySession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (token) await redis.del(`admin:session:${token}`);
}

function loginAttemptKey(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const address = String(forwardedFor || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  const fingerprint = createHash("sha256").update(address).digest("hex");
  return `admin:login-attempts:${fingerprint}`;
}

export async function isLoginRateLimited(req) {
  const attempts = Number((await redis.get(loginAttemptKey(req))) || 0);
  return attempts >= MAX_LOGIN_ATTEMPTS;
}

export async function recordFailedLogin(req) {
  const key = loginAttemptKey(req);
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, LOGIN_ATTEMPT_TTL);
  }
}

export async function clearFailedLogins(req) {
  await redis.del(loginAttemptKey(req));
}

function shouldUseSecureCookie(req) {
  const forwardedProtocol = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  return forwardedProtocol === "https" || process.env.VERCEL === "1";
}

function cookieAttributes(req) {
  const secure = shouldUseSecureCookie(req) ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Strict${secure}`;
}

export function sessionCookie(token, req) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL}; ${cookieAttributes(req)}`;
}

export function clearedSessionCookie(req) {
  return `${COOKIE_NAME}=; Max-Age=0; ${cookieAttributes(req)}`;
}
