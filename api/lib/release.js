import { redis } from "./redis.js";

export const RELEASE_KEY = "mobile:latest-release";
export const RELEASE_VERSION_KEY = "mobile:release:version";
export const INITIAL_RELEASE_VERSION = "1.0.3";
export const INITIAL_RELEASE = {
  version: INITIAL_RELEASE_VERSION,
  url: "https://skaneo.vercel.app/api/download",
  filename: "Aucune publication APK",
  notes: "",
  source: "initial",
};

export async function getLatestRelease() {
  const stored = await redis.get(RELEASE_KEY);
  if (stored) return typeof stored === "string" ? JSON.parse(stored) : stored;
  return INITIAL_RELEASE;
}

export async function getReleaseHistory() {
  const values = await redis.lrange("mobile:release-history", 0, 19);
  return values.map((value) => (typeof value === "string" ? JSON.parse(value) : value));
}

export function incrementVersion(version) {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10));
  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    throw new Error("Version actuelle invalide");
  }

  let [major, minor, patch] = parts;
  patch += 1;

  if (patch > 9) {
    patch = 0;
    minor += 1;
  }

  if (minor > 9) {
    minor = 0;
    major += 1;
  }

  return `${major}.${minor}.${patch}`;
}
