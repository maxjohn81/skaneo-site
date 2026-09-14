import { getLatestRelease } from "./lib/release.js";

export default async function handler(_req, res) {
  const release = await getLatestRelease();
  const { blobUrl, ...publicRelease } = release;
  return res.status(200).json(publicRelease);
}
