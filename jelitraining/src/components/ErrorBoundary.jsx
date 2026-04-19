import { Component } from "react";
import { C } from "../theme.js";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 20, fontFamily: "'Cormorant Garamond',Georgia,serif", marginBottom: 10 }}>
            Une erreur est survenue
          </div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 28 }}>
            L'application a rencontré un problème inattendu. Vos données sont sauvegardées.
          </div>
          <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Détail technique</div>
            <code style={{ color: C.orange, fontSize: 12, wordBreak: "break-all" }}>{this.state.error?.message || "Erreur inconnue"}</code>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "11px 28px", borderRadius: 8, background: C.gold, border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Recharger l'application
          </button>
        </div>
      </div>
    );
  }
}
