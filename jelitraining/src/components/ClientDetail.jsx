import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { C } from "../theme.js";
import { gid, fdate, fmoney, today } from "../utils.js";
import { calcNutrition, ACTIVITY_LEVELS } from "../lib.js";
import { Input, Textarea, Sel, Field, Btn, Tag, Empty, Modal, TabSection, ItemRow, typeColor } from "./ui.jsx";

/* ─── Weight Chart ─── */
function WeightChart({ measurements }) {
  const data = [...measurements].filter(m => m.weight).sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(m => ({ date: fdate(m.date), poids: parseFloat(m.weight) }));
  if (data.length < 2) return null;
  const min = Math.min(...data.map(d => d.poids)) - 2;
  const max = Math.max(...data.map(d => d.poids)) + 2;
  const diff = data[data.length - 1].poids - data[0].poids;
  const diffColor = diff < 0 ? C.green : diff > 0 ? C.red : C.muted;
  return (
    <div style={{ background: `linear-gradient(135deg, ${C.s2}, ${C.s1})`, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 20px", marginBottom: 24, boxShadow: C.shadow1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>📊 Évolution du poids</span>
        <span style={{ color: diffColor, fontWeight: 700, fontSize: 13, background: `${diffColor}18`, padding: "4px 12px", borderRadius: 20, border: `1px solid ${diffColor}44` }}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis domain={[min, max]} tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: C.s1, border: `1px solid ${C.goldBorder}`, borderRadius: 8, color: C.text, fontSize: 12 }} formatter={v => [`${v} kg`, "Poids"]} />
          <Line type="monotone" dataKey="poids" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: C.goldLight }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Nutrition ─── */
function MacroBar({ prot, lip, gluc }) {
  const tot = (prot * 4) + (lip * 9) + (gluc * 4);
  const pP = Math.round((prot * 4 / tot) * 100), pL = Math.round((lip * 9 / tot) * 100), pG = 100 - pP - pL;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 6, marginBottom: 8 }}>
        <div style={{ width: `${pP}%`, background: "#5aaccc" }} /><div style={{ width: `${pL}%`, background: C.gold }} /><div style={{ width: `${pG}%`, background: "#9a77cc" }} />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[{ l: "Protéines", v: `${prot}g`, c: "#5aaccc" }, { l: "Lipides", v: `${lip}g`, c: C.gold }, { l: "Glucides", v: `${gluc}g`, c: "#9a77cc" }].map(m => (
          <span key={m.l} style={{ fontSize: 12, color: C.muted }}><span style={{ color: m.c, fontWeight: 700 }}>{m.v}</span> {m.l}</span>
        ))}
      </div>
    </div>
  );
}

function NutritionCard({ label, emoji, data, accent, note }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = C.shadow2; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = C.shadow1; }}
      style={{ background: `linear-gradient(135deg, ${C.s2}, ${C.s1})`, border: `1px solid ${accent ? C.goldBorder : C.border}`, borderRadius: 14, padding: "18px 20px", transition: "all 0.25s ease", boxShadow: C.shadow1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{emoji} {label}</div>
          <div style={{ color: accent ? C.gold : C.text, fontSize: 26, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif", marginTop: 4 }}>{data.cal} <span style={{ fontSize: 14, fontWeight: 400 }}>kcal</span></div>
        </div>
        {note && <span style={{ background: C.goldAlpha, border: `1px solid ${C.goldBorder}`, color: C.gold, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{note}</span>}
      </div>
      <MacroBar {...data} />
    </div>
  );
}

function AnalyseTab({ client, onEdit }) {
  const n = calcNutrition(client);
  if (!n) return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
      <p style={{ color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>Les données physiques sont incomplètes.<br />Renseigne le poids, la taille et l'âge pour générer l'analyse.</p>
      <Btn onClick={onEdit}>✏️ Compléter le profil</Btn>
    </div>
  );
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.s2}, ${C.s1})`, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 22, display: "flex", gap: 28, flexWrap: "wrap", boxShadow: C.shadow1 }}>
        {[{ l: "Poids", v: `${n.poids} kg` }, { l: "Taille", v: `${client.height} cm` }, { l: "Âge", v: `${client.age} ans` }, { l: "Sexe", v: client.sexe === "femme" ? "Femme" : "Homme" }, { l: "Activité", v: n.actLabel }, { l: "IMC", v: `${n.imc} · ${n.imcLabel}` }, { l: "Métabolisme de base", v: `${n.bmr} kcal` }, { l: "TDEE", v: `${n.tdee} kcal` }].map(i => (
          <div key={i.l}><div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>{i.l}</div><div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginTop: 3 }}>{i.v}</div></div>
        ))}
      </div>
      <div style={{ color: C.gold, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Objectifs caloriques & macros</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14, marginBottom: 22 }}>
        <NutritionCard label="Maintien calorique" emoji="⚖️" data={n.maintien} accent note="Référence" />
        <NutritionCard label="Perte de masse grasse" emoji="🔥" data={n.perteMG} note="-400 kcal" />
        <NutritionCard label="Prise de masse" emoji="💪" data={n.priseMasse} note="+300 kcal" />
      </div>
      <div style={{ background: `linear-gradient(135deg, ${C.goldAlpha}, rgba(201,168,76,0.06))`, border: `1px solid ${C.goldBorder}`, borderRadius: 14, padding: "18px 20px", boxShadow: `0 4px 16px rgba(201,168,76,0.08)` }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12, letterSpacing: "0.02em" }}>💡 Recommandations personnalisées</div>
        {[
          `🥩 Protéines cibles : ${Math.round(n.poids * 2)}g/jour (2g par kg de poids corporel)`,
          `💧 Hydratation : ${(n.poids * 0.035).toFixed(1)}L d'eau/jour minimum`,
          `🍽️ Répartition sur ${client.mealsPerDay || 3} repas : ~${Math.round(n.maintien.cal / (client.mealsPerDay || 3))} kcal par repas (maintien)`,
          `⚡ Calcul basé sur la formule Mifflin-St Jeor · Niveau d'activité : ${n.actLabel}`,
          client.restrictions ? `⚠️ Restrictions / infos médicales : ${client.restrictions}` : null,
        ].filter(Boolean).map((t, i) => <div key={i} style={{ color: C.text, fontSize: 13, marginBottom: 6 }}>{t}</div>)}
      </div>
    </div>
  );
}

