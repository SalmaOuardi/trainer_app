import { describe, it, expect } from "vitest";
import {
  PAID,
  startOfYear,
  periodBounds,
  previousPeriodBounds,
  inRange,
  statsForRange,
  lifetimeStats,
  pctDelta,
  monthlyRevenueSeries,
  topClients,
} from "./stats-utils.js";

// Helpers for fixtures.
const session = (id, date, extra = {}) => ({ id, date, type: "Muscu", duration: 60, ...extra });
const payment = (id, date, amount, status = PAID, extra = {}) => ({ id, date, amount, status, ...extra });
const client = (id, firstName, payments = [], sessions = []) => ({
  id,
  firstName,
  lastName: "Test",
  payments,
  sessions,
});

describe("stats-utils — period bounds", () => {
  it("startOfYear returns Jan 1 at midnight", () => {
    const d = startOfYear(new Date(2026, 4, 12, 14, 30));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
  });

  it("periodBounds(week) is Monday → next Monday", () => {
    // 2026-05-10 is a Sunday. Start should be Mon 2026-05-04, end Mon 2026-05-11.
    const { start, end } = periodBounds("week", new Date(2026, 4, 10));
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(4);
    expect(end.getDate()).toBe(11);
  });

  it("periodBounds(month) covers the whole calendar month", () => {
    const { start, end } = periodBounds("month", new Date(2026, 4, 22));
    expect(start.getMonth()).toBe(4);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(5);
    expect(end.getDate()).toBe(1);
  });

  it("periodBounds(year) covers Jan 1 → next Jan 1", () => {
    const { start, end } = periodBounds("year", new Date(2026, 4, 22));
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0);
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(0);
  });

  it("periodBounds(all) returns null bounds", () => {
    expect(periodBounds("all")).toEqual({ start: null, end: null });
  });

  it("periodBounds throws on unknown period", () => {
    expect(() => periodBounds("decade")).toThrow();
  });

  it("previousPeriodBounds(month) returns the prior month", () => {
    const prev = previousPeriodBounds("month", new Date(2026, 4, 22));
    expect(prev.start.getMonth()).toBe(3);
    expect(prev.end.getMonth()).toBe(4);
  });

  it("previousPeriodBounds(all) is null", () => {
    expect(previousPeriodBounds("all")).toBeNull();
  });
});

describe("stats-utils — inRange", () => {
  it("respects half-open semantics", () => {
    const start = new Date(2026, 4, 1);
    const end = new Date(2026, 5, 1);
    expect(inRange("2026-05-01", start, end)).toBe(true);   // start inclusive
    expect(inRange("2026-05-31", start, end)).toBe(true);
    expect(inRange("2026-06-01", start, end)).toBe(false);  // end exclusive
    expect(inRange("2026-04-30", start, end)).toBe(false);
  });

  it("null bounds are open", () => {
    expect(inRange("2020-01-01", null, null)).toBe(true);
  });

  it("missing date string returns false", () => {
    expect(inRange("", new Date(), new Date())).toBe(false);
    expect(inRange(null, null, null)).toBe(false);
  });
});

describe("stats-utils — statsForRange", () => {
  it("returns zeros for empty input", () => {
    expect(statsForRange([], null, null)).toEqual({ revenue: 0, pending: 0, sessions: 0, uniqueClients: 0 });
    expect(statsForRange(null, null, null).revenue).toBe(0);
  });

  it("only paid payments contribute to revenue; pending is tracked separately", () => {
    const c = client("c1", "Ana", [
      payment("p1", "2026-05-05", 50, PAID),
      payment("p2", "2026-05-06", 30, "en attente"),
      payment("p3", "2026-05-07", "20", PAID), // stringy amount still counts
    ]);
    const r = statsForRange([c], null, null);
    expect(r.revenue).toBe(70);
    expect(r.pending).toBe(30);
  });

  it("ignores payments with non-finite amount", () => {
    const c = client("c1", "Ana", [
      payment("p1", "2026-05-05", "abc", PAID),
      payment("p2", "2026-05-05", 40, PAID),
    ]);
    expect(statsForRange([c], null, null).revenue).toBe(40);
  });

  it("counts sessions and distinct clients, not duplicate clients", () => {
    const c1 = client("c1", "Ana", [], [
      session("s1", "2026-05-05"),
      session("s2", "2026-05-06"),
    ]);
    const c2 = client("c2", "Bob", [], [session("s3", "2026-05-06")]);
    const c3 = client("c3", "Cleo", [], []); // no sessions: should NOT count
    const r = statsForRange([c1, c2, c3], null, null);
    expect(r.sessions).toBe(3);
    expect(r.uniqueClients).toBe(2);
  });

  it("filters by [start, end) window", () => {
    const c = client("c1", "Ana",
      [payment("p1", "2026-04-30", 10, PAID), payment("p2", "2026-05-01", 20, PAID), payment("p3", "2026-06-01", 40, PAID)],
      [session("s1", "2026-04-30"), session("s2", "2026-05-15")],
    );
    const r = statsForRange([c], new Date(2026, 4, 1), new Date(2026, 5, 1));
    expect(r.revenue).toBe(20); // only the May 1 payment
    expect(r.sessions).toBe(1);
    expect(r.uniqueClients).toBe(1);
  });

  it("tolerates missing payments/sessions arrays and bad rows", () => {
    const broken = [
      { id: "c1", firstName: "X" }, // no arrays at all
      { id: "c2", payments: [{ amount: 10, status: PAID }], sessions: [{}] }, // no dates
      null,
    ];
    const r = statsForRange(broken, null, null);
    expect(r).toEqual({ revenue: 0, pending: 0, sessions: 0, uniqueClients: 0 });
  });
});

