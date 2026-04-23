import { useState } from "react";
import { C } from "../theme.js";
import { Btn } from "./ui.jsx";

const FEED_TOKEN = import.meta.env.VITE_ICAL_FEED_TOKEN || "";

export function SettingsView() {
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
