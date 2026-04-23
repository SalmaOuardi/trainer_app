import { describe, it, expect } from "vitest";
import {
  ymd, sameDay, addDays, addMonths,
  startOfWeek, startOfMonth, monthGrid, weekDays,
  flattenSessions, groupByDay, colorForType,
  compareEvents, minutesFromTime, addMinutesToTime,
} from "./calendar-utils.js";

describe("calendar-utils", () => {
  it("ymd formats a date as YYYY-MM-DD in local time", () => {
    expect(ymd(new Date(2026, 3, 22))).toBe("2026-04-22");
    expect(ymd(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("sameDay is true for two Date objects on the same day", () => {
    const a = new Date(2026, 3, 22, 3, 15);
    const b = new Date(2026, 3, 22, 23, 59);
    expect(sameDay(a, b)).toBe(true);
    expect(sameDay(a, new Date(2026, 3, 23))).toBe(false);
  });

  it("addDays and addMonths don't mutate the input", () => {
    const base = new Date(2026, 3, 22);
    const later = addDays(base, 7);
    expect(ymd(base)).toBe("2026-04-22");
    expect(ymd(later)).toBe("2026-04-29");
    expect(ymd(addMonths(base, 1))).toBe("2026-05-22");
  });

  it("startOfWeek returns Monday for any weekday in the week", () => {
    // Wed 2026-04-22 → Mon 2026-04-20
    expect(ymd(startOfWeek(new Date(2026, 3, 22)))).toBe("2026-04-20");
    // Sunday 2026-04-26 → Monday 2026-04-20 (still that week)
    expect(ymd(startOfWeek(new Date(2026, 3, 26)))).toBe("2026-04-20");
  });

  it("startOfMonth returns the 1st of the month at 00:00", () => {
    const s = startOfMonth(new Date(2026, 3, 22));
    expect(ymd(s)).toBe("2026-04-01");
    expect(s.getHours()).toBe(0);
  });

  it("monthGrid returns 42 days, starting on the Monday before month start", () => {
    const grid = monthGrid(new Date(2026, 3, 1)); // April 2026
    expect(grid.length).toBe(42);
    expect(grid[0].getDay()).toBe(1); // Monday
    // April 1 2026 is a Wednesday; grid[0] should be Monday March 30
    expect(ymd(grid[0])).toBe("2026-03-30");
  });

  it("weekDays returns 7 consecutive days starting Monday", () => {
    const days = weekDays(new Date(2026, 3, 22));
    expect(days.length).toBe(7);
    expect(ymd(days[0])).toBe("2026-04-20");
    expect(ymd(days[6])).toBe("2026-04-26");
  });

  it("flattenSessions attaches client context and skips invalid entries", () => {
    const clients = [
      { id: "c1", firstName: "Amine", lastName: "K", sessions: [
        { id: "s1", date: "2026-04-22", type: "Muscu", duration: "60" },
        { id: "s2", date: "2026-04-23", type: "Cardio", duration: "45" },
      ]},
      { id: "c2", firstName: "Sofia", lastName: "B", sessions: [
        { id: "s3", date: "2026-04-22", type: "HIIT", duration: "30" },
        { id: "bad", /* no date */ type: "Muscu" },
      ]},
      { id: "c3", firstName: "Alone" /* no sessions array */ },
    ];
    const flat = flattenSessions(clients);
    expect(flat.length).toBe(3);
    expect(flat[0]).toMatchObject({ sessionId: "s1", clientId: "c1", clientName: "Amine K", type: "Muscu" });
    expect(flat.find(e => e.sessionId === "s3").clientName).toBe("Sofia B");
  });

  it("flattenSessions handles undefined or non-array input safely", () => {
    expect(flattenSessions(undefined)).toEqual([]);
    expect(flattenSessions(null)).toEqual([]);
    expect(flattenSessions([])).toEqual([]);
  });

  it("groupByDay keys events by their date string", () => {
    const events = [
      { date: "2026-04-22", sessionId: "a" },
      { date: "2026-04-22", sessionId: "b" },
      { date: "2026-04-23", sessionId: "c" },
    ];
    const map = groupByDay(events);
    expect(map.get("2026-04-22").length).toBe(2);
    expect(map.get("2026-04-23").length).toBe(1);
    expect(map.get("2026-04-24")).toBeUndefined();
  });

  it("colorForType falls back to the 'Autre' color for unknown types", () => {
    expect(colorForType("Muscu")).not.toBe(colorForType("Autre"));
    expect(colorForType("SomethingWeird")).toBe(colorForType("Autre"));
  });

  it("flattenSessions preserves the user's existing session shape (regression guard)", () => {
    // This mirrors the exact shape in production: { id, date, type, duration, notes? }.
    // If anyone adds a required field in the future and forgets calendar, this will fail.
    const clients = [{ id: "c", firstName: "Real", lastName: "Client", sessions: [
      { id: "s", date: "2026-04-22", type: "Muscu", duration: "60", notes: "good set" },
    ]}];
    const [e] = flattenSessions(clients);
    expect(e.duration).toBe("60");
    expect(e.notes).toBe("good set");
    expect(e.clientName).toBe("Real Client");
  });

  it("flattenSessions defaults startTime to null and preserves it when present", () => {
    const clients = [{ id: "c", firstName: "A", lastName: "B", sessions: [
      { id: "old", date: "2026-04-22", type: "Muscu", duration: "60" },
      { id: "new", date: "2026-04-22", type: "HIIT", duration: "30", startTime: "09:30" },
    ]}];
    const flat = flattenSessions(clients);
    expect(flat.find(e => e.sessionId === "old").startTime).toBeNull();
    expect(flat.find(e => e.sessionId === "new").startTime).toBe("09:30");
  });

  it("compareEvents orders timed events first (by time), then untimed by client name", () => {
    const a = { startTime: "09:00", clientName: "Zoe" };
    const b = { startTime: "14:30", clientName: "Amine" };
    const c = { startTime: null, clientName: "Bob" };
    const d = { startTime: null, clientName: "Alice" };
    const sorted = [c, b, d, a].sort(compareEvents);
    expect(sorted.map(e => e.clientName)).toEqual(["Zoe", "Amine", "Alice", "Bob"]);
  });

  it("minutesFromTime parses HH:MM and returns null for bad input", () => {
    expect(minutesFromTime("09:30")).toBe(570);
    expect(minutesFromTime("00:00")).toBe(0);
    expect(minutesFromTime("23:59")).toBe(23 * 60 + 59);
    expect(minutesFromTime("")).toBeNull();
    expect(minutesFromTime(null)).toBeNull();
    expect(minutesFromTime("abc")).toBeNull();
  });

  it("addMinutesToTime adds duration and clamps at 23:59", () => {
    expect(addMinutesToTime("09:00", 60)).toBe("10:00");
    expect(addMinutesToTime("09:30", 45)).toBe("10:15");
    expect(addMinutesToTime("23:00", 120)).toBe("23:59");
    expect(addMinutesToTime("09:00", 0)).toBeNull();
    expect(addMinutesToTime(null, 60)).toBeNull();
    expect(addMinutesToTime("09:00", "abc")).toBeNull();
  });
});
