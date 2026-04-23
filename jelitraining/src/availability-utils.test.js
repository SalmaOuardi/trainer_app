import { describe, it, expect } from "vitest";
import {
  DAY_KEYS, DAY_LABELS_FR,
  defaultAvailability, normalizeAvailability,
  jsDayToKey, availabilityForDate,
  formatHourShort, formatHourRange,
} from "./availability-utils.js";

describe("availability-utils", () => {
  it("DAY_KEYS is Monday-first, 7 days", () => {
    expect(DAY_KEYS).toEqual(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
    expect(Object.keys(DAY_LABELS_FR)).toHaveLength(7);
  });

  it("defaultAvailability: weekdays on 08-20, weekend off", () => {
    const def = defaultAvailability();
    expect(def.mon.off).toBe(false);
    expect(def.fri.off).toBe(false);
    expect(def.sat.off).toBe(true);
    expect(def.sun.off).toBe(true);
    expect(def.mon.start).toBe("08:00");
    expect(def.mon.end).toBe("20:00");
  });

  it("normalizeAvailability fills missing days from defaults", () => {
    const partial = { mon: { off: true, start: "10:00", end: "18:00" } };
    const norm = normalizeAvailability(partial);
    expect(norm.mon.off).toBe(true);
    expect(norm.mon.start).toBe("10:00");
    // Other days fall back to default
    expect(norm.tue.off).toBe(false);
    expect(norm.tue.start).toBe("08:00");
  });

  it("normalizeAvailability rejects bad HH:MM values and uses defaults", () => {
    const bad = { mon: { off: false, start: "bad", end: "also-bad" } };
    const norm = normalizeAvailability(bad);
    expect(norm.mon.start).toBe("08:00");
    expect(norm.mon.end).toBe("20:00");
  });

  it("normalizeAvailability handles null / non-object input", () => {
    expect(normalizeAvailability(null)).toEqual(defaultAvailability());
    expect(normalizeAvailability(undefined)).toEqual(defaultAvailability());
    expect(normalizeAvailability("not an object")).toEqual(defaultAvailability());
  });

  it("jsDayToKey maps Sunday=0 to 'sun', Monday=1 to 'mon'", () => {
    expect(jsDayToKey(0)).toBe("sun");
    expect(jsDayToKey(1)).toBe("mon");
    expect(jsDayToKey(6)).toBe("sat");
  });

  it("availabilityForDate returns the correct record", () => {
    const avail = defaultAvailability();
    // 2026-04-22 is a Wednesday
    const wed = new Date(2026, 3, 22);
    const rec = availabilityForDate(avail, wed);
    expect(rec.off).toBe(false);
    expect(rec.start).toBe("08:00");
    // 2026-04-26 is a Sunday
    const sun = new Date(2026, 3, 26);
    expect(availabilityForDate(avail, sun).off).toBe(true);
  });

  it("formatHourShort drops :00, keeps minutes otherwise", () => {
    expect(formatHourShort("08:00")).toBe("08h");
    expect(formatHourShort("08:30")).toBe("08h30");
    expect(formatHourShort("")).toBe("");
    expect(formatHourShort(null)).toBe("");
  });

  it("formatHourRange returns empty string for off days", () => {
    expect(formatHourRange({ off: true, start: "08:00", end: "20:00" })).toBe("");
    expect(formatHourRange({ off: false, start: "08:00", end: "20:00" })).toBe("08h – 20h");
    expect(formatHourRange(null)).toBe("");
  });
});
