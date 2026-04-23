import { useMemo, useState } from "react";
import { C } from "../theme.js";
import { Modal, Input, Sel, Textarea, Field, Btn } from "./ui.jsx";
import {
  colorForType,
  ymd, sameDay, addDays, addMonths,
  monthGrid, weekDays,
  formatMonthYear, formatDayLong,
  WEEKDAY_SHORT_FR,
  flattenSessions, groupByDay, compareEvents,
} from "../calendar-utils.js";
import { availabilityForDate, formatHourRange } from "../availability-utils.js";

const MODES = [
  { id: "month", label: "Mois" },
  { id: "week", label: "Semaine" },
  { id: "day", label: "Jour" },
];

const SESSION_TYPES = ["Muscu", "Cardio", "Stretching", "HIIT", "Circuit", "Autre"];

export function CalendarView({ clients, availability, onCreateEvent, onEditEvent, onDeleteEvent }) {
  const [mode, setMode] = useState("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  // modal: null | { mode: "create", date } | { mode: "edit", event }
  const [modal, setModal] = useState(null);

  const events = useMemo(() => flattenSessions(clients), [clients]);
  const byDay = useMemo(() => groupByDay(events), [events]);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const goToday = () => { setCursor(today); if (mode === "day") setMode("day"); };
  const shift = (dir) => {
    if (mode === "month") setCursor(c => addMonths(c, dir));
    else if (mode === "week") setCursor(c => addDays(c, dir * 7));
    else setCursor(c => addDays(c, dir));
  };

  const cursorAvail = availability ? availabilityForDate(availability, cursor) : null;
  const periodLabel =
    mode === "day" ? formatDayLong(cursor)
    : mode === "week" ? `Semaine du ${weekDays(cursor)[0].getDate()} ${weekDays(cursor)[0].toLocaleDateString("fr-FR", { month: "short" })}`
    : formatMonthYear(cursor);

  const selectDay = (d) => { setCursor(d); setMode("day"); };
  const openCreate = () => setModal({ mode: "create", date: ymd(cursor) });
  const openEdit = (event) => setModal({ mode: "edit", event });

  const handleSave = (clientId, payload) => {
    if (modal?.mode === "edit") {
      onEditEvent?.(modal.event.clientId, modal.event.sessionId, payload);
    } else {
      onCreateEvent?.(clientId, payload);
    }
    setModal(null);
  };
  const handleDelete = () => {
    if (modal?.mode === "edit") {
      onDeleteEvent?.(modal.event.clientId, modal.event.sessionId);
      setModal(null);
    }
  };

  return (
    <div style={{ padding: "18px 16px 80px", maxWidth: 1100, margin: "0 auto", position: "relative" }}>
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
        <WeekView cursor={cursor} today={today} byDay={byDay} availability={availability} onPick={selectDay} />
      )}
      {mode === "day" && (
        <DayView events={byDay.get(ymd(cursor)) || []} availability={cursorAvail} onEdit={openEdit} />
      )}

      <FAB onClick={openCreate} />

      {modal && (
        <EventModal
          clients={clients}
          initial={modal.mode === "edit" ? modal.event : { date: modal.date }}
          editing={modal.mode === "edit"}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : null}
        />
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

function WeekView({ cursor, today, byDay, availability, onPick }) {
  const days = weekDays(cursor);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {days.map((d, i) => {
        const key = ymd(d);
        const sessions = [...(byDay.get(key) || [])].sort(compareEvents);
        const isToday = sameDay(d, today);
        const avail = availability ? availabilityForDate(availability, d) : null;
        const isOff = avail && avail.off;
        const hourRange = avail ? formatHourRange(avail) : "";
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
              opacity: isOff ? 0.45 : 1,
            }}
            onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = C.s2; }}
            onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = C.s1; }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{WEEKDAY_SHORT_FR[i]}</div>
              <div style={{ fontSize: 18, fontWeight: isToday ? 700 : 500, color: isToday ? C.gold : C.text, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{d.getDate()}</div>
              {avail && (
                <div style={{ fontSize: 9, color: C.muted2, marginTop: 2, letterSpacing: "0.02em" }}>
                  {isOff ? "Repos" : hourRange}
                </div>
              )}
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
                }}>
                  {s.startTime ? `${s.startTime} ` : ""}{s.clientName.split(" ")[0]}
                </div>
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

function DayView({ events, availability, onEdit }) {
  const sorted = [...events].sort(compareEvents);
  const isOff = availability && availability.off;
  const hourRange = availability ? formatHourRange(availability) : "";
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, marginBottom: 12, flexWrap: "wrap",
      }}>
        <div style={{ color: C.muted, fontSize: 12, letterSpacing: "0.04em" }}>
          {sorted.length === 0 ? "Aucune séance" : `${sorted.length} séance${sorted.length > 1 ? "s" : ""}`}
        </div>
        {availability && (
          <div style={{
            color: isOff ? C.muted2 : C.gold, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.04em",
            background: isOff ? "transparent" : C.goldAlpha,
            border: isOff ? `1px solid ${C.border}` : `1px solid ${C.goldBorder}`,
            borderRadius: 999, padding: "3px 10px",
          }}>
            {isOff ? "Jour de repos" : hourRange}
          </div>
        )}
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
          {sorted.map(e => <SessionCard key={e.sessionId} event={e} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  );
}

