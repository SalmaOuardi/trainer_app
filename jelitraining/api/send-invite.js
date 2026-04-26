// Vercel serverless function that emails a client an .ics invite for one session.
// POST /api/send-invite  body: { clientId, sessionId, token }
//
// Design notes:
// - The client sends clientId + sessionId only. Server loads the client record from
//   Supabase and uses the stored email — that way a leaked token can't be used to
//   spam arbitrary recipients.
// - Token lives in VITE_INVITE_TOKEN (dual-use, same pattern as VITE_ICAL_FEED_TOKEN):
//   baked into the client bundle because the SPA is already password-gated.
// - Email body (HTML, plain-text, subject, preheader) lives in src/email-template.js
//   so it stays unit-testable and the function stays thin.

import { buildICal } from "../src/ical-utils.js";
import {
  buildHtml,
  buildText,
  buildSubject,
  buildPreheader,
} from "../src/email-template.js";

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_KEY;
const INVITE_TOKEN = process.env.VITE_INVITE_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.INVITE_FROM_EMAIL || "onboarding@resend.dev";
const REPLY_TO = process.env.INVITE_REPLY_TO_EMAIL || "";
const FROM_NAME = process.env.VITE_COACH_FULLNAME || "jelitraining";
const WHATSAPP_URL = process.env.COACH_WHATSAPP_URL || "";
const WHATSAPP_DISPLAY = process.env.COACH_WHATSAPP_DISPLAY || "";

const CLIENT_PREFIX = "jeli-client-";

const fullName = (c) => [c?.firstName, c?.lastName].filter(Boolean).join(" ").trim() || "Client";

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

    const templateInput = {
      clientName,
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
      type: session.type,
      notes: session.notes,
      coachName: FROM_NAME,
      whatsappUrl: WHATSAPP_URL,
      whatsappDisplay: WHATSAPP_DISPLAY,
    };
    const preheader = buildPreheader(templateInput);
    const html = buildHtml({ ...templateInput, preheader });
    const text = buildText(templateInput);
    const subject = buildSubject({ type: session.type, date: session.date });

    const emailPayload = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [client.email],
      subject,
      html,
      text,
      attachments: [
        { filename: "seance.ics", content: icsBase64 },
      ],
    };
    if (REPLY_TO) emailPayload.reply_to = REPLY_TO;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
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
