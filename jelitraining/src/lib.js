export const ACTIVITY_LEVELS = [
  { value: "sedentaire", label: "Sédentaire", mult: 1.2 },
  { value: "leger", label: "Légèrement actif", mult: 1.375 },
  { value: "modere", label: "Modérément actif", mult: 1.55 },
  { value: "actif", label: "Très actif", mult: 1.725 },
  { value: "extreme", label: "Extrêmement actif", mult: 1.9 },
];

export function calcNutrition(c) {
  const poids = parseFloat(c.weight || 0), taille = parseFloat(c.height || 0), age = parseFloat(c.age || 0);
  if (!poids || !taille || !age) return null;
  const act = ACTIVITY_LEVELS.find(a => a.value === (c.activityLevel || "modere")) || ACTIVITY_LEVELS[2];
  const bmr = c.sexe === "femme"
    ? (10 * poids) + (6.25 * taille) - (5 * age) - 161
    : (10 * poids) + (6.25 * taille) - (5 * age) + 5;
  const tdee = Math.round(bmr * act.mult);
  const imc = (poids / ((taille / 100) ** 2)).toFixed(1);
  const imcLabel = imc < 18.5 ? "Insuffisance pondérale" : imc < 25 ? "Normal ✓" : imc < 30 ? "Surpoids" : "Obésité";
  function macros(cal) {
    const prot = Math.round(poids * 2), lip = Math.round((cal * 0.25) / 9), gluc = Math.round((cal - (prot * 4) - (lip * 9)) / 4);
    return { cal, prot, lip, gluc };
  }
  return {
    bmr: Math.round(bmr), tdee, imc, imcLabel, poids, actLabel: act.label,
    maintien: macros(tdee), perteMG: macros(tdee - 400), priseMasse: macros(tdee + 300),
  };
}

export async function hashPw(pw) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const SK = "jeli-clients-data";

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(SK);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveToStorage(data) {
  localStorage.setItem(SK, JSON.stringify(data));
}