function SessionCard({ event, onEdit }) {
  const color = colorForType(event.type);
  return (
    <button
      onClick={() => onEdit?.(event)}
      style={{
        background: C.s1, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer", textAlign: "left", width: "100%",
        color: C.text, fontFamily: "inherit", transition: "all 0.15s",
        boxShadow: C.shadow1,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = C.s2; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.s1; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}22`, border: `1px solid ${color}55`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {event.startTime ? (
          <span style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>
            {event.startTime}
          </span>
        ) : (
          <span style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
            {(event.type || "").slice(0, 3).toUpperCase()}
          </span>
        )}
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
      <span style={{ color: C.muted, fontSize: 16, flexShrink: 0 }}>›</span>
    </button>
  );
}

function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Nouvelle séance"
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "brightness(1)"; }}
      style={{
        position: "fixed", right: 20, bottom: 88,
        width: 56, height: 56, borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
        border: "none", color: "#000",
        fontSize: 28, fontWeight: 300, lineHeight: 1,
        cursor: "pointer", boxShadow: C.shadowGold,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", zIndex: 50,
        fontFamily: "inherit",
      }}
    >+</button>
  );
}

function EventModal({ clients, initial, editing, onClose, onSave, onDelete }) {
  const firstClientId = Array.isArray(clients) && clients.length > 0 ? clients[0].id : "";
  const [f, setF] = useState(() => ({
    clientId: initial?.clientId || firstClientId,
    date: initial?.date || ymd(new Date()),
    startTime: initial?.startTime || "",
    duration: initial?.duration || "60",
    type: initial?.type || "Muscu",
    notes: initial?.notes || "",
  }));
  const [err, setErr] = useState("");
  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErr(""); };

  const submit = () => {
    if (!f.clientId) return setErr("Choisis un client.");
    if (!f.date) return setErr("La date est requise.");
    if (!f.duration || Number(f.duration) <= 0) return setErr("La durée doit être supérieure à 0.");
    const payload = {
      date: f.date,
      type: f.type,
      duration: f.duration,
      notes: f.notes,
      startTime: f.startTime || null,
    };
    onSave(f.clientId, payload);
  };

  const hasClients = Array.isArray(clients) && clients.length > 0;

  return (
    <Modal title={editing ? "✦ MODIFIER LA SÉANCE" : "✦ NOUVELLE SÉANCE"} onClose={onClose}>
      <Field label="Client *">
        <Sel value={f.clientId} onChange={set("clientId")} disabled={editing}>
          {!hasClients && <option value="">Aucun client</option>}
          {hasClients && clients.map(c => (
            <option key={c.id} value={c.id}>
              {[c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Client"}
            </option>
          ))}
        </Sel>
      </Field>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Date *"><Input type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="Heure"><Input type="time" value={f.startTime} onChange={set("startTime")} /></Field>
      </div>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Type">
          <Sel value={f.type} onChange={set("type")}>
            {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
          </Sel>
        </Field>
        <Field label="Durée (min) *"><Input type="number" min="1" value={f.duration} onChange={set("duration")} /></Field>
      </div>
      <Field label="Notes"><Textarea value={f.notes} onChange={set("notes")} placeholder="Exercices, intensité, remarques…" /></Field>
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 8, background: C.redAlpha, borderRadius: 8, padding: "7px 12px" }}>{err}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 8 }}>
        <div>
          {editing && onDelete && (
            <Btn variant="danger" onClick={onDelete}>Supprimer</Btn>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn onClick={submit} disabled={!hasClients}>{editing ? "Enregistrer" : "Créer"}</Btn>
        </div>
      </div>
    </Modal>
  );
}
