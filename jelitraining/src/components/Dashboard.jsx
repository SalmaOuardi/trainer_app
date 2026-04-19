import { C } from "../theme.js";
import { fdate, fmoney } from "../utils.js";

function StatCard({ label, value, sub, accent, delay = 0 }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = accent ? C.shadowGold : C.shadow2; e.currentTarget.style.borderColor = accent ? C.gold : C.goldBorder; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = C.shadow1; e.currentTarget.style.borderColor = accent ? C.goldBorder : C.border; }}
      style={{ background: `linear-gradient(135deg, ${C.s1}, ${C.s2})`, border: `1px solid ${accent ? C.goldBorder : C.border}`, borderRadius: 14, padding: "20px 24px", transition: "all 0.25s ease", boxShadow: C.shadow1, animation: "slideUp 0.4s ease both", animationDelay: `${delay}ms` }}>
      <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontWeight: 500 }}>{label}</div>
      <div style={{ color: accent ? C.gold : C.text, fontSize: 30, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

export function DashboardView({ stats, clients, onSelectClient }) {
  const allSessions = clients
    .flatMap(c => (c.sessions || []).map(s => ({ ...s, clientName: `${c.firstName} ${c.lastName}`, clientId: c.id })))
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const allPayments = clients
    .flatMap(c => (c.payments || []).map(p => ({ ...p, clientName: `${c.firstName} ${c.lastName}`, clientId: c.id })))
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const now = new Date();

  return (
    <div style={{ padding: "40px 44px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 36, animation: "fadeIn 0.4s ease" }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
          Bonjour, <span style={{ color: C.gold }}>{import.meta.env.VITE_COACH_NAME}</span> 👋
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 6, marginBottom: 0 }}>
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 36 }}>
        <StatCard label="Clients actifs" value={stats.actifs} sub={`${stats.total} au total`} accent delay={0} />
        <StatCard label="Séances ce mois" value={stats.sessions} sub="toutes formules" delay={60} />
        <StatCard label="Revenus ce mois" value={fmoney(stats.revenue)} sub="paiements validés" delay={120} />
        <StatCard label="En attente" value={fmoney(stats.pending)} sub="à encaisser" accent delay={180} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[
          {
            title: "SÉANCES RÉCENTES", data: allSessions, tab: "sessions",
            renderLeft: s => <><div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{s.clientName}</div><div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{s.type} · {s.duration} min</div></>,
            renderRight: s => <div style={{ color: C.muted, fontSize: 12 }}>{fdate(s.date)}</div>,
          },
          {
            title: "PAIEMENTS RÉCENTS", data: allPayments, tab: "payments",
            renderLeft: p => <><div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{p.clientName}</div><div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{p.description}</div></>,
            renderRight: p => <div style={{ textAlign: "right" }}><div style={{ color: p.status === "payé" ? C.green : C.orange, fontWeight: 600, fontSize: 13 }}>{fmoney(p.amount)}</div><div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{p.status}</div></div>,
          },
        ].map((panel, panelIdx) => (
          <div key={panel.title} style={{ background: `linear-gradient(180deg, ${C.s1}, ${C.s2})`, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", boxShadow: C.shadow1, animation: "slideUp 0.4s ease both", animationDelay: `${250 + panelIdx * 80}ms` }}>
            <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", marginBottom: 18 }}>{panel.title}</div>
            {panel.data.length === 0
              ? <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Aucun enregistrement</p>
              : panel.data.map((item, idx) => (
                  <div key={item.id} onClick={() => onSelectClient(item.clientId, panel.tab)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: idx < panel.data.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", borderRadius: 8, marginLeft: -8, marginRight: -8, transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.s3; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div>{panel.renderLeft(item)}</div>
                    {panel.renderRight(item)}
                  </div>
                ))
            }
          </div>
        ))}
      </div>
    </div>
  );
}
