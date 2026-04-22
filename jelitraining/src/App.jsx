import { useState, useEffect } from "react";
import { C } from "./theme.js";
import { gid, today } from "./utils.js";
import { loadFromStorage, saveToStorage } from "./lib.js";
import { sbGetAll, sbSaveClient, sbDeleteClient, sbGetLegacy, sbDeleteLegacy, AUTH_KEY } from "./api.js";
import { SaveBadge } from "./components/ui.jsx";
import { LoginScreen, ChangePasswordModal } from "./components/Auth.jsx";
import { DashboardView } from "./components/Dashboard.jsx";
import { ClientsView } from "./components/Clients.jsx";
import { AddClientModal, ClientDetailView } from "./components/ClientDetail.jsx";
import { CalendarView } from "./components/Calendar.jsx";

const CALENDAR_ENABLED = import.meta.env.VITE_CALENDAR_ENABLED === "true";

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");
  const [clients, setClients] = useState([]);
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("sessions");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [changePwOpen, setChangePwOpen] = useState(false);

  useEffect(() => {
    if (!authed) return;
    (async () => {
      const remote = await sbGetAll();

      // Network/server failure: fall back to cached data so the app is usable offline.
      if (remote === null) {
        const local = loadFromStorage();
        if (local) setClients(local);
        setLoading(false);
        return;
      }

      // Server reachable and empty: run one-time legacy migration if applicable.
      if (remote.length === 0) {
        const legacy = await sbGetLegacy();
        if (legacy && Array.isArray(legacy) && legacy.length > 0) {
          await Promise.all(legacy.map(c => sbSaveClient(c)));
          await sbDeleteLegacy();
          setClients(legacy);
          saveToStorage(legacy);
          setLoading(false);
          return;
        }
      }

      // Server is source of truth — overwrite state AND cache unconditionally,
      // even when empty, so stale local data can never outlive a remote delete.
      setClients(remote);
      saveToStorage(remote);
      setLoading(false);
    })();
  }, [authed]);

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;

  const persist = nc => {
    const prev = clients;
    setClients(nc);
    setSaveStatus("saving");
    saveToStorage(nc);
    const prevMap = Object.fromEntries(prev.map(c => [c.id, c]));
    const nextIds = new Set(nc.map(c => c.id));
    const toSave = nc.filter(c => !prevMap[c.id] || JSON.stringify(prevMap[c.id]) !== JSON.stringify(c));
    const toDelete = prev.filter(c => !nextIds.has(c.id));
    Promise.all([
      ...toSave.map(c => sbSaveClient(c)),
      ...toDelete.map(c => sbDeleteClient(c.id)),
    ]).then(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }).catch(() => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(clients, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JeliTraining-clients-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) {
            persist(data);
            alert(`✅ ${data.length} client(s) importé(s) avec succès !`);
          } else {
            alert("❌ Fichier invalide — ce n'est pas un export JeliTraining.");
          }
        } catch { alert("❌ Erreur de lecture du fichier."); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const selected = clients.find(c => c.id === selectedId);
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  const inMonth = d => { const dt = new Date(d); return dt.getMonth() === m && dt.getFullYear() === y; };
  const stats = {
    total: clients.length,
    actifs: clients.filter(c => (c.status || "actif") === "actif").length,
    sessions: clients.reduce((a, c) => a + (c.sessions || []).filter(s => inMonth(s.date)).length, 0),
    revenue: clients.reduce((a, c) => a + (c.payments || []).filter(p => inMonth(p.date) && p.status === "payé").reduce((s, p) => s + Number(p.amount), 0), 0),
    pending: clients.reduce((a, c) => a + (c.payments || []).filter(p => p.status === "en attente").reduce((s, p) => s + Number(p.amount), 0), 0),
  };

  const addClient = d => { persist([...clients, { ...d, id: gid(), sessions: [], measurements: [], goals: [], payments: [], programmes: [], packs: [] }]); setModal(null); };
  const updateClient = (id, u) => persist(clients.map(c => c.id === id ? { ...c, ...u } : c));
  const deleteClient = id => { persist(clients.filter(c => c.id !== id)); setView("clients"); setSelectedId(null); };
  const addTo = (id, field, item) => persist(clients.map(c => c.id === id ? { ...c, [field]: [...(c[field] || []), { ...item, id: gid() }] } : c));
  const removeFrom = (id, field, iid) => persist(clients.map(c => c.id === id ? { ...c, [field]: (c[field] || []).filter(i => i.id !== iid) } : c));
  const updateIn = (id, field, iid, u) => persist(clients.map(c => c.id === id ? { ...c, [field]: (c[field] || []).map(i => i.id === iid ? { ...i, ...u } : i) } : c));
  const goTo = (id, t = "sessions") => { setSelectedId(id); setTab(t); setView("detail"); };

  const navItems = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "clients", icon: "◉", label: "Mes clients" },
    ...(CALENDAR_ENABLED ? [{ id: "calendar", icon: "◐", label: "Calendrier" }] : []),
  ];
  const closeNav = () => setSideOpen(false);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.gold, fontFamily: "'Inter',system-ui,sans-serif", gap: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.goldAlpha, border: `2px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s ease-in-out infinite" }}>
        <span style={{ color: C.gold, fontSize: 16, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{import.meta.env.VITE_COACH_INITIALS}</span>
      </div>
      <span style={{ fontSize: 13, letterSpacing: "0.08em", fontWeight: 500 }}>Chargement…</span>
    </div>
  );

  const SideBtn = ({ onClick, icon, label }) => (
    <button onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = C.s3; e.currentTarget.style.color = C.text; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, fontFamily: "inherit", marginBottom: 2, transition: "all 0.15s" }}>
      <span style={{ fontSize: 14 }}>{icon}</span>{label}
    </button>
  );

  const SidebarContent = ({ onNav }) => <>
    <div style={{ padding: "22px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.goldAlpha}, rgba(201,168,76,0.2))`, border: `1.5px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: C.shadowGold }}>
        <span style={{ color: C.gold, fontSize: 13, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{import.meta.env.VITE_COACH_INITIALS}</span>
      </div>
      <div>
        <div style={{ color: C.text, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>JELI<span style={{ color: C.gold }}>TRAINING</span></div>
        <div style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>Coach Dashboard</div>
      </div>
    </div>
    <nav style={{ flex: 1, padding: "14px 10px" }}>
      {navItems.map(item => {
        const active = view === item.id || (view === "detail" && item.id === "clients");
        return (
          <button key={item.id} onClick={() => { setView(item.id); onNav && onNav(); }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.s3; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, background: active ? C.goldAlpha : "transparent", border: active ? `1px solid ${C.goldBorder}` : "1px solid transparent", cursor: "pointer", color: active ? C.gold : C.muted, fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left", marginBottom: 4, fontFamily: "inherit", transition: "all 0.2s ease" }}>
            <span style={{ fontSize: 16, opacity: active ? 1 : 0.7 }}>{item.icon}</span>{item.label}
          </button>
        );
      })}
    </nav>
    <div style={{ padding: "14px 10px", borderTop: `1px solid ${C.border}` }}>
      {saveStatus !== "idle" && <div style={{ marginBottom: 10, paddingLeft: 4 }}><SaveBadge status={saveStatus} /></div>}
      <SideBtn onClick={exportData} icon="💾" label="Exporter mes données" />
      <SideBtn onClick={importData} icon="📂" label="Importer des données" />
      <SideBtn onClick={() => setChangePwOpen(true)} icon="🔑" label="Changer le mot de passe" />
    </div>
  </>;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="mobile-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top, 0px) + 14px) 18px 14px", background: C.s1, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 200, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${C.goldAlpha}, rgba(201,168,76,0.2))`, border: `1.5px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadowGold }}>
            <span style={{ color: C.gold, fontSize: 11, fontWeight: 700, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{import.meta.env.VITE_COACH_INITIALS}</span>
          </div>
          <span style={{ color: C.text, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>JELI<span style={{ color: C.gold }}>TRAINING</span></span>
          <SaveBadge status={saveStatus} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={exportData} title="Exporter" style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", color: C.muted, fontSize: 13, cursor: "pointer" }}>💾</button>
          <button onClick={importData} title="Importer" style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", color: C.muted, fontSize: 13, cursor: "pointer" }}>📂</button>
          <button onClick={() => setSideOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ display: "block", width: 22, height: 2, background: C.gold, borderRadius: 2 }} />
            <span style={{ display: "block", width: 22, height: 2, background: C.gold, borderRadius: 2 }} />
            <span style={{ display: "block", width: 16, height: 2, background: C.gold, borderRadius: 2 }} />
          </button>
        </div>
      </div>

      {sideOpen && <div onClick={closeNav} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 300, animation: "fadeIn 0.15s ease" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: 260, height: "100%", background: C.s1, borderRight: `1px solid ${C.goldBorder}`, display: "flex", flexDirection: "column", boxShadow: "4px 0 20px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "calc(env(safe-area-inset-top, 0px) + 12px) 14px 12px" }}>
            <button onClick={closeNav} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          <SidebarContent onNav={closeNav} />
        </div>
      </div>}

      <div className="app-layout" style={{ display: "flex", flex: 1 }}>
        <aside className="desktop-sidebar" style={{ display: "none", width: 230, background: `linear-gradient(180deg, ${C.s1} 0%, #0c0c0c 100%)`, borderRight: `1px solid ${C.border}`, flexDirection: "column", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <SidebarContent />
        </aside>
        <main style={{ flex: 1, overflowY: "auto" }}>
          {view === "dashboard" && <DashboardView stats={stats} clients={clients} onSelectClient={goTo} />}
          {view === "clients" && <ClientsView clients={clients} search={search} onSearch={setSearch} onSelect={id => goTo(id)} onAdd={() => setModal("addClient")} />}
          {view === "calendar" && CALENDAR_ENABLED && <CalendarView clients={clients} onSelectClient={id => goTo(id)} />}
          {view === "detail" && selected && <ClientDetailView
            client={selected} tab={tab} onTab={setTab} onBack={() => setView("clients")}
            handlers={{
              modal,
              closeModal: () => setModal(null),
              addSession: () => setModal("session"),
              addMeasurement: () => setModal("measurement"),
              addGoal: () => setModal("goal"),
              addPayment: () => setModal("payment"),
              addPack: () => setModal("pack"),
              saveSession: d => { addTo(selected.id, "sessions", d); setModal(null); },
              saveMeasurement: d => { addTo(selected.id, "measurements", d); setModal(null); },
              saveGoal: d => { addTo(selected.id, "goals", d); setModal(null); },
              savePayment: d => { addTo(selected.id, "payments", d); setModal(null); },
              savePack: d => { addTo(selected.id, "packs", d); setModal(null); },
            }}
            mutations={{
              delete: () => deleteClient(selected.id),
              updateStatus: s => updateClient(selected.id, { status: s }),
              updateProfile: d => updateClient(selected.id, d),
              removeSession: id => removeFrom(selected.id, "sessions", id),
              removeMeasurement: id => removeFrom(selected.id, "measurements", id),
              removeGoal: id => removeFrom(selected.id, "goals", id),
              removePayment: id => removeFrom(selected.id, "payments", id),
              toggleGoal: (id, val) => updateIn(selected.id, "goals", id, { completed: val }),
              togglePayment: (id, status) => updateIn(selected.id, "payments", id, { status }),
              saveProgramme: prog => addTo(selected.id, "programmes", prog),
              removeProgramme: id => removeFrom(selected.id, "programmes", id),
              addPack: pack => addTo(selected.id, "packs", pack),
              removePack: id => removeFrom(selected.id, "packs", id),
              updatePack: (id, u) => updateIn(selected.id, "packs", id, u),
            }}
          />}
        </main>
      </div>

      {modal === "addClient" && <AddClientModal onClose={() => setModal(null)} onSave={addClient} />}
      {changePwOpen && <ChangePasswordModal onClose={() => setChangePwOpen(false)} />}
    </div>
  );
}
