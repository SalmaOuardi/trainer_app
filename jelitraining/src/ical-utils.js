// Pure helpers for building an iCalendar (.ics) string from our session events.
// Spec reference: RFC 5545.
//
// Why this file exists: iCal text has a lot of finicky rules (escaping, line
// folding, all-day vs timed events). Keeping the generator pure + isolated
// makes it unit-testable and keeps the Vercel serverless function thin.

// Characters that must be escaped in TEXT fields: backslash, semicolon, comma, newline.
export const escapeICalText = (s) => {
  if (s == null) return "";
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
};

// RFC 5545: lines must not exceed 75 octets. Continuation is a CRLF + single space.
// We fold on characters (not octets) — fine for our ASCII-leaning content; French
// accents will make lines a few bytes shorter in practice, which is safe.
export const foldLine = (line, limit = 75) => {
  if (line.length <= limit) return line;
  const out = [];
  let i = 0;
  out.push(line.slice(0, limit));
  i += limit;
  while (i < line.length) {
    out.push(" " + line.slice(i, i + (limit - 1)));
    i += limit - 1;
  }
  return out.join("\r\n");
};

// "2026-04-22" → "20260422"
export const toICalDate = (ymd) => String(ymd).replaceAll("-", "");

// "2026-04-22" + "09:30" → "20260422T093000"
export const toICalDateTime = (ymd, hhmm) => {
  const d = toICalDate(ymd);
  const [h, m] = String(hhmm).split(":");
  return `${d}T${(h || "00").padStart(2, "0")}${(m || "00").padStart(2, "0")}00`;
};

// "HH:MM" + minutes → new "HH:MM" and a carry-in-days count.
// Used to compute DTEND when startTime + duration spill past midnight.
const addMinutesWithCarry = (hhmm, mins) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  const total = h * 60 + m + Number(mins || 0);
  const carryDays = Math.floor(total / (24 * 60));
  const rem = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = String(Math.floor(rem / 60)).padStart(2, "0");
  const nm = String(rem % 60).padStart(2, "0");
  return { hhmm: `${nh}:${nm}`, carryDays };
};

const addDaysToYmd = (ymd, days) => {
  const [y, m, d] = String(ymd).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

// UTC timestamp for DTSTAMP ("YYYYMMDDTHHMMSSZ"). `now` is injectable for tests.
export const icalUtcStamp = (now = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
};

// Build a single VEVENT block as an array of already-folded lines (no trailing CRLF).
// `event` shape: { sessionId, clientId, clientName, date, type, duration, notes, startTime? }
// `opts`: { domain, tzid, dtstamp }
export const buildVEvent = (event, opts = {}) => {
  const domain = opts.domain || "jelitraining.local";
  const tzid = opts.tzid || "Europe/Paris";
  const dtstamp = opts.dtstamp || icalUtcStamp();

  const uid = `${event.sessionId || "unknown"}@${domain}`;
  const summary = `${event.type || "Séance"} — ${event.clientName || "Client"}`;

  const lines = ["BEGIN:VEVENT"];
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${dtstamp}`);

  if (event.startTime) {
    const start = toICalDateTime(event.date, event.startTime);
    const { hhmm: endHhmm, carryDays } = addMinutesWithCarry(
      event.startTime,
      Number(event.duration) > 0 ? Number(event.duration) : 60,
    );
    const endDate = carryDays > 0 ? addDaysToYmd(event.date, carryDays) : event.date;
    const end = toICalDateTime(endDate, endHhmm);
    lines.push(`DTSTART;TZID=${tzid}:${start}`);
    lines.push(`DTEND;TZID=${tzid}:${end}`);
  } else {
    // All-day event. DTEND is exclusive, so it's the day after.
    const startD = toICalDate(event.date);
    const endD = toICalDate(addDaysToYmd(event.date, 1));
    lines.push(`DTSTART;VALUE=DATE:${startD}`);
    lines.push(`DTEND;VALUE=DATE:${endD}`);
  }

  lines.push(`SUMMARY:${escapeICalText(summary)}`);
  if (event.notes) lines.push(`DESCRIPTION:${escapeICalText(event.notes)}`);
  if (event.type) lines.push(`CATEGORIES:${escapeICalText(event.type)}`);
  lines.push("END:VEVENT");

  return lines.map(l => foldLine(l));
};

// Build the full VCALENDAR body. `events` is a list of flattened events
// (see flattenSessions in calendar-utils.js).
// Output is a single string with CRLF line endings (required by RFC 5545).
export const buildICal = (events, opts = {}) => {
  const calName = opts.calName || "jelitraining";
  const dtstamp = opts.dtstamp || icalUtcStamp();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//jelitraining//${calName}//FR`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(calName)}`,
    `X-WR-TIMEZONE:${opts.tzid || "Europe/Paris"}`,
  ];
  for (const ev of events || []) {
    if (!ev || !ev.date) continue;
    lines.push(...buildVEvent(ev, { ...opts, dtstamp }));
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
};
