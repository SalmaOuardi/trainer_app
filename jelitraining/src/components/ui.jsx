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
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}
export function Btn({ children, onClick, variant = "gold", style = {}, disabled = false }) {
  const v = {
    gold: { background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, color: "#000", border: "none", boxShadow: C.shadowGold },
    ghost: { background: C.s3, color: C.text, border: `1px solid ${C.border}`, boxShadow: "none" },
    outline: { background: "transparent", border: `1px solid ${C.goldBorder}`, color: C.gold, boxShadow: "none" },
    danger: { background: C.redAlpha, border: "1px solid rgba(204,68,68,0.35)", color: C.red, boxShadow: "none" },
    orange: { background: C.orangeAlpha, border: "1px solid rgba(204,136,51,0.4)", color: C.orange, boxShadow: "none" },
  };
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.filter = "brightness(1.1)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "brightness(1)"; }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "translateY(0) scale(0.98)"; }}
      onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      style={{ padding: "10px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.2s ease", opacity: disabled ? 0.4 : 1, letterSpacing: "0.01em", ...v[variant], ...style }}>
      {children}
    </button>
  );
}
export function Tag({ children, color = C.muted }) {
  return (
    <span style={{ background: `${color}18`, border: `1px solid ${color}33`, color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
      {children}
    </span>
  );
}
export function Empty({ icon = "📭", text }) {
  return (
    <div style={{ padding: "56px 24px", textAlign: "center", background: C.s1, borderRadius: 14, border: `1px solid ${C.border}`, animation: "fadeIn 0.4s ease" }}>
      <div style={{ fontSize: 38, marginBottom: 14, filter: "grayscale(0.2)" }}>{icon}</div>
      <p style={{ color: C.muted, margin: 0, fontSize: 14, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}
export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: C.s2, border: `1px solid ${C.goldBorder}`, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)`, animation: "fadeInScale 0.25s ease" }}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: C.gold, fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</span>
          <button onClick={onClose}
            onMouseEnter={e => { e.currentTarget.style.background = C.s3; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}
            style={{ background: "transparent", border: "none", color: C.muted, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "4px 8px", borderRadius: 8, transition: "all 0.15s" }}>×</button>
        </div>
        <div className="modal-body" style={{ padding: "24px 24px 28px" }}>{children}</div>
      </div>
    </div>
  );
}
export function TabSection({ title, onAdd, addLabel = "+ Ajouter", children, extra }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 8 }}>{extra}{onAdd && <Btn onClick={onAdd}>{addLabel}</Btn>}</div>
      </div>
      {children}
    </div>
  );
}
export function ItemRow({ left, right, onDelete }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.boxShadow = C.shadow1; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
      style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, transition: "all 0.2s ease" }}>
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {right}
        <button onClick={onDelete}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = C.redAlpha; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.55"; e.currentTarget.style.background = "transparent"; }}
          style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 13, opacity: 0.55, padding: "4px 6px", lineHeight: 1, borderRadius: 6, transition: "all 0.15s" }}>✕</button>
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
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, transition: "all 0.3s", animation: "fadeIn 0.3s ease" }}>
      {s.text}
    </span>
  );
}
export function typeColor(t) {
  return { Muscu: C.gold, Cardio: "#5aaccc", Stretching: "#9a77cc", HIIT: "#cc5555", Circuit: "#5acc99", Autre: C.muted }[t] || C.muted;
}
export { iStyle };
