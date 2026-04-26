// Pure helpers for the client invite email body.
// Kept separate from api/send-invite.js so they can be unit-tested and the
// serverless function stays thin.
//
// Design notes (Phase 3b.2):
// - Light background, centered white card, max-width 600 — universal email
//   client compatibility (Outlook desktop chokes on dark backgrounds).
// - Brand identity is a CSS-only "JT" gold pill + JELITRAINING wordmark — no
//   external images, so the email renders identically everywhere with no
//   "load images" prompt.
// - All CSS is inline. <style> blocks get stripped by Gmail.
// - Preheader is a visible italic line at the top of the card, not a hidden
//   div — hidden HTML is a spam signal that hurt deliverability for our
//   zero-reputation new domain.

const GOLD = "#C9A84C";
const TEXT = "#222";
const TEXT_SOFT = "#444";
const TEXT_MUTED = "#888";
const TEXT_FAINT = "#999";
const BG_PAGE = "#FAFAF7";
const BG_CARD = "#ffffff";
const BG_NOTES = "#FAF7F0";
const BORDER_FAINT = "#f0f0f0";

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const BRAND_NAME = "JeliTraining";

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

// Visible preview line at the top of the card. Doubles as the inbox snippet
// (mail clients use the first visible text). Kept under ~120 chars to avoid
// truncation in inbox previews.
export const buildPreheader = ({ coachName, date }) =>
  `Confirmation de votre séance avec ${coachName} le ${formatDateFR(date)}.`;

export const buildText = ({
  clientName, date, startTime, duration, type, notes, coachName,
  whatsappDisplay,
}) => {
  const dateStr = formatDateFR(date);
  const timeStr = formatTimeFR(startTime, duration);
  const notesBlock = notes ? `\nNote : ${notes}\n` : "";
  const contactLine = whatsappDisplay
    ? `\nPour toute question, contactez-moi sur WhatsApp au ${whatsappDisplay}.\n`
    : "";
  return `Bonjour ${clientName},

Voici les détails de votre prochaine séance avec ${coachName} :

  Date    : ${dateStr}
  Horaire : ${timeStr}
  Type    : ${type || "Séance"}
${notesBlock}
Cliquez sur la pièce jointe .ics pour ajouter la séance à votre calendrier.
${contactLine}
À bientôt,
${coachName}
Coach ${BRAND_NAME}
`;
};

const renderLogo = () => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
    <tr>
      <td style="background:${GOLD};color:#fff;font-weight:700;font-size:14px;padding:8px 12px;border-radius:6px;letter-spacing:1px;font-family:${FONT_STACK}">JT</td>
      <td style="padding-left:12px;color:${TEXT};font-weight:600;font-size:14px;letter-spacing:3px;font-family:${FONT_STACK}">JELITRAINING</td>
    </tr>
  </table>`;

const renderDetailRow = (icon, value, isFirst) => `
    <tr>
      <td style="padding:12px 0;font-size:15px;color:${TEXT_SOFT};font-family:${FONT_STACK};${isFirst ? "" : `border-top:1px solid ${BORDER_FAINT};`}">
        <span style="font-size:18px;margin-right:12px;display:inline-block;width:22px">${icon}</span>${escapeHtml(value)}
      </td>
    </tr>`;

const renderNotes = (notes) => notes
  ? `
  <div style="padding:0 32px 24px">
    <div style="background:${BG_NOTES};border-left:3px solid ${GOLD};padding:12px 16px;border-radius:4px">
      <p style="margin:0;color:${TEXT_SOFT};font-style:italic;font-size:14px;font-family:${FONT_STACK};line-height:1.5">${escapeHtml(notes)}</p>
    </div>
  </div>`
  : "";

const renderContact = (whatsappUrl, whatsappDisplay) => {
  if (!whatsappUrl) return "";
  const numberSuffix = whatsappDisplay ? ` au ${escapeHtml(whatsappDisplay)}` : "";
  return `
  <div style="padding:0 32px 4px">
    <hr style="border:none;border-top:1px solid ${BORDER_FAINT};margin:0 0 20px">
    <p style="margin:0;color:${TEXT_SOFT};font-size:14px;font-family:${FONT_STACK};line-height:1.5">
      Pour toute question, contactez-moi sur <a href="${escapeHtml(whatsappUrl)}" style="color:${GOLD};text-decoration:none;font-weight:600">WhatsApp</a>${numberSuffix}.
    </p>
  </div>`;
};

export const buildHtml = ({
  clientName, date, startTime, duration, type, notes, coachName,
  preheader, whatsappUrl, whatsappDisplay,
}) => {
  const dateStr = formatDateFR(date);
  const timeStr = formatTimeFR(startTime, duration);
  const previewLine = preheader
    ? `
  <div style="padding:0 32px 20px">
    <p style="margin:0;color:${TEXT_FAINT};font-size:13px;font-style:italic;font-family:${FONT_STACK}">${escapeHtml(preheader)}</p>
  </div>`
    : "";

  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px 12px;background:${BG_PAGE};font-family:${FONT_STACK};color:${TEXT}">
  <div style="max-width:600px;margin:0 auto;background:${BG_CARD};border-top:4px solid ${GOLD};border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden">
    <div style="padding:28px 32px 20px">
      ${renderLogo()}
    </div>${previewLine}
    <div style="padding:0 32px 20px">
      <h2 style="margin:0 0 12px;color:${TEXT};font-weight:600;font-size:22px;font-family:${FONT_STACK};line-height:1.3">Bonjour ${escapeHtml(clientName)},</h2>
      <p style="margin:0;color:${TEXT_SOFT};font-size:15px;line-height:1.6;font-family:${FONT_STACK}">Voici les détails de votre prochaine séance avec ${escapeHtml(coachName)} :</p>
    </div>
    <div style="padding:4px 32px 20px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%">
        ${renderDetailRow("🗓", dateStr, true)}
        ${renderDetailRow("⏰", timeStr, false)}
        ${renderDetailRow("💪", type || "Séance", false)}
      </table>
    </div>${renderNotes(notes)}
    <div style="padding:0 32px 24px">
      <p style="margin:0;color:${TEXT_MUTED};font-size:13px;font-family:${FONT_STACK};line-height:1.5">📎 Cliquez sur la pièce jointe <code style="background:${BG_PAGE};padding:1px 5px;border-radius:3px;font-size:12px">.ics</code> pour ajouter la séance à votre calendrier.</p>
    </div>${renderContact(whatsappUrl, whatsappDisplay)}
    <div style="padding:24px 32px 32px">
      <p style="margin:0 0 6px;color:${TEXT_SOFT};font-size:14px;font-family:${FONT_STACK}">À bientôt,</p>
      <p style="margin:0;color:${TEXT};font-size:15px;font-weight:600;font-family:${FONT_STACK}">${escapeHtml(coachName)}</p>
      <p style="margin:0;color:${TEXT_MUTED};font-size:13px;font-family:${FONT_STACK}">Coach ${BRAND_NAME}</p>
    </div>
  </div>
</body></html>`;
};
