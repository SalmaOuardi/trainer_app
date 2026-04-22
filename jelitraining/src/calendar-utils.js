// Pure date + aggregation helpers for the Calendar view.
// No React, no Supabase — safe to unit-test in isolation.

export const TYPE_COLORS = {
  Muscu: "#C9A84C",
  Cardio: "#cc8833",
  HIIT: "#cc4444",
  Circuit: "#8b5cf6",
  Stretching: "#5aaa5a",
  Autre: "#777",
};

export const colorForType = (t) => TYPE_COLORS[t] || TYPE_COLORS.Autre;

export const ymd = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseYmd = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const sameDay = (a, b) => ymd(a) === ymd(b);

export const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
};

export const addMonths = (d, n) => {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + n);
  return dt;
};

// Week starts on Monday (French convention).
export const startOfWeek = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const dow = dt.getDay(); // 0=Sun .. 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  dt.setDate(dt.getDate() + diff);
  return dt;
};

export const startOfMonth = (d) => {
  const dt = new Date(d);
  dt.setDate(1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Returns 42 dates covering the month grid (6 weeks × 7 days, Monday-start).
export const monthGrid = (d) => {
  const first = startOfMonth(d);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
};

export const weekDays = (d) => {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export const WEEKDAY_SHORT_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const WEEKDAY_LONG_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const formatMonthYear = (d) => `${MONTH_NAMES_FR[d.getMonth()]} ${d.getFullYear()}`;

export const formatDayLong = (d) => {
  // WEEKDAY_LONG_FR is Monday-indexed; JS getDay() is Sunday-indexed.
  const js = d.getDay();
  const idx = js === 0 ? 6 : js - 1;
  return `${WEEKDAY_LONG_FR[idx]} ${d.getDate()} ${MONTH_NAMES_FR[d.getMonth()]}`;
};

// Flatten sessions across all clients, attaching client context.
// Input shape (existing): client.sessions = [{ id, date, type, duration, notes }, ...]
// Output: [{ sessionId, clientId, clientName, date, type, duration, notes }, ...]
export const flattenSessions = (clients) => {
  if (!Array.isArray(clients)) return [];
  const out = [];
  for (const c of clients) {
    const sessions = Array.isArray(c.sessions) ? c.sessions : [];
    for (const s of sessions) {
      if (!s || !s.date) continue;
      out.push({
        sessionId: s.id,
        clientId: c.id,
        clientName: [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Client",
        date: s.date,
        type: s.type || "Autre",
        duration: s.duration,
        notes: s.notes,
      });
    }
  }
  return out;
};

// Group events by YYYY-MM-DD string, returns a Map<string, event[]>.
export const groupByDay = (events) => {
  const map = new Map();
  for (const e of events) {
    const key = e.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  return map;
};
