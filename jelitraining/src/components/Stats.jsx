import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { C } from "../theme.js";
import { fmoney } from "../utils.js";
import { Empty } from "./ui.jsx";
import {
  periodBounds,
  previousPeriodBounds,
  statsForRange,
  lifetimeStats,
  pctDelta,
  monthlyRevenueSeries,
  topClients,
} from "../stats-utils.js";
import { addDays, addMonths, startOfWeek, MONTH_NAMES_FR } from "../calendar-utils.js";

const PERIODS = [
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
  { id: "all", label: "Tout" },
];

const PERIOD_LABEL = {
  week: "cette semaine",
  month: "ce mois",
  year: "cette année",
  all: "depuis le début",
};

const PREVIOUS_LABEL = {
  week: "vs semaine précédente",
  month: "vs mois précédent",
  year: "vs année précédente",
};

function PeriodSelector({ value, onChange }) {
  return (
    <div role="tablist" style={{ display: "inline-flex", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, gap: 2 }}>
      {PERIODS.map(p => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p.id)}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.muted; }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              fontFamily: "inherit",
              cursor: "pointer",
              background: active ? C.goldAlpha : "transparent",
              color: active ? C.gold : C.muted,
              border: active ? `1px solid ${C.goldBorder}` : "1px solid transparent",
              transition: "all 0.15s",
              letterSpacing: "0.02em",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// Renders the period delta as a colored chip.
//   null   → hide chip (no baseline at all)
//   Inf    → "Nouveau" (no previous activity)
//   number → ↑/↓ formatted as %
function DeltaChip({ delta, periodLabel }) {
  if (delta === null) return null;
  if (delta === Infinity) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.gold, background: C.goldAlpha, border: `1px solid ${C.goldBorder}`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
        <TrendingUp size={11} strokeWidth={2.2} />
        Nouveau
      </span>
    );
  }
  const positive = delta > 0;
  const flat = delta === 0;
  const color = flat ? C.muted : positive ? C.green : C.red;
  const bg = flat ? "rgba(120,120,120,0.12)" : positive ? C.greenAlpha : C.redAlpha;
  const border = flat ? "rgba(120,120,120,0.3)" : positive ? "rgba(90,170,90,0.4)" : "rgba(204,68,68,0.4)";
  const Icon = flat ? Minus : positive ? TrendingUp : TrendingDown;
  const sign = positive ? "+" : "";
  const pct = `${sign}${(delta * 100).toFixed(0)}%`;
  return (
    <span title={periodLabel} style={{ display: "inline-flex", alignItems: "center", gap: 4, color, background: bg, border: `1px solid ${border}`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
      <Icon size={11} strokeWidth={2.2} />
      {pct}
    </span>
  );
}

function KpiCard({ label, value, sub, delta, periodLabel, accent, delay = 0 }) {
  return (
    <div className="stat-card"
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = accent ? C.shadowGold : C.shadow2; e.currentTarget.style.borderColor = accent ? C.gold : C.goldBorder; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = C.shadow1; e.currentTarget.style.borderColor = accent ? C.goldBorder : C.border; }}
      style={{ background: `linear-gradient(135deg, ${C.s1}, ${C.s2})`, border: `1px solid ${accent ? C.goldBorder : C.border}`, borderRadius: 14, padding: "20px 24px", transition: "all 0.25s ease", boxShadow: C.shadow1, animation: "slideUp 0.4s ease both", animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
        <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>{label}</div>
        {delta !== undefined && <DeltaChip delta={delta} periodLabel={periodLabel} />}
      </div>
      <div className="stat-value" style={{ color: accent ? C.gold : C.text, fontSize: 30, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div style={{ background: C.s2, border: `1px solid ${C.goldBorder}`, borderRadius: 8, padding: "8px 12px", boxShadow: C.shadow2 }}>
      <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{row.label}</div>
      <div style={{ color: C.gold, fontSize: 14, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{fmoney(row.revenue)}</div>
    </div>
  );
}

function RevenueChart({ data }) {
  const allZero = data.every(b => b.revenue === 0);
  if (allZero) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center", color: C.muted, fontSize: 13 }}>
        Aucun revenu enregistré sur les 12 derniers mois.
      </div>
    );
  }
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.goldLight} stopOpacity={0.95} />
              <stop offset="100%" stopColor={C.gold} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
          <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => `${v}€`} width={56} />
          <Tooltip cursor={{ fill: C.goldAlpha }} content={<ChartTooltip />} />
          <Bar dataKey="revenue" fill="url(#revGradient)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopClients({ rows, onSelectClient }) {
  if (!rows.length) {
    return <div style={{ color: C.muted, fontSize: 13, padding: "8px 0" }}>Aucun client sur cette période.</div>;
  }
  const max = rows[0].revenue || 1;
  return (
    <div>
      {rows.map((r, idx) => {
        const pct = Math.max(6, Math.round((r.revenue / max) * 100));
        return (
          <div
            key={r.clientId}
            onClick={() => onSelectClient && onSelectClient(r.clientId)}
            onMouseEnter={e => { e.currentTarget.style.background = C.s3; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) auto", alignItems: "center", gap: 12, padding: "10px 8px", borderBottom: idx < rows.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", borderRadius: 8, marginLeft: -8, marginRight: -8, transition: "background 0.15s" }}
          >
            <div style={{ color: idx === 0 ? C.gold : C.muted, fontSize: 12, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif", textAlign: "center" }}>#{idx + 1}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.clientName}</div>
              <div style={{ marginTop: 6, height: 4, background: C.s3, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, borderRadius: 4 }} />
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{r.sessions} séance{r.sessions > 1 ? "s" : ""}</div>
            </div>
            <div style={{ color: C.gold, fontSize: 13, fontWeight: 600, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{fmoney(r.revenue)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Anchor navigation ─────────────────────────────────────────────────────
// "Anchor" is the date that picks which week/month/year is displayed.
// Default = now (current period). User can shift it backwards to look at
// historical months/years.

const shiftAnchor = (date, period, direction) => {
  if (period === "week") return addDays(date, 7 * direction);
  if (period === "month") return addMonths(date, direction);
  if (period === "year") {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + direction);
    return d;
  }
  return date;
};

// True when `anchor` falls in the same bucket as `now` for the given period.
const isCurrentPeriod = (period, anchor, now) => {
  if (period === "all") return true;
  if (period === "year") return anchor.getFullYear() === now.getFullYear();
  if (period === "month") {
    return anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth();
  }
  if (period === "week") {
    return startOfWeek(anchor).getTime() === startOfWeek(now).getTime();
  }
  return true;
};

// "Lundi 4 mai 2026" for the week containing `anchor`.
const weekRangeLabel = (anchor) => {
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = `${start.getDate()}${sameMonth ? "" : ` ${MONTH_NAMES_FR[start.getMonth()].toLowerCase()}`}`;
  const endStr = `${end.getDate()} ${MONTH_NAMES_FR[end.getMonth()].toLowerCase()} ${end.getFullYear()}`;
  return `${startStr} – ${endStr}`;
};

const navIconStyle = {
  background: C.s2,
  border: `1px solid ${C.border}`,
  color: C.muted,
  cursor: "pointer",
  width: 32,
  height: 32,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
  padding: 0,
};

const selectStyle = {
  background: C.s2,
  border: `1px solid ${C.border}`,
  color: C.text,
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
  outline: "none",
};

function NavIconBtn({ onClick, ariaLabel, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.color = C.gold; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
      style={navIconStyle}
    >
      {children}
    </button>
  );
}

// Builds a sorted-desc list of years that show up in the data, plus the
// current year. Used to populate the year <select>.
const collectYears = (clients) => {
  const set = new Set([new Date().getFullYear()]);
  if (Array.isArray(clients)) {
    for (const c of clients) {
      for (const p of (c?.payments || [])) {
        const y = p?.date && parseInt(String(p.date).slice(0, 4), 10);
        if (Number.isFinite(y)) set.add(y);
      }
      for (const s of (c?.sessions || [])) {
        const y = s?.date && parseInt(String(s.date).slice(0, 4), 10);
        if (Number.isFinite(y)) set.add(y);
      }
    }
  }
  return Array.from(set).sort((a, b) => b - a);
};

function AnchorNav({ period, anchor, setAnchor, now, years }) {
  if (period === "all") return null;
  const atCurrent = isCurrentPeriod(period, anchor, now);

  const onMonthChange = e => {
    const m = parseInt(e.target.value, 10);
    const next = new Date(anchor);
    next.setMonth(m);
    setAnchor(next);
  };
  const onYearChange = e => {
    const y = parseInt(e.target.value, 10);
    const next = new Date(anchor);
    next.setFullYear(y);
    setAnchor(next);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <NavIconBtn onClick={() => setAnchor(shiftAnchor(anchor, period, -1))} ariaLabel="Période précédente">
        <ChevronLeft size={16} strokeWidth={2} />
      </NavIconBtn>

      {period === "month" && (
        <>
          <select value={anchor.getMonth()} onChange={onMonthChange} style={selectStyle} aria-label="Mois">
            {MONTH_NAMES_FR.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
          </select>
          <select value={anchor.getFullYear()} onChange={onYearChange} style={selectStyle} aria-label="Année">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </>
      )}
      {period === "year" && (
        <select value={anchor.getFullYear()} onChange={onYearChange} style={selectStyle} aria-label="Année">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
      {period === "week" && (
        <span style={{ color: C.text, fontSize: 13, fontWeight: 500, padding: "6px 10px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          {weekRangeLabel(anchor)}
        </span>
      )}

      <NavIconBtn onClick={() => setAnchor(shiftAnchor(anchor, period, 1))} ariaLabel="Période suivante">
        <ChevronRight size={16} strokeWidth={2} />
      </NavIconBtn>

      {!atCurrent && (
        <button
          onClick={() => setAnchor(new Date())}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          style={{ ...navIconStyle, width: "auto", padding: "0 12px", gap: 6, fontSize: 12, fontFamily: "inherit" }}
          aria-label="Revenir à la période actuelle"
        >
          <RotateCcw size={13} strokeWidth={2} />
          Aujourd'hui
        </button>
      )}
    </div>
  );
}

function Panel({ title, children, delay = 0 }) {
  return (
    <div style={{ background: `linear-gradient(180deg, ${C.s1}, ${C.s2})`, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", boxShadow: C.shadow1, animation: "slideUp 0.4s ease both", animationDelay: `${delay}ms` }}>
      <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );
}

export function StatsView({ clients, onSelectClient }) {
  const [period, setPeriod] = useState("month");
  // Anchor = the date that selects which week/month/year is being viewed.
  // Defaults to now; user can navigate back via the AnchorNav controls.
  const [anchor, setAnchor] = useState(() => new Date());
  const now = useMemo(() => new Date(), []);

  const lifetime = useMemo(() => lifetimeStats(clients), [clients]);
  const isEmpty = lifetime.totalClients === 0 && lifetime.sessions === 0 && lifetime.revenue === 0;

  const current = useMemo(() => {
    const { start, end } = periodBounds(period, anchor);
    return statsForRange(clients, start, end);
  }, [clients, period, anchor]);

  const previous = useMemo(() => {
    const prev = previousPeriodBounds(period, anchor);
    if (!prev) return null;
    return statsForRange(clients, prev.start, prev.end);
  }, [clients, period, anchor]);

  // Trend chart stays anchored on real "now" — it's a long-range view by
  // definition (last 12 months ending today).
  const series = useMemo(() => monthlyRevenueSeries(clients, 12, now), [clients, now]);

  const top = useMemo(() => {
    const { start, end } = periodBounds(period, anchor);
    return topClients(clients, { start, end, metric: "revenue", limit: 5 });
  }, [clients, period, anchor]);

  const years = useMemo(() => collectYears(clients), [clients]);

  const deltaFor = (key) => {
    if (!previous) return null;
    return pctDelta(current[key], previous[key]);
  };

  // Switching period: snap anchor back to "now" so the user always lands
  // on the current week/month/year first when changing granularity.
  const onPeriodChange = (next) => {
    setPeriod(next);
    setAnchor(new Date());
  };

  const atCurrent = isCurrentPeriod(period, anchor, now);
  // Word used in KPI labels — "ce mois", "mars 2026", etc.
  const periodWord = (period === "all" || atCurrent)
    ? PERIOD_LABEL[period]
    : period === "year"
      ? `en ${anchor.getFullYear()}`
      : period === "month"
        ? `en ${MONTH_NAMES_FR[anchor.getMonth()].toLowerCase()} ${anchor.getFullYear()}`
        : `cette semaine-là`;
  const previousWord = PREVIOUS_LABEL[period] || "";

  return (
    <div className="page" style={{ padding: "40px 44px", maxWidth: 1100 }}>
      <div className="page-header" style={{ marginBottom: 28, animation: "fadeIn 0.4s ease" }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
          <span style={{ color: C.gold }}>Statistiques</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 6, marginBottom: 0 }}>
          Suivi de l'activité et des revenus.
        </p>
      </div>

      {isEmpty ? (
        <Empty text="Aucune donnée pour l'instant. Ajoute un client, une séance ou un paiement pour voir tes statistiques apparaître ici." />
      ) : (
        <>
          {/* Lifetime band — always visible, anchors the page in long-term progress. */}
          <Panel title="DEPUIS LE DÉBUT">
            <div className="grid-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              <KpiCard label="Revenus encaissés" value={fmoney(lifetime.revenue)} sub="paiements validés" accent delay={0} />
              <KpiCard label="Séances réalisées" value={lifetime.sessions} sub="toutes formules" delay={60} />
              <KpiCard label="Clients entraînés" value={lifetime.clientsTrained} sub={`${lifetime.totalClients} client${lifetime.totalClients > 1 ? "s" : ""} au total`} delay={120} />
              <KpiCard label="En attente" value={fmoney(lifetime.pending)} sub="à encaisser" delay={180} />
            </div>
          </Panel>

          {/* Period band — selector + anchor nav + KPIs scoped to the chosen window. */}
          <div style={{ marginTop: 28, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: 0 }}>Sur la période</h2>
            <PeriodSelector value={period} onChange={onPeriodChange} />
          </div>
          {period !== "all" && (
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
              <AnchorNav period={period} anchor={anchor} setAnchor={setAnchor} now={now} years={years} />
            </div>
          )}
          <div className="grid-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
            <KpiCard
              label={`Revenus ${periodWord}`}
              value={fmoney(current.revenue)}
              sub="paiements validés"
              accent
              delta={deltaFor("revenue")}
              periodLabel={previousWord}
              delay={0}
            />
            <KpiCard
              label={`Séances ${periodWord}`}
              value={current.sessions}
              sub="toutes formules"
              delta={deltaFor("sessions")}
              periodLabel={previousWord}
              delay={60}
            />
            <KpiCard
              label={`Clients entraînés ${periodWord}`}
              value={current.uniqueClients}
              sub="avec au moins 1 séance"
              delta={deltaFor("uniqueClients")}
              periodLabel={previousWord}
              delay={120}
            />
            <KpiCard
              label={`En attente ${periodWord}`}
              value={fmoney(current.pending)}
              sub="paiements non encaissés"
              delay={180}
            />
          </div>

          {/* Trend chart + top clients side by side on desktop, stacked on mobile. */}
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
            <Panel title="REVENUS — 12 DERNIERS MOIS" delay={250}>
              <RevenueChart data={series} />
            </Panel>
            <Panel title={`TOP CLIENTS — ${periodWord.toUpperCase()}`} delay={330}>
              <TopClients rows={top} onSelectClient={onSelectClient} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