/* ─── Programme Tab ─── */
function ProgrammeTab({ client, savedProgrammes = [], onSave, onRemove }) {
  const [prog, setProg] = useState({ title: "Programme personnalisé", duration: "4", days: "3", level: "Intermédiaire", goal: client.goal || "", warmup: "5-10 min cardio léger + mobilité articulaire", exercises: [{ id: gid(), name: "", sets: "3", reps: "10", rest: "60", notes: "" }], cooldown: "5 min étirements statiques" });
  const setP = k => e => setProg(p => ({ ...p, [k]: e.target.value }));
  const setEx = (id, k) => e => setProg(p => ({ ...p, exercises: p.exercises.map(ex => ex.id === id ? { ...ex, [k]: e.target.value } : ex) }));
  const addEx = () => setProg(p => ({ ...p, exercises: [...p.exercises, { id: gid(), name: "", sets: "3", reps: "10", rest: "60", notes: "" }] }));
  const removeEx = id => setProg(p => ({ ...p, exercises: p.exercises.filter(ex => ex.id !== id) }));
  const nutri = calcNutrition(client);
  const calTarget = nutri ? (prog.goal?.toLowerCase().includes("masse") ? nutri.priseMasse : prog.goal?.toLowerCase().includes("perte") || prog.goal?.toLowerCase().includes("sèche") ? nutri.perteMG : nutri.maintien) : null;

  const generatePDF = async () => {
    const env = import.meta.env;
    const coachFullName = env.VITE_COACH_FULLNAME || env.VITE_COACH_NAME || "Coach";
    const coachTitle = env.VITE_COACH_TITLE || "Coach Personnel";
    const coachCity = env.VITE_COACH_CITY || "";
    const coachEmail = env.VITE_COACH_EMAIL || "";
    const coachInsta = env.VITE_COACH_INSTAGRAM || "";
    const slug = s => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    const filename = `Programme-${slug(client.firstName)}-${slug(client.lastName)}-${today()}.pdf`;

    const nutriBlock = nutri && calTarget ? `
<div class="pdf-section-title">Bilan nutritionnel personnalisé</div>
<div class="pdf-nutri-grid">
  <div class="pdf-nutri-card pdf-nutri-main">
    <div class="pdf-nutri-label">Objectif calorique (${prog.goal || "maintien"})</div>
    <div class="pdf-nutri-val">${calTarget.cal} <span>kcal/jour</span></div>
    <div class="pdf-nutri-macros"><span style="color:#5aaccc">P : ${calTarget.prot}g</span><span style="color:#C9A84C">L : ${calTarget.lip}g</span><span style="color:#9a77cc">G : ${calTarget.gluc}g</span></div>
  </div>
  <div class="pdf-nutri-card"><div class="pdf-nutri-label">Maintien</div><div class="pdf-nutri-val">${nutri.maintien.cal} <span>kcal</span></div></div>
  <div class="pdf-nutri-card"><div class="pdf-nutri-label">Perte MG</div><div class="pdf-nutri-val">${nutri.perteMG.cal} <span>kcal</span></div></div>
  <div class="pdf-nutri-card"><div class="pdf-nutri-label">Prise masse</div><div class="pdf-nutri-val">${nutri.priseMasse.cal} <span>kcal</span></div></div>
</div>
<div class="pdf-info-box" style="margin-top:10px;font-size:12px;">
  <b>Protéines :</b> ${Math.round((client.weight || 0) * 2)}g/jour &nbsp;·&nbsp; <b>Eau :</b> ${((client.weight || 0) * 0.035).toFixed(1)}L/jour &nbsp;·&nbsp; <b>${client.mealsPerDay || 3} repas :</b> ~${Math.round(calTarget.cal / (client.mealsPerDay || 3))} kcal/repas
  ${client.restrictions ? `<br><b>Restrictions :</b> ${client.restrictions}` : ""}
</div>` : "";

    const css = `
#pdf-render{font-family:Helvetica,Arial,sans-serif;background:#fff;color:#111;width:800px;padding:40px;box-sizing:border-box;}
#pdf-render *{box-sizing:border-box;margin:0;padding:0;}
#pdf-render .pdf-header{background:#111;color:#fff;padding:32px 40px;margin:-40px -40px 32px;display:flex;justify-content:space-between;align-items:center;}
#pdf-render .pdf-logo{font-size:28px;font-weight:900;letter-spacing:0.06em;color:#fff;}
#pdf-render .pdf-logo span{color:#C9A84C;}
#pdf-render .pdf-header-right{text-align:right;color:#bbb;font-size:12px;line-height:1.8;}
#pdf-render .pdf-title{font-size:22px;font-weight:900;margin-bottom:6px;color:#111;}
#pdf-render .pdf-subtitle{color:#888;font-size:13px;margin-bottom:24px;}
#pdf-render .pdf-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:28px;}
#pdf-render .pdf-badge{background:#f5f5f5;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;color:#111;}
#pdf-render .pdf-badge b{color:#C9A84C;}
#pdf-render .pdf-section-title{font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#999;font-weight:700;margin:24px 0 10px;padding-bottom:6px;border-bottom:2px solid #C9A84C;}
#pdf-render .pdf-info-box{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:12px 16px;font-size:13px;color:#555;}
#pdf-render .pdf-nutri-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;margin-top:8px;}
#pdf-render .pdf-nutri-card{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:12px 14px;}
#pdf-render .pdf-nutri-main{background:#111;border-color:#C9A84C;}
#pdf-render .pdf-nutri-main .pdf-nutri-label{color:#bbb;}
#pdf-render .pdf-nutri-main .pdf-nutri-val{color:#C9A84C;}
#pdf-render .pdf-nutri-label{font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#999;margin-bottom:6px;}
#pdf-render .pdf-nutri-val{font-size:22px;font-weight:900;color:#111;}
#pdf-render .pdf-nutri-val span{font-size:12px;font-weight:400;color:#aaa;}
#pdf-render .pdf-nutri-macros{display:flex;gap:12px;margin-top:8px;font-size:12px;font-weight:700;}
#pdf-render table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;}
#pdf-render th{background:#111;color:#C9A84C;padding:10px 14px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;}
#pdf-render td{padding:10px 14px;border-bottom:1px solid #f0f0f0;vertical-align:top;color:#111;}
#pdf-render tr:nth-child(even) td{background:#fafafa;}
#pdf-render .pdf-num{font-weight:700;color:#C9A84C;font-size:15px;}
#pdf-render .pdf-footer{margin-top:40px;padding-top:16px;border-top:2px solid #C9A84C;display:flex;justify-content:space-between;align-items:center;}
#pdf-render .pdf-footer-logo{font-weight:900;font-size:16px;letter-spacing:0.06em;color:#111;}
#pdf-render .pdf-footer-logo span{color:#C9A84C;}
#pdf-render .pdf-footer-right{font-size:11px;color:#888;text-align:right;line-height:1.7;}
`;

    const body = `
<div class="pdf-header"><div class="pdf-logo">JELI<span>TRAINING</span></div><div class="pdf-header-right">${coachTitle}${coachCity ? ` · ${coachCity}` : ""}<br>${coachEmail}<br>${coachInsta}</div></div>
<div class="pdf-title">${prog.title}</div>
<div class="pdf-subtitle">Client : ${client.firstName} ${client.lastName}${client.weight ? ` · ${client.weight}kg` : ""} · Généré le ${fdate(today())}</div>
<div class="pdf-meta">
  <div class="pdf-badge">Durée : <b>${prog.duration} semaines</b></div>
  <div class="pdf-badge">Fréquence : <b>${prog.days} jours / semaine</b></div>
  <div class="pdf-badge">Niveau : <b>${prog.level}</b></div>
  ${prog.goal ? `<div class="pdf-badge">Objectif : <b>${prog.goal}</b></div>` : ""}
</div>
${nutriBlock}
<div class="pdf-section-title">Échauffement</div><div class="pdf-info-box">${prog.warmup}</div>
<div class="pdf-section-title">Programme d'exercices</div>
<table><thead><tr><th>#</th><th>Exercice</th><th>Séries</th><th>Répétitions</th><th>Repos</th><th>Notes coach</th></tr></thead>
<tbody>${prog.exercises.map((ex, i) => `<tr><td class="pdf-num">${i + 1}</td><td><b>${ex.name || "—"}</b></td><td>${ex.sets}</td><td>${ex.reps}</td><td>${ex.rest}s</td><td style="color:#888">${ex.notes || "—"}</td></tr>`).join("")}</tbody></table>
<div class="pdf-section-title">Retour au calme</div><div class="pdf-info-box">${prog.cooldown}</div>
<div class="pdf-footer"><div class="pdf-footer-logo">JELI<span>TRAINING</span></div><div class="pdf-footer-right">${coachFullName} · ${coachTitle}<br>${coachEmail}${coachInsta ? ` · ${coachInsta}` : ""}</div></div>
`;

    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    const container = document.createElement("div");
    container.id = "pdf-render";
    container.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1;";
    container.innerHTML = body;
    document.body.appendChild(container);

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(r => setTimeout(r, 150));
      const { default: html2pdf } = await import("html2pdf.js");
      const blob = await html2pdf().from(container).set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 800,
          onclone: (doc) => {
            const s = doc.createElement("style");
            s.textContent = css;
            doc.head.appendChild(s);
            const el = doc.getElementById("pdf-render");
            if (el) el.style.cssText = "position:static;opacity:1;";
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).output("blob");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert("Erreur PDF : " + (err && err.message ? err.message : err));
      console.error(err);
    } finally {
      document.body.removeChild(container);
      document.head.removeChild(styleEl);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>Générateur de programme</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="ghost" onClick={() => { if (onSave) onSave({ ...prog, savedAt: today(), source: "manuel" }); alert("Programme sauvegardé dans la fiche client ✓"); }}>💾 Sauvegarder</Btn>
          <Btn onClick={generatePDF}>📄 Générer PDF</Btn>
        </div>
      </div>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Titre du programme"><Input value={prog.title} onChange={setP("title")} /></Field>
        <Field label="Objectif"><Input value={prog.goal} onChange={setP("goal")} placeholder="Ex : Prise de masse" /></Field>
        <Field label="Durée (semaines)"><Input type="number" value={prog.duration} onChange={setP("duration")} /></Field>
        <Field label="Jours / semaine"><Input type="number" value={prog.days} onChange={setP("days")} /></Field>
        <Field label="Niveau"><Sel value={prog.level} onChange={setP("level")}>{["Débutant", "Intermédiaire", "Avancé"].map(l => <option key={l}>{l}</option>)}</Sel></Field>
      </div>
      <Field label="Échauffement"><Input value={prog.warmup} onChange={setP("warmup")} /></Field>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Exercices</label>
          <Btn variant="outline" onClick={addEx} style={{ padding: "5px 12px", fontSize: 12 }}>+ Exercice</Btn>
        </div>
        {prog.exercises.map((ex, i) => (
          <div key={ex.id} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: C.gold, fontWeight: 700, fontSize: 12 }}>Exercice #{i + 1}</span>
              {prog.exercises.length > 1 && <button onClick={() => removeEx(ex.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", opacity: 0.6, fontSize: 12, fontFamily: "inherit" }}>✕ Retirer</button>}
            </div>
            <div className="grid-ex" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0 10px" }}>
              <Field label="Exercice"><Input value={ex.name} onChange={setEx(ex.id, "name")} placeholder="Ex : Squat barre" /></Field>
              <Field label="Séries"><Input type="number" value={ex.sets} onChange={setEx(ex.id, "sets")} /></Field>
              <Field label="Reps"><Input value={ex.reps} onChange={setEx(ex.id, "reps")} placeholder="10" /></Field>
              <Field label="Repos (s)"><Input type="number" value={ex.rest} onChange={setEx(ex.id, "rest")} /></Field>
            </div>
            <Field label="Notes coach"><Input value={ex.notes} onChange={setEx(ex.id, "notes")} placeholder="Tempo, consignes, sensation…" /></Field>
          </div>
        ))}
      </div>
      <Field label="Retour au calme"><Input value={prog.cooldown} onChange={setP("cooldown")} /></Field>
      <div style={{ background: C.goldAlpha, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: "12px 16px", marginTop: 4 }}>
        <p style={{ color: C.gold, fontSize: 12, margin: 0 }}>💡 Le PDF s'ouvrira dans un nouvel onglet — tu peux l'imprimer ou le sauvegarder directement.</p>
      </div>
      {savedProgrammes.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginBottom: 16 }}>
            <div style={{ color: C.gold, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>📚 Programmes sauvegardés ({savedProgrammes.length})</div>
          </div>
          {[...savedProgrammes].sort((a, b) => b.savedAt > a.savedAt ? 1 : -1).map(sp => (
            <div key={sp.id} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{sp.title}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>Sauvegardé le {fdate(sp.savedAt)}</span>
                </div>
                <div style={{ color: C.muted, fontSize: 12 }}>{sp.exercises?.length || 0} exercices · {sp.duration} sem. · {sp.days} j/sem · {sp.level}</div>
                {sp.goal && <div style={{ color: C.muted, fontSize: 12 }}>🎯 {sp.goal}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Btn variant="outline" onClick={() => setProg({ ...sp })} style={{ padding: "6px 12px", fontSize: 12 }}>Charger</Btn>
                <button onClick={() => { if (window.confirm("Supprimer ce programme ?")) onRemove(sp.id); }} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", opacity: 0.6, fontSize: 14 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Packs Tab ─── */
function PacksTab({ client, onAdd, mutations }) {
  const packs = client.packs || [];
  const sessions = client.sessions || [];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>Suivi des packs</h3>
        <Btn onClick={onAdd}>+ Nouveau pack</Btn>
      </div>
      {packs.length === 0 ? <Empty icon="📦" text="Aucun pack enregistré — ajoute le premier !" /> :
        packs.map(pack => {
          const used = pack.manualUsed != null ? pack.manualUsed : sessions.filter(s => s.date >= pack.startDate).length;
          const total = parseInt(pack.totalSessions) || 0;
          const remaining = Math.max(0, total - used);
          const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
          const urgColor = remaining === 0 ? C.red : remaining <= 2 ? C.orange : C.green;
          return (
            <div key={pack.id} style={{ background: `linear-gradient(135deg, ${C.s2}, ${C.s1})`, border: `1px solid ${remaining === 0 ? C.redAlpha.replace("0.12", "0.4") : C.border}`, borderRadius: 14, padding: "20px 22px", marginBottom: 14, boxShadow: C.shadow1, transition: "all 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{pack.name}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{fmoney(pack.price)} · Acheté le {fdate(pack.startDate)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: urgColor, fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{remaining}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>restantes</div>
                  </div>
                  <button onClick={() => { if (window.confirm("Supprimer ce pack ?")) mutations.removePack(pack.id); }} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", opacity: 0.5, fontSize: 16, padding: 4 }}>✕</button>
                </div>
              </div>
              <div style={{ background: C.s3, borderRadius: 10, height: 8, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg, ${C.red}, #e05555)` : pct >= 75 ? `linear-gradient(90deg, ${C.orange}, #dda040)` : `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, borderRadius: 10, transition: "width 0.5s ease", boxShadow: `0 0 8px ${pct === 100 ? 'rgba(204,68,68,0.3)' : pct >= 75 ? 'rgba(204,136,51,0.3)' : 'rgba(201,168,76,0.3)'}` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ color: C.muted, fontSize: 12 }}>{used} / {total} séances utilisées</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => mutations.updatePack(pack.id, { manualUsed: Math.max(0, (pack.manualUsed ?? used) - 1) })} style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", color: C.muted, cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>−</button>
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 13, minWidth: 20, textAlign: "center" }}>{used}</span>
                  <button onClick={() => mutations.updatePack(pack.id, { manualUsed: Math.min(total, (pack.manualUsed ?? used) + 1) })} style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", color: C.gold, cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>+</button>
                </div>
              </div>
              {remaining === 0 && <div style={{ marginTop: 10, background: C.redAlpha, border: "1px solid rgba(204,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: C.red, fontSize: 12, fontWeight: 600 }}>⚠ Pack épuisé — pense à proposer un renouvellement !</div>}
              {remaining === 2 && <div style={{ marginTop: 10, background: C.orangeAlpha, border: "1px solid rgba(204,136,51,0.3)", borderRadius: 8, padding: "8px 12px", color: C.orange, fontSize: 12, fontWeight: 600 }}>📣 Plus que 2 séances — anticipe le renouvellement !</div>}
            </div>
          );
        })
      }
    </div>
  );
}

/* ─── Modals ─── */
function AddPackModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: "Pack 10 séances", totalSessions: "10", price: "350", startDate: today(), manualUsed: null });
  const [err, setErr] = useState("");
  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErr(""); };
  const presets = [{ l: "Pack 5", s: "5", p: "200" }, { l: "Pack 10", s: "10", p: "350" }, { l: "Pack 20", s: "20", p: "650" }];
  const submit = () => {
    if (!f.name.trim()) return setErr("Le nom du pack est requis.");
    if (!f.totalSessions || Number(f.totalSessions) <= 0) return setErr("Le nombre de séances doit être supérieur à 0.");
    if (f.price === "" || Number(f.price) < 0) return setErr("Le prix ne peut pas être négatif.");
    if (!f.startDate) return setErr("La date d'achat est requise.");
    onSave(f);
  };
  return (
    <Modal title="📦 NOUVEAU PACK" onClose={onClose}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {presets.map(pr => (
          <button key={pr.l} onClick={() => { setF(p => ({ ...p, name: `Pack ${pr.s} séances`, totalSessions: pr.s, price: pr.p })); setErr(""); }}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: C.s3, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {pr.l}
          </button>
        ))}
      </div>
      <Field label="Nom du pack *"><Input value={f.name} onChange={set("name")} /></Field>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Nb de séances *"><Input type="number" min="1" value={f.totalSessions} onChange={set("totalSessions")} /></Field>
        <Field label="Prix payé (€)"><Input type="number" min="0" value={f.price} onChange={set("price")} /></Field>
        <Field label="Date d'achat *"><Input type="date" value={f.startDate} onChange={set("startDate")} /></Field>
      </div>
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 8, background: C.redAlpha, borderRadius: 8, padding: "7px 12px" }}>{err}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={submit}>Créer le pack</Btn>
      </div>
    </Modal>
  );
}

function RelanceModal({ client, pendingPayments, onClose }) {
  const total = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const details = pendingPayments.map(p => `- ${p.description} : ${fmoney(p.amount)} (${fdate(p.date)})`).join("\n");
  const [msg, setMsg] = useState(`Bonjour ${client.firstName} 👋\n\nJ'espère que tu vas bien ! Je me permets de te recontacter au sujet d'un règlement en attente pour nos séances de coaching.\n\n💰 Montant dû : *${fmoney(total)}*\n${details}\n\nTu peux régler directement en ligne via ce lien de paiement sécurisé :\n👉 ${import.meta.env.VITE_PAYMENT_LINK}\n\nTu peux aussi régler en espèces lors de notre prochaine séance si tu préfères.\n\nMerci et à très bientôt ! 💪\n${import.meta.env.VITE_COACH_NAME} — JeliTraining`);
  const phone = (client.phone || "").replace(/\s/g, "").replace(/^0/, "+33");
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Modal title="📩 RELANCE IMPAYÉ" onClose={onClose} width={560}>
      <div style={{ background: C.orangeAlpha, border: "1px solid rgba(204,136,51,0.35)", borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>Impayé de <strong>{client.firstName} {client.lastName}</strong></div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{pendingPayments.length} paiement{pendingPayments.length > 1 ? "s" : ""} en attente</div>
        </div>
        <span style={{ color: C.orange, fontWeight: 700, fontSize: 20 }}>{fmoney(total)}</span>
      </div>
      <Field label="Message (modifiable avant envoi)">
        <Textarea value={msg} onChange={e => setMsg(e.target.value)} rows={11} style={{ fontSize: 13, lineHeight: 1.65 }} />
      </Field>
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
        {client.phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          <button style={{ width: "100%", padding: "11px 0", borderRadius: 8, background: "#25D366", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>📱 WhatsApp</button>
        </a>}
        {client.phone && <a href={`sms:${client.phone}?body=${encodeURIComponent(msg)}`} style={{ textDecoration: "none" }}>
          <button style={{ width: "100%", padding: "11px 0", borderRadius: 8, background: C.s3, border: `1px solid ${C.border}`, color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>💬 SMS</button>
        </a>}
        <button onClick={copy} style={{ padding: "11px 0", borderRadius: 8, background: copied ? C.greenAlpha : C.s3, border: `1px solid ${copied ? C.green : C.border}`, color: copied ? C.green : C.text, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
          {copied ? "✓ Copié !" : "📋 Copier"}
        </button>
      </div>
      {!client.phone && <p style={{ color: C.orange, fontSize: 12, marginTop: 12, background: C.orangeAlpha, borderRadius: 8, padding: "8px 12px" }}>⚠ Aucun numéro renseigné — utilise le bouton Copier.</p>}
    </Modal>
  );
}

export function ClientFormModal({ title, initial, onClose, onSave }) {
  const [f, setF] = useState(initial);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const ok = f.firstName?.trim() && f.lastName?.trim();
  const preview = calcNutrition(f);
  return (
    <Modal title={title} onClose={onClose} width={600}>
      <div style={{ color: C.gold, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>◈ Identité & contact</div>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Prénom *"><Input value={f.firstName || ""} onChange={set("firstName")} placeholder="Prénom" /></Field>
        <Field label="Nom *"><Input value={f.lastName || ""} onChange={set("lastName")} placeholder="Nom" /></Field>
        <Field label="Email"><Input type="email" value={f.email || ""} onChange={set("email")} placeholder="email@example.com" /></Field>
        <Field label="Téléphone"><Input value={f.phone || ""} onChange={set("phone")} placeholder="06 00 00 00 00" /></Field>
        <Field label="Date de début"><Input type="date" value={f.startDate || today()} onChange={set("startDate")} /></Field>
        <Field label="Statut"><Sel value={f.status || "actif"} onChange={set("status")}><option value="actif">Actif</option><option value="inactif">Inactif</option></Sel></Field>
      </div>
      <Field label="Objectif principal"><Input value={f.goal || ""} onChange={set("goal")} placeholder="Prise de masse, perte de poids…" /></Field>
      <div style={{ borderTop: `1px solid ${C.border}`, margin: "18px 0 16px" }} />
      <div style={{ color: C.gold, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>◈ Données physiques & nutritionnelles</div>
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 14px" }}>
        <Field label="Sexe"><Sel value={f.sexe || "homme"} onChange={set("sexe")}><option value="homme">Homme</option><option value="femme">Femme</option></Sel></Field>
        <Field label="Âge (ans)"><Input type="number" value={f.age || ""} onChange={set("age")} placeholder="25" /></Field>
        <Field label="Poids (kg)"><Input type="number" step="0.1" value={f.weight || ""} onChange={set("weight")} placeholder="75" /></Field>
        <Field label="Taille (cm)"><Input type="number" value={f.height || ""} onChange={set("height")} placeholder="178" /></Field>
        <Field label="Repas / jour"><Input type="number" value={f.mealsPerDay || "3"} onChange={set("mealsPerDay")} placeholder="3" /></Field>
      </div>
      <Field label="Niveau d'activité physique">
        <Sel value={f.activityLevel || "modere"} onChange={set("activityLevel")}>
          {ACTIVITY_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label} — {a.desc}</option>)}
        </Sel>
      </Field>
      <Field label="Restrictions / infos médicales"><Input value={f.restrictions || ""} onChange={set("restrictions")} placeholder="Allergies, blessures…" /></Field>
      {preview && (
        <div style={{ background: C.goldAlpha, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>⚡ Aperçu nutritionnel calculé</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[{ l: "Maintien", v: preview.maintien.cal }, { l: "Perte MG", v: preview.perteMG.cal }, { l: "Prise masse", v: preview.priseMasse.cal }].map(i => (
              <div key={i.l}><div style={{ color: C.muted, fontSize: 10 }}>{i.l}</div><div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{i.v} <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}>kcal</span></div></div>
            ))}
            <div><div style={{ color: C.muted, fontSize: 10 }}>Protéines</div><div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{Math.round((f.weight || 0) * 2)}g<span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}>/j</span></div></div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn disabled={!ok} onClick={() => ok && onSave(f)}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

export function AddClientModal({ onClose, onSave }) {
  return <ClientFormModal title="✦ NOUVEAU CLIENT" initial={{ firstName: "", lastName: "", email: "", phone: "", age: "", weight: "", height: "", goal: "", startDate: today(), status: "actif", sexe: "homme", activityLevel: "modere", mealsPerDay: "3", restrictions: "" }} onClose={onClose} onSave={onSave} />;
}

function AddSessionModal({ onClose, onSave }) {
  const [f, setF] = useState({ date: today(), type: "Muscu", duration: "60", notes: "" });
  const [err, setErr] = useState("");
  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErr(""); };
  const submit = () => {
    if (!f.date) return setErr("La date est requise.");
    if (!f.duration || Number(f.duration) <= 0) return setErr("La durée doit être supérieure à 0.");
    onSave(f);
  };
  return (
    <Modal title="✦ AJOUTER UNE SÉANCE" onClose={onClose}>
      <Field label="Date *"><Input type="date" value={f.date} onChange={set("date")} /></Field>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Type"><Sel value={f.type} onChange={set("type")}>{["Muscu", "Cardio", "Stretching", "HIIT", "Circuit", "Autre"].map(t => <option key={t}>{t}</option>)}</Sel></Field>
        <Field label="Durée (min) *"><Input type="number" min="1" value={f.duration} onChange={set("duration")} /></Field>
      </div>
      <Field label="Notes"><Textarea value={f.notes} onChange={set("notes")} placeholder="Exercices, intensité, remarques…" /></Field>
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 8, background: C.redAlpha, borderRadius: 8, padding: "7px 12px" }}>{err}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={submit}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

function AddMeasurementModal({ onClose, onSave }) {
  const [f, setF] = useState({ date: today(), weight: "", chest: "", waist: "", hips: "", arms: "", thighs: "" });
  const [err, setErr] = useState("");
  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErr(""); };
  const submit = () => {
    if (!f.date) return setErr("La date est requise.");
    const hasValue = [f.weight, f.chest, f.waist, f.hips, f.arms, f.thighs].some(v => v !== "");
    if (!hasValue) return setErr("Renseigne au moins une mesure.");
    onSave(f);
  };
  return (
    <Modal title="✦ MENSURATIONS" onClose={onClose}>
      <Field label="Date *"><Input type="date" value={f.date} onChange={set("date")} /></Field>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Poids (kg)"><Input type="number" step="0.1" value={f.weight} onChange={set("weight")} placeholder="75.5" /></Field>
        <Field label="Poitrine (cm)"><Input type="number" step="0.5" value={f.chest} onChange={set("chest")} placeholder="95" /></Field>
        <Field label="Tour de taille (cm)"><Input type="number" step="0.5" value={f.waist} onChange={set("waist")} placeholder="80" /></Field>
        <Field label="Hanches (cm)"><Input type="number" step="0.5" value={f.hips} onChange={set("hips")} placeholder="95" /></Field>
        <Field label="Bras (cm)"><Input type="number" step="0.5" value={f.arms} onChange={set("arms")} placeholder="35" /></Field>
        <Field label="Cuisses (cm)"><Input type="number" step="0.5" value={f.thighs} onChange={set("thighs")} placeholder="55" /></Field>
      </div>
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 8, background: C.redAlpha, borderRadius: 8, padding: "7px 12px" }}>{err}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={submit}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

function AddGoalModal({ onClose, onSave }) {
  const [f, setF] = useState({ title: "", description: "", targetDate: "" });
  const [err, setErr] = useState("");
  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErr(""); };
  const submit = () => {
    if (!f.title.trim()) return setErr("Le titre est requis.");
    onSave({ ...f, completed: false });
  };
  return (
    <Modal title="✦ NOUVEL OBJECTIF" onClose={onClose}>
      <Field label="Titre *"><Input value={f.title} onChange={set("title")} placeholder="Perdre 5 kg, Benchpress 100 kg…" /></Field>
      <Field label="Description"><Textarea value={f.description} onChange={set("description")} placeholder="Détails, jalons…" /></Field>
      <Field label="Date cible"><Input type="date" value={f.targetDate} onChange={set("targetDate")} /></Field>
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 8, background: C.redAlpha, borderRadius: 8, padding: "7px 12px" }}>{err}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={submit}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

function AddPaymentModal({ onClose, onSave }) {
  const [f, setF] = useState({ date: today(), description: "", amount: "", type: "Séance individuelle", status: "payé" });
  const [err, setErr] = useState("");
  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErr(""); };
  const submit = () => {
    if (!f.date) return setErr("La date est requise.");
    if (!f.amount || Number(f.amount) <= 0) return setErr("Le montant doit être supérieur à 0.");
    onSave(f);
  };
  return (
    <Modal title="✦ AJOUTER UN PAIEMENT" onClose={onClose}>
      <Field label="Date *"><Input type="date" value={f.date} onChange={set("date")} /></Field>
      <Field label="Description"><Input value={f.description} onChange={set("description")} placeholder="Séance du 15 mars, Pack 10 séances…" /></Field>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Montant (€) *"><Input type="number" step="0.01" min="0.01" value={f.amount} onChange={set("amount")} placeholder="40.00" /></Field>
        <Field label="Statut"><Sel value={f.status} onChange={set("status")}><option value="payé">Payé ✓</option><option value="en attente">En attente</option></Sel></Field>
      </div>
      <Field label="Type de prestation"><Sel value={f.type} onChange={set("type")}>{["Séance individuelle", "Pack", "Abonnement mensuel", "Programme écrit", "Autre"].map(t => <option key={t}>{t}</option>)}</Sel></Field>
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 8, background: C.redAlpha, borderRadius: 8, padding: "7px 12px" }}>{err}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={submit}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

/* ─── Client Detail View ─── */
export function ClientDetailView({ client, tab, onTab, onBack, handlers, mutations }) {
  const [relanceOpen, setRelanceOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const sessions = client.sessions || [];
  const measurements = client.measurements || [];
  const goals = client.goals || [];
  const payments = client.payments || [];
  const packs = client.packs || [];
  const programmes = client.programmes || [];
  const totalPaid = payments.filter(p => p.status === "payé").reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status === "en attente");
  const pendingAmt = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const packsAlert = packs.some(pk => { const u = pk.manualUsed ?? sessions.filter(s => s.date >= pk.startDate).length; return Math.max(0, parseInt(pk.totalSessions || 0) - u) <= 2; });
  const tabs = [
    { id: "sessions", label: "Séances", count: sessions.length },
    { id: "measurements", label: "Mensurations", count: measurements.length },
    { id: "goals", label: "Objectifs", count: goals.length },
    { id: "payments", label: "Paiements", count: payments.length, alert: pendingPayments.length > 0 },
    { id: "packs", label: "Packs", count: packs.length, alert: packsAlert },
    { id: "programme", label: "Programme", count: programmes.length || null },
    { id: "analyse", label: "Analyse 📊", count: null },
  ];

  return (
    <div>
      {relanceOpen && <RelanceModal client={client} pendingPayments={pendingPayments} onClose={() => setRelanceOpen(false)} />}
      <div className="detail-header" style={{ background: `linear-gradient(180deg, ${C.s1}, ${C.bg})`, borderBottom: `1px solid ${C.border}`, padding: "28px 44px" }}>
        <button onClick={onBack}
          onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 18, padding: 0, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "color 0.15s" }}>← Retour à la liste</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div className="detail-avatar" style={{ width: 62, height: 62, borderRadius: "50%", background: `linear-gradient(135deg, ${C.goldAlpha}, rgba(201,168,76,0.22))`, border: `2px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: C.shadowGold }}>
              <span style={{ color: C.gold, fontWeight: 700, fontSize: 24, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{(client.firstName || "?")[0]}{(client.lastName || "")[0]}</span>
            </div>
            <div>
              <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 8px", fontFamily: "'Cormorant Garamond',Georgia,serif", letterSpacing: "-0.01em" }}>{client.firstName} {client.lastName}</h2>
              <div className="detail-meta" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {client.email && <span style={{ color: C.muted, fontSize: 12 }}>✉ {client.email}</span>}
                {client.phone && <span style={{ color: C.muted, fontSize: 12 }}>📱 {client.phone}</span>}
                {client.age && <span style={{ color: C.muted, fontSize: 12 }}>🎂 {client.age} ans</span>}
                {client.startDate && <span style={{ color: C.muted, fontSize: 12 }}>📅 Depuis {fdate(client.startDate)}</span>}
              </div>
              {client.goal && <div style={{ color: C.gold, fontSize: 12, marginTop: 7 }}>🎯 {client.goal}</div>}
            </div>
          </div>
          <div className="detail-actions" style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
            {pendingAmt > 0 && <Btn variant="orange" onClick={() => setRelanceOpen(true)}>📩 Relance impayé</Btn>}
            <Sel value={client.status || "actif"} onChange={e => mutations.updateStatus(e.target.value)} style={{ width: "auto", padding: "7px 12px", fontSize: 12 }}>
              <option value="actif">Actif</option><option value="inactif">Inactif</option>
            </Sel>
            <Btn variant="danger" onClick={() => { if (window.confirm(`Supprimer ${client.firstName} ${client.lastName} ?`)) mutations.delete(); }}>Supprimer</Btn>
          </div>
        </div>
        <div className="detail-stats" style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          <span style={{ color: C.muted, fontSize: 12 }}><strong style={{ color: C.text }}>{sessions.length}</strong> séances</span>
          <span style={{ color: C.muted, fontSize: 12 }}><strong style={{ color: C.green }}>{fmoney(totalPaid)}</strong> encaissé</span>
          {pendingAmt > 0 && <span style={{ color: C.muted, fontSize: 12 }}><strong style={{ color: C.orange }}>{fmoney(pendingAmt)}</strong> en attente</span>}
          <span style={{ color: C.muted, fontSize: 12 }}><strong style={{ color: C.text }}>{goals.filter(g => g.completed).length}/{goals.length}</strong> objectifs atteints</span>
        </div>
      </div>

      <div className="tab-bar" style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.s1, paddingLeft: 44, overflowX: "auto", gap: 2 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = C.muted; }}
            style={{ padding: "14px 18px", border: "none", borderBottom: `2px solid ${tab === t.id ? C.gold : "transparent"}`, background: tab === t.id ? C.goldAlpha : "transparent", color: tab === t.id ? C.gold : C.muted, fontWeight: tab === t.id ? 600 : 400, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s", borderRadius: "8px 8px 0 0" }}>
            {t.label}
            {t.count !== null && <span style={{ background: t.alert ? C.orangeAlpha : (tab === t.id ? "rgba(201,168,76,0.15)" : C.s3), border: t.alert ? `1px solid ${C.orange}44` : "none", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: t.alert ? C.orange : (tab === t.id ? C.gold : C.muted), transition: "all 0.15s" }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="detail-content" style={{ padding: "32px 44px" }}>
        {tab === "sessions" && <TabSection title="Historique des séances" onAdd={handlers.addSession}>
          {sessions.length === 0 ? <Empty icon="🏋️" text="Aucune séance enregistrée" /> :
            [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(s => (
              <ItemRow key={s.id}
                left={<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Tag color={typeColor(s.type)}>{s.type}</Tag>
                  <span style={{ color: C.text, fontWeight: 500, fontSize: 14 }}>{s.duration} min</span>
                  {s.notes && <span style={{ color: C.muted, fontSize: 13 }}>· {s.notes}</span>}
                </div>}
                right={<span style={{ color: C.muted, fontSize: 12 }}>{fdate(s.date)}</span>}
                onDelete={() => { if (window.confirm("Supprimer cette séance ?")) mutations.removeSession(s.id); }}
              />
            ))
          }
        </TabSection>}

        {tab === "measurements" && <TabSection title="Mensurations & poids" onAdd={handlers.addMeasurement}>
          <WeightChart measurements={measurements} />
          {measurements.length === 0 ? <Empty icon="📏" text="Aucune mensuration enregistrée" /> :
            <div style={{ overflowX: "auto", background: C.s1, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Date", "Poids", "Poitrine", "Taille", "Hanches", "Bras", "Cuisses", ""].map(h => (
                    <th key={h} style={{ color: C.muted, fontWeight: 500, padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap", fontFamily: "inherit", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...measurements].sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.s2}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {[<span style={{ color: C.text }}>{fdate(m.date)}</span>, <span style={{ color: C.gold, fontWeight: 700 }}>{m.weight ? `${m.weight} kg` : "—"}</span>, m.chest ? `${m.chest} cm` : "—", m.waist ? `${m.waist} cm` : "—", m.hips ? `${m.hips} cm` : "—", m.arms ? `${m.arms} cm` : "—", m.thighs ? `${m.thighs} cm` : "—"]
                        .map((v, i) => <td key={i} style={{ padding: "12px 16px", color: C.text }}>{v}</td>)}
                      <td style={{ padding: "12px 16px" }}><button onClick={() => { if (window.confirm("Supprimer ?")) mutations.removeMeasurement(m.id); }} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", opacity: 0.55, fontSize: 14 }}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </TabSection>}

        {tab === "goals" && <TabSection title="Objectifs & progression" onAdd={handlers.addGoal}>
          {goals.length === 0 ? <Empty icon="🎯" text="Aucun objectif défini" /> :
            goals.map(g => (
              <div key={g.id} style={{ background: C.s2, border: `1px solid ${g.completed ? C.goldBorder : C.border}`, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12, transition: "all 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadow1; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <button onClick={() => mutations.toggleGoal(g.id, !g.completed)} style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${g.completed ? C.gold : C.muted2}`, background: g.completed ? C.goldAlpha : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all 0.2s ease" }}>
                  {g.completed && <span style={{ color: C.gold, fontSize: 12, lineHeight: 1 }}>✓</span>}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: g.completed ? C.muted : C.text, fontWeight: 600, textDecoration: g.completed ? "line-through" : "none" }}>{g.title}</div>
                  {g.description && <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{g.description}</div>}
                  {g.targetDate && <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>📅 Cible : {fdate(g.targetDate)}</div>}
                </div>
                <button onClick={() => { if (window.confirm("Supprimer ?")) mutations.removeGoal(g.id); }} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", opacity: 0.55, fontSize: 14 }}>✕</button>
              </div>
            ))
          }
        </TabSection>}

        {tab === "payments" && <TabSection title="Paiements & factures" onAdd={handlers.addPayment}
          extra={pendingAmt > 0 && <Btn variant="orange" onClick={() => setRelanceOpen(true)}>📩 Envoyer relance</Btn>}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {[{ label: "Encaissé", val: fmoney(totalPaid), color: C.green }, { label: "En attente", val: fmoney(pendingAmt), color: C.orange }].map(s => (
              <div key={s.label} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px" }}>
                <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</div>
                <div style={{ color: s.color, fontWeight: 700, fontSize: 20, marginTop: 5 }}>{s.val}</div>
              </div>
            ))}
          </div>
          {payments.length === 0 ? <Empty icon="💳" text="Aucun paiement enregistré" /> :
            [...payments].sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => (
              <ItemRow key={p.id}
                left={<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ color: p.status === "payé" ? C.green : C.orange, fontWeight: 700, fontSize: 16 }}>{fmoney(p.amount)}</span>
                  <Tag color={p.status === "payé" ? C.green : C.orange}>{p.status}</Tag>
                  <span style={{ color: C.text, fontSize: 13 }}>{p.description}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>· {p.type}</span>
                </div>}
                right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: C.muted, fontSize: 12 }}>{fdate(p.date)}</span>
                  <button onClick={() => mutations.togglePayment(p.id, p.status === "payé" ? "en attente" : "payé")}
                    style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    {p.status === "payé" ? "Annuler" : "✓ Valider"}
                  </button>
                </div>}
                onDelete={() => { if (window.confirm("Supprimer ce paiement ?")) mutations.removePayment(p.id); }}
              />
            ))
          }
        </TabSection>}

        {tab === "packs" && <PacksTab client={client} onAdd={handlers.addPack} mutations={mutations} />}
        {tab === "programme" && <ProgrammeTab client={client} savedProgrammes={programmes} onSave={mutations.saveProgramme} onRemove={mutations.removeProgramme} />}
        {tab === "analyse" && <AnalyseTab client={client} onEdit={() => setEditOpen(true)} />}
      </div>

      {editOpen && <ClientFormModal title="✏️ MODIFIER LE PROFIL" initial={client} onClose={() => setEditOpen(false)} onSave={d => { mutations.updateProfile(d); setEditOpen(false); }} />}
      {handlers.modal === "session" && <AddSessionModal onClose={handlers.closeModal} onSave={handlers.saveSession} />}
      {handlers.modal === "measurement" && <AddMeasurementModal onClose={handlers.closeModal} onSave={handlers.saveMeasurement} />}
      {handlers.modal === "goal" && <AddGoalModal onClose={handlers.closeModal} onSave={handlers.saveGoal} />}
      {handlers.modal === "payment" && <AddPaymentModal onClose={handlers.closeModal} onSave={handlers.savePayment} />}
      {handlers.modal === "pack" && <AddPackModal onClose={handlers.closeModal} onSave={handlers.savePack} />}
    </div>
  );
}
