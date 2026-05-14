import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { C } from "../theme.js";
import { fdate, fmoney } from "../utils.js";
import { ymd, upcomingSessions } from "../calendar-utils.js";
import { unpaidByClient } from "../stats-utils.js";

function StatCard({ label, value, sub, accent, delay = 0 }) {
  return (
    <div className="stat-card"
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = accent ? C.shadowGold : C.shadow2; e.currentTarget.style.borderColor = accent ? C.gold : C.goldBorder; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = C.shadow1; e.currentTarget.style.borderColor = accent ? C.goldBorder : C.border; }}
      style={{ background: `linear-gradient(135deg, ${C.s1}, ${C.s2})`, border: `1px solid ${accent ? C.goldBorder : C.border}`, borderRadius: 14, padding: "20px 24px", transition: "all 0.25s ease", boxShadow: C.shadow1, animation: "slideUp 0.4s ease both", animationDelay: `${delay}ms` }}>
      <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontWeight: 500 }}>{label}</div>
      <div className="stat-value" style={{ color: accent ? C.gold : C.text, fontSize: 30, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

// List panel that starts collapsed: shows `collapsedCount` rows with a fade
// over the last one, then a "Voir tout" toggle reveals the rest. Keeps the
// dashboard scannable instead of one long scroll.
function ListPanel({ title, items, emptyText, rowKey, renderRow, onRowClick, delay = 0, collapsedCount = 2 }) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = items.length > collapsedCount;
  const visible = expanded || !canCollapse ? items : items.slice(0, collapsedCount);

  return (
    <div style={{ background: `linear-gradient(180deg, ${C.s1}, ${C.s2})`, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", boxShadow: C.shadow1, alignSelf: "start", animation: "slideUp 0.4s ease both", animationDelay: `${delay}ms` }}>
      <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", marginBottom: 18 }}>{title}</div>
      {items.length === 0
        ? <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{emptyText}</p>
        : (
          <div style={{ position: "relative" }}>
            {visible.map((item, idx) => (
              <div key={rowKey(item)} onClick={() => onRowClick(item)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: idx < visible.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", borderRadius: 8, marginLeft: -8, marginRight: -8, transition: "background 0.15s", ...(idx >= collapsedCount ? { animation: "slideUp 0.3s ease both", animationDelay: `${(idx - collapsedCount) * 40}ms` } : null) }}
                onMouseEnter={e => { e.currentTarget.style.background = C.s3; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                {renderRow(item)}
              </div>
            ))}
            {canCollapse && !expanded && (
              <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 56, background: `linear-gradient(to bottom, transparent, ${C.s2})`, pointerEvents: "none" }} />
            )}
          </div>
        )
      }
      {canCollapse && (
        <button type="button"
          onClick={() => setExpanded(v => !v)}
          onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10, padding: "9px 0", background: "transparent", border: "none", color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "color 0.2s" }}>
          {expanded ? "Voir moins" : `Voir tout (${items.length})`}
          <ChevronDown size={14} strokeWidth={2.5} style={{ transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
        </button>
      )}
    </div>
  );
}

export function DashboardView({ stats, clients, onSelectClient }) {
  const now = new Date();
  const todayKey = ymd(now);
  const upcoming = upcomingSessions(clients, now, 6);
  const allSessions = clients
    .flatMap(c => (c.sessions || []).map(s => ({ ...s, clientName: `${c.firstName} ${c.lastName}`, clientId: c.id })))
    .filter(s => s.date <= todayKey)
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const allPayments = clients
    .flatMap(c => (c.payments || []).map(p => ({ ...p, clientName: `${c.firstName} ${c.lastName}`, clientId: c.id })))
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const unpaid = unpaidByClient(clients, 6);

  return (
    <div className="page" style={{ padding: "40px 44px", maxWidth: 1100 }}>
      <div className="page-header" style={{ marginBottom: 36, animation: "fadeIn 0.4s ease" }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
          Bonjour, <span style={{ color: C.gold }}>{import.meta.env.VITE_COACH_NAME}</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 6, marginBottom: 0 }}>
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="grid-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 36 }}>
        <StatCard label="Clients actifs" value={stats.actifs} sub={`${stats.total} au total`} accent delay={0} />
        <StatCard label="Séances ce mois" value={stats.sessions} sub="toutes formules" delay={60} />
        <StatCard label="Revenus ce mois" value={fmoney(stats.revenue)} sub="paiements validés" delay={120} />
        <StatCard label="En attente" value={fmoney(stats.pending)} sub="à encaisser" accent delay={180} />
      </div>
      <div style={{ display: "grid", gap: 20, marginBottom: 20 }}>
        <ListPanel
          title="À VENIR"
          items={upcoming}
          emptyText="Aucune séance à venir"
          rowKey={s => s.sessionId}
          onRowClick={s => onSelectClient(s.clientId, "sessions")}
          delay={240}
          renderRow={s => (
            <>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{s.clientName}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{s.type} · {s.duration} min</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>{fdate(s.date)}</div>
                {s.startTime && <div style={{ color: C.gold, fontSize: 11, marginTop: 2 }}>{s.startTime}</div>}
              </div>
            </>
          )}
        />
        <ListPanel
          title="À RELANCER"
          items={unpaid}
          emptyText="Aucun paiement en attente"
          rowKey={u => u.clientId}
          onRowClick={u => onSelectClient(u.clientId, "payments")}
          delay={300}
          renderRow={u => (
            <>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{u.clientName}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{u.count} paiement{u.count > 1 ? "s" : ""} en attente</div>
              </div>
              <div style={{ color: C.orange, fontWeight: 600, fontSize: 13 }}>{fmoney(u.total)}</div>
            </>
          )}
        />
      </div>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ListPanel
          title="SÉANCES RÉCENTES"
          items={allSessions}
          emptyText="Aucun enregistrement"
          rowKey={s => s.id}
          onRowClick={s => onSelectClient(s.clientId, "sessions")}
          delay={360}
          renderRow={s => (
            <>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{s.clientName}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{s.type} · {s.duration} min</div>
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>{fdate(s.date)}</div>
            </>
          )}
        />
        <ListPanel
          title="PAIEMENTS RÉCENTS"
          items={allPayments}
          emptyText="Aucun enregistrement"
          rowKey={p => p.id}
          onRowClick={p => onSelectClient(p.clientId, "payments")}
          delay={440}
          renderRow={p => (
            <>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{p.clientName}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{p.description}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: p.status === "payé" ? C.green : C.orange, fontWeight: 600, fontSize: 13 }}>{fmoney(p.amount)}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{p.status}</div>
              </div>
            </>
          )}
        />
      </div>
    </div>
  );
}
