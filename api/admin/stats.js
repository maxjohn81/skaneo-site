import { isAuthenticated } from "../lib/auth.js";
import { redis } from "../lib/redis.js";

const DAY = 24 * 60 * 60 * 1000;

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (!(await isAuthenticated(req))) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const today = new Date();
  const dates = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today.getTime() - (29 - index) * DAY);
    return dateKey(date);
  });
  const keys = dates.flatMap((date) => [
    `stats:downloads:${date}`,
    `stats:visits:${date}`,
  ]);
  const values = await redis.mget(...keys);
  const series = dates.map((date, index) => ({
    date,
    downloads: Number(values[index * 2] || 0),
    visits: Number(values[index * 2 + 1] || 0),
  }));

  const totals = await redis.mget("downloads", "visits");
  const todayStats = series[series.length - 1];
  const yesterdayStats = series[series.length - 2];

  return res.status(200).json({
    totals: {
      downloads: Number(totals[0] || 0),
      visits: Number(totals[1] || 0),
    },
    today: todayStats,
    yesterday: yesterdayStats,
    last7Days: series.slice(-7).reduce(
      (sum, item) => ({
        downloads: sum.downloads + item.downloads,
        visits: sum.visits + item.visits,
      }),
      { downloads: 0, visits: 0 },
    ),
    last30Days: series.reduce(
      (sum, item) => ({
        downloads: sum.downloads + item.downloads,
        visits: sum.visits + item.visits,
      }),
      { downloads: 0, visits: 0 },
    ),
    series,
  });
}
