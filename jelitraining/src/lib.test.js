import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calcNutrition, hashPw, loadFromStorage, saveToStorage, SK } from "./lib.js";

/* ─── calcNutrition ─── */

describe("calcNutrition", () => {
  const base = { weight: "80", height: "180", age: "30", sexe: "homme", activityLevel: "modere" };

  it("returns null when any required field is missing", () => {
    expect(calcNutrition({ weight: "80", height: "180" })).toBeNull();
    expect(calcNutrition({ weight: "80", age: "30" })).toBeNull();
    expect(calcNutrition({ height: "180", age: "30" })).toBeNull();
    expect(calcNutrition({})).toBeNull();
  });

  it("calculates correct BMR for a man (Mifflin-St Jeor)", () => {
    // (10×80) + (6.25×180) − (5×30) + 5 = 800 + 1125 − 150 + 5 = 1780
    const result = calcNutrition(base);
    expect(result.bmr).toBe(1780);
  });

  it("calculates correct BMR for a woman", () => {
    // (10×80) + (6.25×180) − (5×30) − 161 = 800 + 1125 − 150 − 161 = 1614
    const result = calcNutrition({ ...base, sexe: "femme" });
    expect(result.bmr).toBe(1614);
  });

  it("applies activity multiplier correctly for modéré (×1.55)", () => {
    const result = calcNutrition(base);
    expect(result.tdee).toBe(Math.round(1780 * 1.55));
  });

  it("applies activity multiplier correctly for sédentaire (×1.2)", () => {
    const result = calcNutrition({ ...base, activityLevel: "sedentaire" });
    expect(result.tdee).toBe(Math.round(1780 * 1.2));
  });

  it("calculates IMC correctly", () => {
    // 80 / (1.80²) = 80 / 3.24 = 24.7
    const result = calcNutrition(base);
    expect(result.imc).toBe("24.7");
    expect(result.imcLabel).toBe("Normal ✓");
  });

  it("labels IMC as Surpoids when >= 25", () => {
    const result = calcNutrition({ ...base, weight: "90" });
    expect(result.imcLabel).toBe("Surpoids");
  });

  it("labels IMC as Insuffisance pondérale when < 18.5", () => {
    const result = calcNutrition({ ...base, weight: "50" });
    expect(result.imcLabel).toBe("Insuffisance pondérale");
  });

  it("perteMG is tdee - 400", () => {
    const result = calcNutrition(base);
    expect(result.perteMG.cal).toBe(result.tdee - 400);
  });

  it("priseMasse is tdee + 300", () => {
    const result = calcNutrition(base);
    expect(result.priseMasse.cal).toBe(result.tdee + 300);
  });

  it("protein target is 2g per kg of bodyweight", () => {
    const result = calcNutrition(base);
    expect(result.maintien.prot).toBe(160); // 80kg × 2
  });

  it("macros calories add up roughly to target calories", () => {
    const result = calcNutrition(base);
    const { prot, lip, gluc, cal } = result.maintien;
    const total = (prot * 4) + (lip * 9) + (gluc * 4);
    expect(Math.abs(total - cal)).toBeLessThan(10); // rounding tolerance
  });
});

/* ─── localStorage persistence ─── */

describe("loadFromStorage / saveToStorage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns null when storage is empty", () => {
    expect(loadFromStorage()).toBeNull();
  });

  it("saves and loads an array of clients", () => {
    const clients = [{ id: "1", firstName: "Test", lastName: "User" }];
    saveToStorage(clients);
    expect(loadFromStorage()).toEqual(clients);
  });

  it("returns null for corrupted storage data", () => {
    localStorage.setItem(SK, "not-valid-json{{");
    expect(loadFromStorage()).toBeNull();
  });

  it("returns null when stored value is not an array", () => {
    localStorage.setItem(SK, JSON.stringify({ not: "an array" }));
    expect(loadFromStorage()).toBeNull();
  });

  it("overwrites previous data on save", () => {
    saveToStorage([{ id: "1" }]);
    saveToStorage([{ id: "2" }, { id: "3" }]);
    expect(loadFromStorage()).toHaveLength(2);
  });
});

/* ─── hashPw ─── */

describe("hashPw", () => {
  it("returns a 64-character hex string", async () => {
    const hash = await hashPw("Jeli2025");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("same password always produces the same hash", async () => {
    const h1 = await hashPw("Jeli2025");
    const h2 = await hashPw("Jeli2025");
    expect(h1).toBe(h2);
  });

  it("different passwords produce different hashes", async () => {
    const h1 = await hashPw("Jeli2025");
    const h2 = await hashPw("Jeli2026");
    expect(h1).not.toBe(h2);
  });

  it("is case sensitive", async () => {
    const h1 = await hashPw("jeli2025");
    const h2 = await hashPw("Jeli2025");
    expect(h1).not.toBe(h2);
  });
});
