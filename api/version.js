import { getLatestRelease } from "./lib/release.js";

export default async function handler(_req, res) {
  return res.status(200).json(await getLatestRelease());
}