describe("stats-utils — lifetimeStats", () => {
  it("counts roster size separately from clients-trained", () => {
    const c1 = client("c1", "Ana", [], [session("s1", "2026-01-10")]);
    const c2 = client("c2", "Bob", [], []); // signed up, never trained
    const r = lifetimeStats([c1, c2]);
    expect(r.totalClients).toBe(2);
    expect(r.clientsTrained).toBe(1);
  });
});

describe("stats-utils — pctDelta", () => {
  it("returns signed proportion", () => {
    expect(pctDelta(150, 100)).toBeCloseTo(0.5);
    expect(pctDelta(75, 100)).toBeCloseTo(-0.25);
  });

  it("returns null when both sides are zero", () => {
    expect(pctDelta(0, 0)).toBeNull();
  });

  it("returns Infinity when previous is zero but current is not", () => {
    expect(pctDelta(50, 0)).toBe(Infinity);
  });
});

describe("stats-utils — monthlyRevenueSeries", () => {
  it("zero-fills months with no payments", () => {
    const series = monthlyRevenueSeries([], 12, new Date(2026, 4, 10));
    expect(series).toHaveLength(12);
    expect(series.every(b => b.revenue === 0)).toBe(true);
    // Last bucket should be the current month.
    expect(series[series.length - 1].key).toBe("2026-05");
    // First bucket should be 11 months earlier.
    expect(series[0].key).toBe("2025-06");
  });

  it("aggregates paid payments into the right month bucket", () => {
    const c = client("c1", "Ana", [
      payment("p1", "2026-05-02", 100, PAID),
      payment("p2", "2026-05-30", 50, PAID),
      payment("p3", "2026-04-15", 40, PAID),
      payment("p4", "2026-05-10", 20, "en attente"), // ignored
    ]);
    const series = monthlyRevenueSeries([c], 12, new Date(2026, 4, 10));
    const may = series.find(b => b.key === "2026-05");
    const apr = series.find(b => b.key === "2026-04");
    expect(may.revenue).toBe(150);
    expect(apr.revenue).toBe(40);
  });

  it("ignores payments outside the window", () => {
    const c = client("c1", "Ana", [payment("p1", "2020-01-01", 999, PAID)]);
    const series = monthlyRevenueSeries([c], 6, new Date(2026, 4, 10));
    expect(series.every(b => b.revenue === 0)).toBe(true);
  });
});

describe("stats-utils — topClients", () => {
  const fixtures = () => [
    client("c1", "Ana", [payment("p1", "2026-05-01", 200, PAID)], [session("s1", "2026-05-01")]),
    client("c2", "Bob", [payment("p2", "2026-05-02", 500, PAID)], [session("s2", "2026-05-01"), session("s3", "2026-05-02")]),
    client("c3", "Cleo", [payment("p3", "2026-05-03", 100, PAID)], [session("s4", "2026-05-01"), session("s5", "2026-05-02"), session("s6", "2026-05-03")]),
    client("c4", "Dan", [], []), // zero on every metric → filtered out
  ];

  it("ranks by revenue descending and excludes zeroes", () => {
    const ranked = topClients(fixtures(), { metric: "revenue", limit: 5 });
    expect(ranked.map(r => r.clientId)).toEqual(["c2", "c1", "c3"]);
    expect(ranked.find(r => r.clientId === "c4")).toBeUndefined();
  });

  it("ranks by sessions when metric=sessions", () => {
    const ranked = topClients(fixtures(), { metric: "sessions", limit: 5 });
    expect(ranked.map(r => r.clientId)).toEqual(["c3", "c2", "c1"]);
  });

  it("respects limit", () => {
    const ranked = topClients(fixtures(), { metric: "revenue", limit: 2 });
    expect(ranked).toHaveLength(2);
  });

  it("respects window bounds", () => {
    const ranked = topClients(fixtures(), {
      start: new Date(2026, 4, 2),
      end: new Date(2026, 4, 3),
      metric: "revenue",
    });
    // Only Bob's May 2 payment falls in [May 2, May 3).
    expect(ranked.map(r => r.clientId)).toEqual(["c2"]);
  });
});
