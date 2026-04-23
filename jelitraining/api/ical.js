// Vercel serverless function that serves an .ics subscription feed for iPhone / iCloud Calendar.
// URL shape: /api/ical?token=<VITE_ICAL_FEED_TOKEN>
//
// iOS subscribed calendars can't send auth headers, so the token lives in the URL.
// Treat the URL itself as a secret and don't paste it publicly.

import { flattenSessions } from "../src/calendar-utils.js";
import { buildICal } from "../src/ical-utils.js";

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_KEY;
const FEED_TOKEN = process.env.VITE_ICAL_FEED_TOKEN;
const CAL_NAME = process.env.VITE_COACH_FULLNAME || "jelitraining";

const CLIENT_PREFIX = "jeli-client-";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method Not Allowed");
  }

  if (!FEED_TOKEN) {
    return res.status(503).send("Calendar feed not configured");
  }

  const token = (req.query && req.query.token) || "";
  if (token !== FEED_TOKEN) {
    return res.status(403).send("Forbidden");
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(503).send("Database not configured");
  }

  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/store?key=like.${CLIENT_PREFIX}%25&select=value`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!r.ok) return res.status(502).send("Upstream error");
    const rows = await r.json();
    const clients = (Array.isArray(rows) ? rows : [])
      .map(row => { try { return JSON.parse(row.value); } catch { return null; } })
      .filter(Boolean);

    const events = flattenSessions(clients);
    const body = buildICal(events, { calName: CAL_NAME });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Content-Disposition", 'inline; filename="jelitraining.ics"');
    return res.status(200).send(body);
  } catch {
    return res.status(500).send("Error generating feed");
  }
}
