import { useState } from "react";
import { C, iStyle } from "../theme.js";
import { hashPw } from "../lib.js";
import { sbGetPw, sbSetPw, AUTH_KEY, DEFAULT_PW } from "../api.js";
import { Modal, Field, Btn } from "./ui.jsx";

export function LoginScreen({ onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    const entered = await hashPw(pw);
    let stored = await sbGetPw();
    if (!stored) {
      const defaultHash = await hashPw(DEFAULT_PW);
      await sbSetPw(defaultHash);
      stored = defaultHash;
    }
    if (entered === stored) {
      localStorage.setItem(AUTH_KEY, "1");
      onAuth();
    } else {
      setError(true);
      setPw("");
      setTimeout(() => setError(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.goldAlpha, border: `2px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ color: C.gold, fontWeight: 700, fontSize: 22, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{import.meta.env.VITE_COACH_INITIALS}</span>
          </div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 20, letterSpacing: "0.06em", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            JELI<span style={{ color: C.gold }}>TRAINING</span>
          </div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Coach Dashboard</div>
        </div>
        <div style={{ background: C.s1, border: `1px solid ${error ? C.red : C.border}`, borderRadius: 14, padding: 28, transition: "border-color 0.2s" }}>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Mot de passe</div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type={show ? "text" : "password"} value={pw}
              onChange={e => { setPw(e.target.value); setError(false); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="••••••••" autoFocus
              style={{ ...iStyle, border: `1px solid ${error ? C.red : C.border}`, padding: "10px 40px 10px 12px", fontSize: 15, transition: "border-color 0.2s" }}
            />
            <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 15, padding: 2, lineHeight: 1 }}>
              {show ? "🙈" : "👁"}
            </button>
          </div>
          {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12, textAlign: "center" }}>Mot de passe incorrect</div>}
          <button onClick={submit} disabled={loading}
            style={{ width: "100%", padding: "11px 0", borderRadius: 8, background: C.gold, border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit" }}>
            {loading ? "Vérification…" : "Accéder au dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChangePasswordModal({ onClose }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!cur || !next || !confirm) { setError("Tous les champs sont requis."); return; }
    if (next.length < 6) { setError("Le nouveau mot de passe doit faire au moins 6 caractères."); return; }
    if (next !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true); setError("");
    const curHash = await hashPw(cur);
    const stored = await sbGetPw();
    if (!stored || curHash !== stored) { setError("Mot de passe actuel incorrect."); setLoading(false); return; }
    await sbSetPw(await hashPw(next));
    setSuccess(true);
    setLoading(false);
    setTimeout(onClose, 1800);
  };

  return (
    <Modal title="🔑 CHANGER LE MOT DE PASSE" onClose={onClose}>
      {success
        ? <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>Mot de passe mis à jour !</div>
          </div>
        : <>
            <Field label="Mot de passe actuel"><input type="password" value={cur} onChange={e => setCur(e.target.value)} style={iStyle} placeholder="••••••••" /></Field>
            <Field label="Nouveau mot de passe"><input type="password" value={next} onChange={e => setNext(e.target.value)} style={iStyle} placeholder="Minimum 6 caractères" /></Field>
            <Field label="Confirmer le nouveau mot de passe"><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} style={iStyle} placeholder="••••••••" /></Field>
            {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12, background: C.redAlpha, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
              <Btn onClick={submit} disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Btn>
            </div>
          </>
      }
    </Modal>
  );
}
