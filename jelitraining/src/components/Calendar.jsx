import { useMemo, useState } from "react";
import { C } from "../theme.js";
import {
  colorForType,
  ymd, sameDay, addDays, addMonths,
  monthGrid, weekDays,
  formatMonthYear, formatDayLong,
  WEEKDAY_SHORT_FR,
  flattenSessions, groupByDay,
} from "../calendar-utils.js";

const MODES = [
  { id: "month", label: "Mois" },
  { id: "week", label: "Semaine" },
  { id: "day", label: "Jour" },
];

export function CalendarView({ clients, onSelectClient }) {
  const [mode, setMode] = useState("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const events = useMemo(() => flattenSessions(clients), [clients]);
  const byDay = useMemo(() => groupByDay(events), [events]);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const goToday = () => { setCursor(today); if (mode === "day") setMode("day"); };
  const shift = (dir) => {
    if (mode === "month") setCursor(c => addMonths(c, dir));
    else if (mode === "week") setCursor(c => addDays(c, dir * 7));
    else setCursor(c => addDays(c, dir));
  };

  const periodLabel =
    mode === "day" ? formatDayLong(cursor)
    : mode === "week" ? `Semaine du ${weekDays(cursor)[0].getDate()} ${weekDays(cursor)[0].toLocaleDateString("fr-FR", { month: "short" })}`
    : formatMonthYear(cursor);

  const selectDay = (d) => { setCursor(d); setMode("day"); };

  return (
    <div style={{ padding: "18px 16px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <Header
        periodLabel={periodLabel}
        mode={mode}
        onMode={setMode}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={goToday}
        isToday={sameDay(cursor, today)}
      />

      {mode === "month" && (
        <MonthView cursor={cursor} today={today} byDay={byDay} onPick={selectDay} />
      )}
      {mode === "week" && (
        <WeekView cursor={cursor} today={today} byDay={byDay} onPick={selectDay} />
      )}
      {mode === "day" && (
        <DayView date={cursor} events={byDay.get(ymd(cursor)) || []} onSelectClient={onSelectClient} />
      )}
    </div>
  );
}

function Header({ periodLabel, mode, onMode, onPrev, onNext, onToday, isToday }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 700, color: C.text,
          fontFamily: "'Cormorant Garamond',Georgia,serif", letterSpacing: "0.02em",
          textTransform: "capitalize",
        }}>{periodLabel}</h1>
        <button
          onClick={onToday}
          disabled={isToday && mode === "day"}
          style={{
            background: isToday && mode === "day" ? "transparent" : C.goldAlpha,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 999, padding: "6px 12px",
            color: C.gold, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.04em", cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.2s",
            opacity: isToday && mode === "day" ? 0.45 : 1,
          }}
        >Aujourd'hui</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <NavBtn onClick={onPrev} icon="‹" />
        <NavBtn onClick={onNext} icon="›" />
        <div style={{ flex: 1 }} />
        <Segmented value={mode} options={MODES} onChange={onMode} />
      </div>
    </div>
  );
}

