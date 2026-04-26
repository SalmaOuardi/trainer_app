// Pure helpers for the client invite email body.
// Kept separate from api/send-invite.js so they can be unit-tested and the
// serverless function stays thin.

export const escapeHtml = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// "2026-05-01" → "vendredi 1 mai 2026"
export const formatDateFR = (ymd) => {
  const [y, m, d] = String(ymd).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return dt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatTimeFR = (startTime, duration) =>
  startTime ? `${startTime} (${duration} min)` : "(toute la journée)";

export const buildSubject = ({ type, date }) =>
  `Séance ${type || ""} — ${formatDateFR(date)}`.replace(/\s+/g, " ").trim();

// Hidden preview snippet shown by Gmail / Apple Mail / etc. before the email is opened.
// Keep under ~90 chars; longer text is truncated by most inboxes.
export const buildPreheader = ({ coachName, date }) =>
  `Confirmation de votre séance avec ${coachName} le ${formatDateFR(date)}.`;

export const buildText = ({ clientName, date, startTime, duration, type, notes, coachName }) => {
  const dateStr = formatDateFR(date);
  const timeStr = formatTimeFR(startTime, duration);
  const notesBlock = notes ? `\nNote : ${notes}\n` : "";
  return `Bonjour ${clientName},

Voici votre prochaine séance avec ${coachName} :

  Date    : ${dateStr}
  Horaire : ${timeStr}
  Type    : ${type || "Séance"}
${notesBlock}
Le fichier .ics joint ajoute la séance à votre calendrier (iPhone, Google, Outlook).

— ${coachName}
`;
};

export const buildHtml = ({ clientName, date, startTime, duration, type, notes, coachName, preheader }) => {
  const dateStr = formatDateFR(date);
  const timeStr = formatTimeFR(startTime, duration);
  const notesHtml = notes
    ? `<p style="margin:12px 0;color:#555"><em>${escapeHtml(notes)}</em></p>`
    : "";
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(preheader)}</div>`
    : "";
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#222;max-width:520px;margin:0 auto;padding:24px">
  ${preheaderHtml}
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
