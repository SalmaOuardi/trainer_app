import { useState, useMemo } from "react";
import { C } from "../theme.js";
import { Btn, Input } from "./ui.jsx";
import { DAY_KEYS, DAY_LABELS_FR, defaultAvailability, normalizeAvailability } from "../availability-utils.js";

const FEED_TOKEN = import.meta.env.VITE_ICAL_FEED_TOKEN || "";

export function SettingsView({ availability, onSaveAvailability }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const feedUrl = FEED_TOKEN ? `${origin}/api/ical?token=${FEED_TOKEN}` : "";
  const webcalUrl = feedUrl ? feedUrl.replace(/^https?:/, "webcal:") : "";

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* user can still long-press + copy the text */ }
  };

  return (
    <div style={{ padding: "18px 16px 80px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{
        margin: "0 0 24px", fontSize: 24, fontWeight: 700, color: C.text,
        fontFamily: "'Cormorant Garamond',Georgia,serif", letterSpacing: "0.02em",
      }}>Réglages</h1>

      <AvailabilityCard availability={availability} onSave={onSaveAvailability} />

      <section style={{
        background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "20px 18px", boxShadow: C.shadow1, marginBottom: 16,
      }}>
        <div style={{
          color: C.gold, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8,
        }}>Abonnement calendrier iPhone</div>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 16px" }}>
          Abonne ton iPhone à ce lien pour retrouver toutes tes séances dans l'app
          Calendrier iOS. Les nouvelles séances créées dans l'app apparaîtront
          automatiquement (mise à jour environ toutes les heures côté iOS).
        </p>

        {!feedUrl ? (
          <div style={{
            background: C.redAlpha, border: "1px solid rgba(204,68,68,0.35)",
            borderRadius: 10, padding: "12px 14px",
            color: C.red, fontSize: 12, lineHeight: 1.5,
          }}>
            Le lien d'abonnement n'est pas encore configuré. Contacte l'admin
            pour ajouter <code>VITE_ICAL_FEED_TOKEN</code> dans Vercel.
          </div>
        ) : (
          <>
            <div style={{
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "10px 12px", marginBottom: 12,
              color: C.text, fontSize: 11, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
              wordBreak: "break-all", userSelect: "all",
            }}>{feedUrl}</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
              <Btn onClick={copy}>{copied ? "✓ Copié" : "Copier le lien"}</Btn>
              <a
                href={webcalUrl}
                style={{ textDecoration: "none" }}
                onClick={e => { if (!webcalUrl) e.preventDefault(); }}
              >
                <Btn variant="outline">Ouvrir dans Calendrier</Btn>
              </a>
            </div>

            <details style={{ color: C.muted, fontSize: 12 }}>
              <summary style={{ cursor: "pointer", color: C.gold, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Comment s'abonner manuellement ?
              </summary>
              <ol style={{ margin: "10px 0 0 18px", padding: 0, lineHeight: 1.7 }}>
                <li>iPhone → <strong>Réglages</strong></li>
                <li><strong>Calendrier</strong> → <strong>Comptes</strong> → <strong>Ajouter un compte</strong></li>
                <li><strong>Autre</strong> → <strong>Ajouter un calendrier avec abonnement</strong></li>
                <li>Colle le lien ci-dessus et valide</li>
              </ol>
              <div style={{ marginTop: 12, color: C.muted2, fontSize: 11, lineHeight: 1.6 }}>
                Ne partage pas ce lien — il donne accès à toutes tes séances.
              </div>
            </details>
          </>
        )}
      </section>
    </div>
  );
}

function AvailabilityCard({ availability, onSave }) {
  const initial = useMemo(() => normalizeAvailability(availability || defaultAvailability()), [availability]);
  const [draft, setDraft] = useState(initial);

  // The form is seeded from `initial` on mount; subsequent props updates reset the draft
  // only when we haven't diverged (otherwise we'd clobber the user's in-progress edits).
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const updateDay = (key, patch) => {
    setDraft(d => ({ ...d, [key]: { ...d[key], ...patch } }));
  };

  const save = () => {
    if (typeof onSave === "function") onSave(draft);
  };
  const reset = () => setDraft(initial);

  return (
    <section style={{
      background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "20px 18px", boxShadow: C.shadow1, marginBottom: 16,
    }}>
      <div style={{
        color: C.gold, fontSize: 11, fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8,
      }}>Disponibilités hebdomadaires</div>
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, margin: "0 0 16px" }}>
        Tes horaires de travail habituels, affichés dans le Calendrier. Les jours de
        repos apparaissent en grisé.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DAY_KEYS.map(key => {
          const rec = draft[key];
          return (
            <div key={key} style={{
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "10px 12px",
              display: "grid",
              gridTemplateColumns: "80px 1fr 1fr auto",
              alignItems: "center",
              gap: 10,
              opacity: rec.off ? 0.6 : 1,
            }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>
                {DAY_LABELS_FR[key]}
              </div>
              <Input
                type="time"
                value={rec.start}
                disabled={rec.off}
                onChange={e => updateDay(key, { start: e.target.value })}
                style={{ padding: "6px 8px", fontSize: 12 }}
              />
              <Input
                type="time"
                value={rec.end}
                disabled={rec.off}
                onChange={e => updateDay(key, { end: e.target.value })}
                style={{ padding: "6px 8px", fontSize: 12 }}
              />
              <label style={{
                display: "flex", alignItems: "center", gap: 6,
                color: C.muted, fontSize: 11, cursor: "pointer",
                userSelect: "none",
              }}>
                <input
                  type="checkbox"
                  checked={rec.off}
                  onChange={e => updateDay(key, { off: e.target.checked })}
                  style={{ cursor: "pointer", accentColor: C.gold }}
                />
                Repos
              </label>
            </div>
          );
        })}
      </div>

      {dirty && (
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          marginTop: 16,
        }}>
          <Btn variant="ghost" onClick={reset}>Annuler</Btn>
          <Btn onClick={save}>Enregistrer</Btn>
        </div>
      )}
    </section>
  );
}
