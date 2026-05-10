// Pure aggregation helpers for the Statistiques view.
// No React, no Supabase — safe to unit-test in isolation.
//
// Conventions:
// - "Earnings" / "revenue" = payments with status === "payé" only.
//   Pending payments are surfaced separately and never folded into revenue.
// - "Clients trained" in a window = distinct clients with ≥1 session whose
//   date falls in the window. Counting unique clients, never sessions.
// - All ranges are [start, end) — start inclusive, end exclusive.
// - Dates are interpreted in local time, matching the rest of the app.

import { startOfWeek, startOfMonth, addDays, addMonths, parseYmd, MONTH_NAMES_FR } from "./calendar-utils.js";

export const PAID = "payé";

// ─── Period bounds ──────────────────────────────────────────────────────────

export const startOfYear = (d) => {
  const dt = new Date(d);
  dt.setMonth(0, 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Returns [start, end) bounds for a named period anchored on `now`.
// "all" returns null start (= no lower bound).
export const periodBounds = (period, now = new Date()) => {
  if (period === "week") {
    const start = startOfWeek(now);
    return { start, end: addDays(start, 7) };
  }
  if (period === "month") {
    const start = startOfMonth(now);
    return { start, end: addMonths(start, 1) };
  }
  if (period === "year") {
    const start = startOfYear(now);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return { start, end };
  }
  if (period === "all") {
    return { start: null, end: null };
  }
  throw new Error(`unknown period: ${period}`);
};

// Bounds for the period immediately preceding `period` (same length).
// "all" has no previous period — returns null.
export const previousPeriodBounds = (period, now = new Date()) => {
  if (period === "all") return null;
  const { start, end } = periodBounds(period, now);
  if (period === "week") return { start: addDays(start, -7), end: start };
  if (period === "month") return { start: addMonths(start, -1), end: start };
  if (period === "year") {
    const prevStart = new Date(start);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    return { start: prevStart, end };
  }
  return null;
};

// ─── Inclusion check ────────────────────────────────────────────────────────

// Date string ("YYYY-MM-DD") falls within [start, end). Null bounds = open.
export const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = parseYmd(dateStr);
  if (start && d < start) return false;
  if (end && d >= end) return false;
  return true;
};

// ─── Core aggregator ────────────────────────────────────────────────────────

// Computes stats over the [start, end) window across all clients.
// Returns: { revenue, pending, sessions, uniqueClients }
//   - revenue: paid payment amounts in window (number, EUR)
//   - pending: pending payment amounts in window (number, EUR)
//   - sessions: count of session entries in window
//   - uniqueClients: count of distinct clients with ≥1 session in window
export const statsForRange = (clients, start, end) => {
  let revenue = 0;
  let pending = 0;
  let sessions = 0;
  const clientsWithSession = new Set();

  if (!Array.isArray(clients)) {
    return { revenue: 0, pending: 0, sessions: 0, uniqueClients: 0 };
  }

  for (const c of clients) {
    if (!c) continue;

    const ps = Array.isArray(c.payments) ? c.payments : [];
    for (const p of ps) {
      if (!p || !p.date) continue;
      if (!inRange(p.date, start, end)) continue;
      const amt = Number(p.amount);
      if (!Number.isFinite(amt)) continue;
      if (p.status === PAID) revenue += amt;
      else pending += amt;
    }

    const ss = Array.isArray(c.sessions) ? c.sessions : [];
    for (const s of ss) {
      if (!s || !s.date) continue;
      if (!inRange(s.date, start, end)) continue;
      sessions += 1;
      clientsWithSession.add(c.id);
    }
  }

  return {
    revenue,
    pending,
    sessions,
    uniqueClients: clientsWithSession.size,
  };
};

// ─── Lifetime totals ────────────────────────────────────────────────────────

// All-time numbers. `totalClients` counts every client in the roster (active +
// inactive); `clientsTrained` counts those with ≥1 session ever.
export const lifetimeStats = (clients) => {
  const base = statsForRange(clients, null, null);
  return {
    ...base,
    clientsTrained: base.uniqueClients,
    totalClients: Array.isArray(clients) ? clients.length : 0,
  };
};

// ─── Period delta ───────────────────────────────────────────────────────────

// Percentage change from `previous` to `current`. Returns:
//   - null when there is no previous baseline (prev = 0 and curr = 0 → null)
//   - Infinity when prev = 0 and curr > 0 (signals "new" — UI shows "—" or "↑")
//   - signed number otherwise (e.g. 0.33 = +33%)
export const pctDelta = (current, previous) => {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return Infinity;
  return (current - previous) / previous;
};

// ─── Monthly revenue series (for the trend chart) ───────────────────────────

// Returns an array of { key: "YYYY-MM", label: "Janv. 2026", revenue }
// covering the last `months` months ending on the month containing `now`.
// Months with zero revenue are included (zero-fill) so the chart has a
// continuous x-axis instead of gaps.
export const monthlyRevenueSeries = (clients, months = 12, now = new Date()) => {
  const buckets = [];
  const index = new Map();
  const anchor = startOfMonth(now);

  for (let i = months - 1; i >= 0; i--) {
    const start = addMonths(anchor, -i);
    const y = start.getFullYear();
    const m = start.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES_FR[m].slice(0, 4).replace(/\.$/, "")}. ${y}`;
    const bucket = { key, label, revenue: 0 };
    buckets.push(bucket);
    index.set(key, bucket);
  }

  if (!Array.isArray(clients)) return buckets;

  for (const c of clients) {
    const ps = Array.isArray(c?.payments) ? c.payments : [];
    for (const p of ps) {
      if (!p || p.status !== PAID || !p.date) continue;
      const amt = Number(p.amount);
      if (!Number.isFinite(amt)) continue;
      const d = parseYmd(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = index.get(key);
      if (bucket) bucket.revenue += amt;
    }
  }

  return buckets;
};

// ─── Top clients ────────────────────────────────────────────────────────────

// Returns the top N clients in [start, end) sorted by `metric`:
//   - "revenue" → sum of paid payments in window
//   - "sessions" → session count in window
// Each row: { clientId, clientName, revenue, sessions }
// Clients with zero on the chosen metric are filtered out.
export const topClients = (clients, { start = null, end = null, metric = "revenue", limit = 5 } = {}) => {
  if (!Array.isArray(clients)) return [];
  const rows = clients.map(c => {
    let revenue = 0;
    let sessions = 0;
    const ps = Array.isArray(c?.payments) ? c.payments : [];
    for (const p of ps) {
      if (!p || p.status !== PAID || !p.date) continue;
      if (!inRange(p.date, start, end)) continue;
      const amt = Number(p.amount);
      if (Number.isFinite(amt)) revenue += amt;
    }
    const ss = Array.isArray(c?.sessions) ? c.sessions : [];
    for (const s of ss) {
      if (!s || !s.date) continue;
      if (!inRange(s.date, start, end)) continue;
      sessions += 1;
    }
    return {
      clientId: c.id,
      clientName: [c?.firstName, c?.lastName].filter(Boolean).join(" ").trim() || "Client",
      revenue,
      sessions,
    };
  });

  const score = (r) => metric === "sessions" ? r.sessions : r.revenue;
  return rows
    .filter(r => score(r) > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
};
