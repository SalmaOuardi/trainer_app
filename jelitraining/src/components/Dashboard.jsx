import { C } from "../theme.js";
import { fdate, fmoney } from "../utils.js";

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: C.s1, border: `1px solid ${accent ? C.goldBorder : C.border}`, borderRadius: 12, padding: "18px 22px" }}>
      <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</div>
      <div style={{ color: accent ? C.gold : C.text, fontSize: 28, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
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
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
          Bonjour, <span style={{ color: C.gold }}>{import.meta.env.VITE_COACH_NAME}</span> 👋
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 5, marginBottom: 0 }}>
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 14, marginBottom: 32 }}>
        <StatCard label="Clients actifs" value={stats.actifs} sub={`${stats.total} au total`} accent />
        <StatCard label="Séances ce mois" value={stats.sessions} sub="toutes formules" />
        <StatCard label="Revenus ce mois" value={fmoney(stats.revenue)} sub="paiements validés" />
        <StatCard label="En attente" value={fmoney(stats.pending)} sub="à encaisser" accent />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[
          {
            title: "SÉANCES RÉCENTES", data: allSessions, tab: "sessions",
            renderLeft: s => <><div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{s.clientName}</div><div style={{ color: C.muted, fontSize: 12 }}>{s.type} · {s.duration} min</div></>,
            renderRight: s => <div style={{ color: C.muted, fontSize: 12 }}>{fdate(s.date)}</div>,
          },
          {
            title: "PAIEMENTS RÉCENTS", data: allPayments, tab: "payments",
            renderLeft: p => <><div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{p.clientName}</div><div style={{ color: C.muted, fontSize: 12 }}>{p.description}</div></>,
            renderRight: p => <div style={{ textAlign: "right" }}><div style={{ color: p.status === "payé" ? C.green : C.orange, fontWeight: 600, fontSize: 13 }}>{fmoney(p.amount)}</div><div style={{ color: C.muted, fontSize: 11 }}>{p.status}</div></div>,
          },
        ].map(panel => (
          <div key={panel.title} style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 16 }}>{panel.title}</div>
            {panel.data.length === 0
              ? <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Aucun enregistrement</p>
              : panel.data.map(item => (
                  <div key={item.id} onClick={() => onSelectClient(item.clientId, panel.tab)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
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
