import { useState } from "react";
import { Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
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
      <div style={{ width: "100%", maxWidth: 380, animation: "fadeIn 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${C.goldAlpha}, rgba(201,168,76,0.22))`, border: `2px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", boxShadow: `0 8px 32px rgba(201,168,76,0.15)`, animation: "fadeInScale 0.6s ease" }}>
            <span style={{ color: C.gold, fontWeight: 700, fontSize: 24, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{import.meta.env.VITE_COACH_INITIALS}</span>
          </div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 22, letterSpacing: "0.06em", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            JELI<span style={{ color: C.gold }}>TRAINING</span>
          </div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>Coach Dashboard</div>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${C.s1}, ${C.s2})`, border: `1px solid ${error ? C.red : C.border}`, borderRadius: 16, padding: 32, transition: "border-color 0.3s, box-shadow 0.3s", boxShadow: error ? `0 0 20px rgba(204,68,68,0.15)` : C.shadow2 }}>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 500 }}>Mot de passe</div>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <input
              type={show ? "text" : "password"} value={pw}
              onChange={e => { setPw(e.target.value); setError(false); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="••••••••" autoFocus
              style={{ ...iStyle, border: `1px solid ${error ? C.red : C.border}`, padding: "12px 42px 12px 14px", fontSize: 15, transition: "border-color 0.2s, box-shadow 0.2s" }}
            />
            <button onClick={() => setShow(s => !s)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 6, lineHeight: 0, borderRadius: 6, transition: "color 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
            >
              {show ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
            </button>
          </div>
          {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 14, textAlign: "center", animation: "fadeIn 0.2s ease" }}>Mot de passe incorrect</div>}
          <button onClick={submit} disabled={loading}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = C.shadowGold; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit", transition: "all 0.2s ease", letterSpacing: "0.02em" }}>
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
    <Modal title={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><KeyRound size={14} strokeWidth={2} /> CHANGER LE MOT DE PASSE</span>} onClose={onClose}>
      {success
        ? <div style={{ textAlign: "center", padding: "24px 0", animation: "fadeInScale 0.3s ease" }}>
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
              <CheckCircle2 size={44} strokeWidth={1.5} color={C.green} />
            </div>
            <div style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>Mot de passe mis à jour !</div>
          </div>
        : <>
            <Field label="Mot de passe actuel"><input type="password" value={cur} onChange={e => setCur(e.target.value)} style={iStyle} placeholder="••••••••" /></Field>
            <Field label="Nouveau mot de passe"><input type="password" value={next} onChange={e => setNext(e.target.value)} style={iStyle} placeholder="Minimum 6 caractères" /></Field>
            <Field label="Confirmer le nouveau mot de passe"><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} style={iStyle} placeholder="••••••••" /></Field>
            {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 14, background: C.redAlpha, borderRadius: 10, padding: "9px 14px", animation: "fadeIn 0.2s ease" }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
              <Btn onClick={submit} disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Btn>
            </div>
          </>
      }
    </Modal>
  );
}
