import { C, iStyle } from "../theme.js";

export function Input({ style, ...p }) {
  return <input {...p} style={{ ...iStyle, ...style }} />;
}
export function Textarea({ style, ...p }) {
  return <textarea rows={3} {...p} style={{ ...iStyle, resize: "vertical", ...style }} />;
}
export function Sel({ children, style, ...p }) {
  return <select {...p} style={{ ...iStyle, ...style }}>{children}</select>;
}
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
export function Btn({ children, onClick, variant = "gold", style = {}, disabled = false }) {
  const v = {
    gold: { background: C.gold, color: "#000", border: "none" },
    ghost: { background: C.s3, color: C.text, border: `1px solid ${C.border}` },
    outline: { background: "transparent", border: `1px solid ${C.goldBorder}`, color: C.gold },
    danger: { background: C.redAlpha, border: "1px solid rgba(204,68,68,0.35)", color: C.red },
    orange: { background: C.orangeAlpha, border: "1px solid rgba(204,136,51,0.4)", color: C.orange },
  };
  return (
    <button disabled={disabled} onClick={onClick}
      style={{ padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", transition: "opacity 0.15s", opacity: disabled ? 0.4 : 1, ...v[variant], ...style }}>
      {children}
    </button>
  );
}
export function Tag({ children, color = C.muted }) {
  return (
    <span style={{ background: `${color}22`, border: `1px solid ${color}44`, color, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
export function Empty({ icon = "📭", text }) {
  return (
    <div style={{ padding: "52px 24px", textAlign: "center", background: C.s1, borderRadius: 12, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 34, marginBottom: 12 }}>{icon}</div>
      <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}
export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.s2, border: `1px solid ${C.goldBorder}`, borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: C.gold, fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
export function TabSection({ title, onAdd, addLabel = "+ Ajouter", children, extra }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 8 }}>{extra}{onAdd && <Btn onClick={onAdd}>{addLabel}</Btn>}</div>
      </div>
      {children}
    </div>
  );
}
export function ItemRow({ left, right, onDelete }) {
  return (
    <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {right}
        <button onClick={onDelete} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14, opacity: 0.55, padding: 2, lineHeight: 1 }}>✕</button>
      </div>
    </div>
  );
}
export function SaveBadge({ status }) {
  if (status === "idle") return null;
  const map = {
    saving: { bg: "rgba(201,168,76,0.15)", border: "rgba(201,168,76,0.4)", color: C.gold, text: "💾 Sauvegarde…" },
    saved:  { bg: "rgba(90,170,90,0.15)",  border: "rgba(90,170,90,0.4)",  color: C.green, text: "✓ Sauvegardé" },
    error:  { bg: "rgba(204,68,68,0.15)",  border: "rgba(204,68,68,0.4)",  color: C.red,   text: "⚠ Erreur save" },
  };
  const s = map[status];
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, transition: "all 0.3s" }}>
      {s.text}
    </span>
  );
}
export function typeColor(t) {
  return { Muscu: C.gold, Cardio: "#5aaccc", Stretching: "#9a77cc", HIIT: "#cc5555", Circuit: "#5acc99", Autre: C.muted }[t] || C.muted;
}
export { iStyle };
