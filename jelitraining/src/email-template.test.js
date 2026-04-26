import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  formatDateFR,
  buildSubject,
  buildPreheader,
  buildText,
  buildHtml,
  BRAND_NAME,
} from "./email-template.js";

const SAMPLE = {
  clientName: "Amine K",
  date: "2026-05-01",
  startTime: "09:00",
  duration: "60",
  type: "Muscu",
  notes: "Genou — y aller doucement",
  coachName: "Jefferson Limol",
  whatsappUrl: "https://wa.me/33783976727",
  whatsappDisplay: "+33 7 83 97 67 27",
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
      const p = buildPreheader({ coachName: "Jefferson Limol", date: "2026-05-01" });
      expect(p).toContain("Jefferson Limol");
      expect(p).toContain("1 mai 2026");
    });
    it("stays under 120 characters (inbox snippet limit)", () => {
      const p = buildPreheader({ coachName: "Jefferson Limol", date: "2026-05-01" });
      expect(p.length).toBeLessThanOrEqual(120);
    });
  });

  describe("buildText", () => {
    it("includes client, coach, date, time, type, notes", () => {
      const t = buildText(SAMPLE);
      expect(t).toContain("Amine K");
      expect(t).toContain("Jefferson Limol");
      expect(t).toContain("1 mai 2026");
      expect(t).toContain("09:00 (60 min)");
      expect(t).toContain("Muscu");
      expect(t).toContain("Genou");
    });
    it("includes the brand signoff line", () => {
      expect(buildText(SAMPLE)).toContain(`Coach ${BRAND_NAME}`);
      expect(buildText(SAMPLE)).toContain("À bientôt");
    });
    it("includes the WhatsApp number when whatsappDisplay is set", () => {
      expect(buildText(SAMPLE)).toContain("+33 7 83 97 67 27");
      expect(buildText(SAMPLE)).toContain("WhatsApp");
    });
    it("omits the WhatsApp line when whatsappDisplay is empty", () => {
      const t = buildText({ ...SAMPLE, whatsappDisplay: "" });
      expect(t).not.toContain("WhatsApp");
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
      expect(html).toContain("Jefferson Limol");
      expect(html).toContain("1 mai 2026");
      expect(html).toContain("Muscu");
    });
    it("renders the JT gold-pill logo and JELITRAINING wordmark", () => {
      const html = buildHtml(SAMPLE);
      expect(html).toContain(">JT<");
      expect(html).toContain(">JELITRAINING<");
      expect(html).toContain("#C9A84C");
    });
    it("renders the brand signoff (Coach JeliTraining)", () => {
      const html = buildHtml(SAMPLE);
      expect(html).toContain("À bientôt");
      expect(html).toContain(`Coach ${BRAND_NAME}`);
    });
    it("escapes user-controlled content (XSS)", () => {
      const html = buildHtml({ ...SAMPLE, clientName: "<script>x</script>" });
      expect(html).not.toContain("<script>x</script>");
      expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    });
    it("escapes user-controlled notes (XSS)", () => {
      const html = buildHtml({ ...SAMPLE, notes: "<img onerror=alert(1)>" });
      expect(html).not.toContain("<img onerror=alert(1)>");
      expect(html).toContain("&lt;img onerror=alert(1)&gt;");
    });
    it("omits the notes block entirely when notes are empty", () => {
      const html = buildHtml({ ...SAMPLE, notes: "" });
      expect(html).not.toContain("border-left:3px solid");
    });
    it("renders the preheader as visible italic text (not a hidden div)", () => {
      const html = buildHtml({ ...SAMPLE, preheader: "Confirmation de séance" });
      expect(html).toContain("Confirmation de séance");
      expect(html).toContain("font-style:italic");
    });
    it("contains no hidden HTML (avoids iCloud spam triggers)", () => {
      const html = buildHtml({ ...SAMPLE, preheader: "anything" });
      expect(html).not.toContain("display:none");
      expect(html).not.toContain("mso-hide:all");
    });
    it("renders the WhatsApp link with the URL and display number", () => {
      const html = buildHtml(SAMPLE);
      expect(html).toContain('href="https://wa.me/33783976727"');
      expect(html).toContain("+33 7 83 97 67 27");
      expect(html).toContain(">WhatsApp</a>");
    });
    it("omits the contact section when whatsappUrl is empty", () => {
      const html = buildHtml({ ...SAMPLE, whatsappUrl: "" });
      expect(html).not.toContain("WhatsApp");
      expect(html).not.toContain("wa.me");
    });
    it("renders WhatsApp link without the number when display is empty but URL set", () => {
      const html = buildHtml({ ...SAMPLE, whatsappDisplay: "" });
      expect(html).toContain('href="https://wa.me/33783976727"');
      expect(html).not.toContain("au .");
    });
    it("escapes the WhatsApp URL (XSS)", () => {
      const html = buildHtml({ ...SAMPLE, whatsappUrl: 'javascript:alert(1)"' });
      expect(html).not.toContain('href="javascript:alert(1)"');
      expect(html).toContain("&quot;");
    });
  });
});
