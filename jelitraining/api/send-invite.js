// Vercel serverless function that emails a client an .ics invite for one session.
// POST /api/send-invite  body: { clientId, sessionId, token }
//
// Design notes:
// - The client sends clientId + sessionId only. Server loads the client record from
//   Supabase and uses the stored email — that way a leaked token can't be used to
//   spam arbitrary recipients.
// - Token lives in VITE_INVITE_TOKEN (dual-use, same pattern as VITE_ICAL_FEED_TOKEN):
//   baked into the client bundle because the SPA is already password-gated.
// - Resend FROM must be a verified domain. Until one is set up, the sandbox sender
//   can only deliver to the Resend account owner.

import { buildICal } from "../src/ical-utils.js";

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_KEY;
const INVITE_TOKEN = process.env.VITE_INVITE_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.INVITE_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = process.env.VITE_COACH_FULLNAME || "jelitraining";

const CLIENT_PREFIX = "jeli-client-";

const fullName = (c) => [c?.firstName, c?.lastName].filter(Boolean).join(" ").trim() || "Client";

const formatDateFR = (ymd) => {
  const [y, m, d] = String(ymd).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

const buildHtml = ({ clientName, date, startTime, duration, type, notes, coachName }) => {
  const dateStr = formatDateFR(date);
  const timeStr = startTime ? `${startTime} (${duration} min)` : "(toute la journée)";
  const notesHtml = notes ? `<p style="margin:12px 0;color:#555"><em>${escapeHtml(notes)}</em></p>` : "";
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#222;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 16px">Bonjour ${escapeHtml(clientName)},</h2>
  <p>Voici votre prochaine séance avec ${escapeHtml(coachName)} :</p>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#888">Date</td><td style="padding:4px 0"><strong>${escapeHtml(dateStr)}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#888">Horaire</td><td style="padding:4px 0"><strong>${escapeHtml(timeStr)}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#888">Type</td><td style="padding:4px 0"><strong>${escapeHtml(type || "Séance")}</strong></td></tr>
  </table>
  ${notesHtml}
  <p style="color:#555">Le fichier <code>.ics</code> joint ajoute la séance à votre calendrier (iPhone, Google, Outlook).</p>
  <p style="color:#888;font-size:12px;margin-top:32px">— ${escapeHtml(coachName)}</p>
</body></html>`;
};

const escapeHtml = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!INVITE_TOKEN || !RESEND_API_KEY || !SB_URL || !SB_KEY) {
    return res.status(503).json({ error: "Invite service not configured" });
  }

  const body = req.body || {};
  const { clientId, sessionId, token } = body;

  if (token !== INVITE_TOKEN) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!clientId || !sessionId) {
    return res.status(400).json({ error: "clientId and sessionId are required" });
  }

  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/store?key=eq.${CLIENT_PREFIX}${encodeURIComponent(clientId)}&select=value`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!r.ok) return res.status(502).json({ error: "Upstream error" });
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    let client;
    try { client = JSON.parse(rows[0].value); } catch { return res.status(500).json({ error: "Bad client record" }); }
    if (!client?.email) {
      return res.status(400).json({ error: "Ce client n'a pas d'adresse email." });
    }

    const session = (client.sessions || []).find(s => String(s.id) === String(sessionId));
    if (!session) {
      return res.status(404).json({ error: "Séance introuvable." });
    }

    const clientName = fullName(client);
    const event = {
      sessionId: session.id,
      clientId: client.id,
      clientName,
      date: session.date,
      type: session.type,
      duration: session.duration,
      notes: session.notes,
      startTime: session.startTime || null,
    };

    const icsBody = buildICal([event], { calName: FROM_NAME });
    const icsBase64 = Buffer.from(icsBody, "utf-8").toString("base64");

    const html = buildHtml({
      clientName,
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
      type: session.type,
      notes: session.notes,
      coachName: FROM_NAME,
    });

    const subject = `Séance ${session.type || ""} — ${formatDateFR(session.date)}`.trim();

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [client.email],
        subject,
        html,
        attachments: [
          { filename: "seance.ics", content: icsBase64 },
        ],
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(() => "");
      return res.status(502).json({ error: "Resend error", detail: detail.slice(0, 300) });
    }

    return res.status(200).json({ ok: true, to: client.email });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e).slice(0, 300) });
  }
}
