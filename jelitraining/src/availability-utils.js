// Pure helpers for the trainer's weekly availability (display-only for now).
// No React, no Supabase — unit-testable in isolation.

// Monday-first keys, matching the existing French WEEKDAY ordering in calendar-utils.js.
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS_FR = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

const isValidHhmm = (s) => typeof s === "string" && /^\d{2}:\d{2}$/.test(s);

// Reasonable first-run shape: standard weekday hours, weekend off.
export const defaultAvailability = () => ({
  mon: { off: false, start: "08:00", end: "20:00" },
  tue: { off: false, start: "08:00", end: "20:00" },
  wed: { off: false, start: "08:00", end: "20:00" },
  thu: { off: false, start: "08:00", end: "20:00" },
  fri: { off: false, start: "08:00", end: "20:00" },
  sat: { off: true,  start: "09:00", end: "14:00" },
  sun: { off: true,  start: "09:00", end: "14:00" },
});

// Tolerant loader: fill in missing days, validate HH:MM, fall back per-field to the default.
// Never throws — the worst a bad stored blob can do is fall back to defaults.
export const normalizeAvailability = (raw) => {
  const def = defaultAvailability();
  if (!raw || typeof raw !== "object") return def;
  const out = {};
  for (const k of DAY_KEYS) {
    const rec = raw[k];
    if (!rec || typeof rec !== "object") { out[k] = def[k]; continue; }
    out[k] = {
      off: Boolean(rec.off),
      start: isValidHhmm(rec.start) ? rec.start : def[k].start,
      end: isValidHhmm(rec.end) ? rec.end : def[k].end,
    };
  }
  return out;
};

// JS Date.getDay() is Sunday-indexed (0..6); map to our Monday-first keys.
export const jsDayToKey = (jsDay) => {
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_KEYS[idx];
};

// Look up availability for a specific Date.
// Returns a normalized record: { off, start, end }.
export const availabilityForDate = (avail, date) => {
  const norm = normalizeAvailability(avail);
  const key = jsDayToKey(date.getDay());
  return norm[key];
};

// "08:00" → "08h". "08:30" → "08h30". French-style short form for compact labels.
export const formatHourShort = (hhmm) => {
  if (!isValidHhmm(hhmm)) return "";
  const [h, m] = hhmm.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
};

// "08:00" + "20:00" → "08h – 20h"
export const formatHourRange = (rec) => {
  if (!rec || rec.off) return "";
  const s = formatHourShort(rec.start);
  const e = formatHourShort(rec.end);
  if (!s || !e) return "";
  return `${s} – ${e}`;
};
