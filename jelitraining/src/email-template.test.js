import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  formatDateFR,
  buildSubject,
  buildPreheader,
  buildText,
  buildHtml,
} from "./email-template.js";

const SAMPLE = {
  clientName: "Amine K",
  date: "2026-05-01",
  startTime: "09:00",
  duration: "60",
  type: "Muscu",
  notes: "Genou — y aller doucement",
  coachName: "Coach Jeli",
};

describe("email-template", () => {
  describe("escapeHtml", () => {
    it("escapes &, <, >, \", '", () => {
      expect(escapeHtml(`<a href="x">A & B's</a>`)).toBe(
        "&lt;a href=&quot;x&quot;&gt;A &amp; B&#39;s&lt;/a&gt;",
      );
    });
    it("returns empty string for null/undefined", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
    });
  });

  describe("formatDateFR", () => {
    it("formats YYYY-MM-DD as a long French date", () => {
      const out = formatDateFR("2026-05-01");
      expect(out).toContain("vendredi");
      expect(out).toContain("1 mai 2026");
    });
  });

  describe("buildSubject", () => {
    it("includes the type and the formatted date", () => {
      const s = buildSubject({ type: "Muscu", date: "2026-05-01" });
      expect(s).toContain("Muscu");
      expect(s).toContain("1 mai 2026");
    });
    it("falls back to 'Séance' when type is empty", () => {
      expect(buildSubject({ type: "", date: "2026-05-01" })).toContain("Séance");
    });
  });

  describe("buildPreheader", () => {
    it("mentions the coach and the date", () => {
      const p = buildPreheader({ coachName: "Coach Jeli", date: "2026-05-01" });
      expect(p).toContain("Coach Jeli");
      expect(p).toContain("1 mai 2026");
    });
    it("stays under 120 characters (inbox snippet limit)", () => {
      const p = buildPreheader({ coachName: "Coach Jeli", date: "2026-05-01" });
      expect(p.length).toBeLessThanOrEqual(120);
    });
  });

  describe("buildText", () => {
    it("includes client, coach, date, time, type, notes", () => {
      const t = buildText(SAMPLE);
      expect(t).toContain("Amine K");
      expect(t).toContain("Coach Jeli");
      expect(t).toContain("1 mai 2026");
      expect(t).toContain("09:00 (60 min)");
      expect(t).toContain("Muscu");
      expect(t).toContain("Genou");
    });
    it("omits the Note line when notes are empty", () => {
      const t = buildText({ ...SAMPLE, notes: "" });
      expect(t).not.toContain("Note :");
    });
    it("uses 'toute la journée' when there is no startTime", () => {
      const t = buildText({ ...SAMPLE, startTime: null });
      expect(t).toContain("toute la journée");
    });
  });

  describe("buildHtml", () => {
    it("includes client, coach, date, time, type", () => {
      const html = buildHtml(SAMPLE);
      expect(html).toContain("Amine K");
      expect(html).toContain("Coach Jeli");
      expect(html).toContain("1 mai 2026");
      expect(html).toContain("Muscu");
    });
    it("escapes user-controlled content (XSS)", () => {
      const html = buildHtml({ ...SAMPLE, clientName: "<script>x</script>" });
      expect(html).not.toContain("<script>x</script>");
      expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    });
    it("omits the notes paragraph when notes are empty", () => {
      const html = buildHtml({ ...SAMPLE, notes: "" });
      expect(html).not.toMatch(/<em>/);
    });
    it("includes the preheader as a hidden div when provided", () => {
      const html = buildHtml({ ...SAMPLE, preheader: "Confirmation de séance" });
      expect(html).toContain("display:none");
      expect(html).toContain("Confirmation de séance");
    });
    it("omits the preheader div when preheader is not provided", () => {
      const html = buildHtml(SAMPLE);
      expect(html).not.toContain("mso-hide:all");
    });
  });
});