function NavBtn({ onClick, icon }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = C.s3; e.currentTarget.style.color = C.text; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.s2; e.currentTarget.style.color = C.muted; }}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.s2, border: `1px solid ${C.border}`,
        color: C.muted, fontSize: 20, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
    >{icon}</button>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div style={{
      display: "inline-flex", background: C.s2, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: 3, gap: 2,
    }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            style={{
              background: active ? C.goldAlpha : "transparent",
              border: active ? `1px solid ${C.goldBorder}` : "1px solid transparent",
              borderRadius: 8, padding: "6px 12px",
              color: active ? C.gold : C.muted,
              fontSize: 12, fontWeight: active ? 600 : 500,
              cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em",
              transition: "all 0.15s",
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

function MonthView({ cursor, today, byDay, onPick }) {
  const grid = monthGrid(cursor);
  const currentMonth = cursor.getMonth();
  return (
    <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 8px 12px", boxShadow: C.shadow1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, padding: "2px 4px 8px" }}>
        {WEEKDAY_SHORT_FR.map(w => (
          <div key={w} style={{ textAlign: "center", color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {grid.map((d, i) => {
          const key = ymd(d);
          const inMonth = d.getMonth() === currentMonth;
          const isToday = sameDay(d, today);
          const sessions = byDay.get(key) || [];
          const hasAny = sessions.length > 0;
          return (
            <button
              key={i}
              onClick={() => onPick(d)}
              style={{
                aspectRatio: "1 / 1",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                padding: "6px 4px 4px",
                background: isToday ? C.goldAlpha : (hasAny ? C.s2 : "transparent"),
                border: isToday ? `1px solid ${C.goldBorder}` : `1px solid ${C.border}`,
                borderRadius: 10, cursor: "pointer",
                color: inMonth ? (isToday ? C.gold : C.text) : C.muted2,
                fontFamily: "inherit", transition: "all 0.15s",
                opacity: inMonth ? 1 : 0.55,
                position: "relative",
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = C.s3; }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = hasAny ? C.s2 : "transparent"; }}
            >
              <span style={{ fontSize: 14, fontWeight: isToday ? 700 : 500 }}>{d.getDate()}</span>
              <div style={{ display: "flex", gap: 3, marginTop: "auto", paddingTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                {sessions.slice(0, 3).map((s, j) => (
                  <span key={j} style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: colorForType(s.type), boxShadow: `0 0 4px ${colorForType(s.type)}`,
                  }} />
                ))}
                {sessions.length > 3 && (
                  <span style={{ fontSize: 8, color: C.muted, lineHeight: 1, marginLeft: 2 }}>+{sessions.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, today, byDay, onPick }) {
  const days = weekDays(cursor);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {days.map((d, i) => {
        const key = ymd(d);
        const sessions = byDay.get(key) || [];
        const isToday = sameDay(d, today);
        return (
          <button
            key={i}
            onClick={() => onPick(d)}
            style={{
              background: isToday ? C.goldAlpha : C.s1,
              border: isToday ? `1px solid ${C.goldBorder}` : `1px solid ${C.border}`,
              borderRadius: 12, padding: "10px 8px",
              minHeight: 140, textAlign: "left",
              display: "flex", flexDirection: "column", gap: 6,
              cursor: "pointer", color: C.text, fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = C.s2; }}
            onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = C.s1; }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{WEEKDAY_SHORT_FR[i]}</div>
              <div style={{ fontSize: 18, fontWeight: isToday ? 700 : 500, color: isToday ? C.gold : C.text, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{d.getDate()}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
              {sessions.slice(0, 4).map((s, j) => (
                <div key={j} style={{
                  background: `${colorForType(s.type)}22`,
                  borderLeft: `2px solid ${colorForType(s.type)}`,
                  borderRadius: 4, padding: "3px 5px",
                  fontSize: 10, color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  lineHeight: 1.2,
                }}>{s.clientName.split(" ")[0]}</div>
              ))}
              {sessions.length > 4 && (
                <div style={{ fontSize: 9, color: C.muted, textAlign: "center", marginTop: 2 }}>+{sessions.length - 4}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayView({ events, onSelectClient }) {
  const sorted = [...events].sort((a, b) => (a.clientName || "").localeCompare(b.clientName || ""));
  return (
    <div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 12, letterSpacing: "0.04em" }}>
        {sorted.length === 0 ? "Aucune séance" : `${sorted.length} séance${sorted.length > 1 ? "s" : ""}`}
      </div>
      {sorted.length === 0 ? (
        <div style={{
          background: C.s1, border: `1px dashed ${C.border}`, borderRadius: 14,
          padding: "48px 20px", textAlign: "center", color: C.muted,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>◌</div>
          <div style={{ fontSize: 13 }}>Pas de séance prévue ce jour</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map(e => <SessionCard key={e.sessionId} event={e} onSelectClient={onSelectClient} />)}
        </div>
      )}
    </div>
  );
}

function SessionCard({ event, onSelectClient }) {
  const color = colorForType(event.type);
  const clickable = typeof onSelectClient === "function" && event.clientId;
  return (
    <button
      onClick={clickable ? () => onSelectClient(event.clientId) : undefined}
      disabled={!clickable}
      style={{
        background: C.s1, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 14,
        cursor: clickable ? "pointer" : "default", textAlign: "left", width: "100%",
        color: C.text, fontFamily: "inherit", transition: "all 0.15s",
        boxShadow: C.shadow1,
      }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.background = C.s2; }}
      onMouseLeave={e => { if (clickable) e.currentTarget.style.background = C.s1; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}22`, border: `1px solid ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
          {(event.type || "").slice(0, 3).toUpperCase()}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 2 }}>{event.clientName}</div>
        <div style={{ fontSize: 12, color: C.muted, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{event.type || "Séance"}</span>
          {event.duration && <span>· {event.duration} min</span>}
        </div>
        {event.notes && (
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4, maxHeight: 36, overflow: "hidden" }}>
            {event.notes}
          </div>
        )}
      </div>
      {clickable && (
        <span style={{ color: C.muted, fontSize: 16, flexShrink: 0 }}>›</span>
      )}
    </button>
  );
}
