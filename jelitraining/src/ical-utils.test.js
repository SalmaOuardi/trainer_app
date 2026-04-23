import { describe, it, expect } from "vitest";
import {
  escapeICalText, foldLine,
  toICalDate, toICalDateTime,
  buildVEvent, buildICal,
} from "./ical-utils.js";

const DTSTAMP = "20260423T100000Z";

describe("ical-utils", () => {
  it("escapes commas, semicolons, backslashes, and newlines", () => {
    expect(escapeICalText("a, b; c\\d")).toBe("a\\, b\\; c\\\\d");
    expect(escapeICalText("line1\nline2")).toBe("line1\\nline2");
    expect(escapeICalText(null)).toBe("");
    expect(escapeICalText(undefined)).toBe("");
  });

  it("foldLine leaves short lines alone", () => {
    expect(foldLine("short line")).toBe("short line");
  });

  it("foldLine breaks long lines with CRLF + space continuation", () => {
    const long = "X".repeat(200);
    const folded = foldLine(long, 75);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0].length).toBe(75);
    for (let i = 1; i < parts.length; i++) {
      expect(parts[i].startsWith(" ")).toBe(true);
      expect(parts[i].length).toBeLessThanOrEqual(75);
    }
  });

  it("toICalDate strips dashes", () => {
    expect(toICalDate("2026-04-22")).toBe("20260422");
  });

  it("toICalDateTime combines date + HH:MM with seconds=00", () => {
    expect(toICalDateTime("2026-04-22", "09:30")).toBe("20260422T093000");
  });

  it("buildVEvent emits a timed event with TZID and correct DTEND", () => {
    const ev = {
      sessionId: "s1", clientId: "c1", clientName: "Amine K",
      date: "2026-04-22", type: "Muscu", duration: "60",
      startTime: "09:00", notes: "leg day",
    };
    const lines = buildVEvent(ev, { domain: "jeli.test", dtstamp: DTSTAMP });
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("UID:s1@jeli.test");
    expect(lines).toContain(`DTSTAMP:${DTSTAMP}`);
    expect(lines).toContain("DTSTART;TZID=Europe/Paris:20260422T090000");
    expect(lines).toContain("DTEND;TZID=Europe/Paris:20260422T100000");
    expect(lines).toContain("SUMMARY:Muscu — Amine K");
    expect(lines).toContain("DESCRIPTION:leg day");
    expect(lines).toContain("CATEGORIES:Muscu");
    expect(lines).toContain("END:VEVENT");
  });

  it("buildVEvent emits an all-day event when startTime is missing", () => {
    const ev = {
      sessionId: "s2", clientName: "Sofia B",
      date: "2026-04-22", type: "Cardio", duration: "45",
    };
    const lines = buildVEvent(ev, { dtstamp: DTSTAMP });
    expect(lines).toContain("DTSTART;VALUE=DATE:20260422");
    // DTEND is the following day (exclusive end for all-day).
    expect(lines).toContain("DTEND;VALUE=DATE:20260423");
  });

  it("buildVEvent rolls DTEND to next day when start+duration crosses midnight", () => {
    const ev = {
      sessionId: "s3", clientName: "Late Owl",
      date: "2026-04-22", type: "HIIT", duration: "90",
      startTime: "23:30",
    };
    const lines = buildVEvent(ev, { dtstamp: DTSTAMP });
    expect(lines).toContain("DTSTART;TZID=Europe/Paris:20260422T233000");
    expect(lines).toContain("DTEND;TZID=Europe/Paris:20260423T010000");
  });

  it("buildICal wraps events with VCALENDAR headers and ends with CRLF", () => {
    const events = [
      { sessionId: "a", clientName: "A", date: "2026-04-22", type: "Muscu", duration: "60", startTime: "09:00" },
      { sessionId: "b", clientName: "B", date: "2026-04-23", type: "Cardio", duration: "30" },
      { /* bad */ sessionId: "x" },
    ];
    const out = buildICal(events, { calName: "test-cal", dtstamp: DTSTAMP });
    expect(out.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(out.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(out).toContain("VERSION:2.0");
    expect(out).toContain("X-WR-CALNAME:test-cal");
    expect(out).toContain("UID:a@jelitraining.local");
    expect(out).toContain("UID:b@jelitraining.local");
    // The malformed event (no date) is skipped.
    expect(out).not.toContain("UID:x@");
  });

  it("buildICal uses CRLF between every line (RFC 5545 compliance)", () => {
    const out = buildICal([
      { sessionId: "a", clientName: "A", date: "2026-04-22", type: "Muscu", duration: "60", startTime: "09:00" },
    ], { dtstamp: DTSTAMP });
    // No bare LF (every LF should be preceded by CR).
    const lfIndex = out.indexOf("\n");
    expect(lfIndex).toBeGreaterThan(0);
    expect(out[lfIndex - 1]).toBe("\r");
  });

  it("buildVEvent escapes special characters in SUMMARY and DESCRIPTION", () => {
    const ev = {
      sessionId: "s", clientName: "A, B",
      date: "2026-04-22", type: "Muscu", duration: "60",
      notes: "line1\nline2; with, commas",
    };
    const lines = buildVEvent(ev, { dtstamp: DTSTAMP });
    expect(lines).toContain("SUMMARY:Muscu — A\\, B");
    expect(lines).toContain("DESCRIPTION:line1\\nline2\\; with\\, commas");
  });
});
