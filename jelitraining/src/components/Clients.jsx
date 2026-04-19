import { C } from "../theme.js";
import { fmoney } from "../utils.js";
import { Input, Btn, Tag, Empty } from "./ui.jsx";

export function ClientsView({ clients, search, onSearch, onSelect, onAdd }) {
  const q = search.toLowerCase();
  const filtered = q
    ? clients.filter(c => `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q))
    : clients;

  return (
    <div style={{ padding: "40px 44px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, animation: "fadeIn 0.3s ease" }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            Mes <span style={{ color: C.gold }}>Clients</span>
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 5, marginBottom: 0 }}>{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={onAdd}>+ Nouveau client</Btn>
      </div>
      <Input value={search} onChange={e => onSearch(e.target.value)} placeholder="🔍  Rechercher un client…" style={{ maxWidth: 400, marginBottom: 24 }} />
      {filtered.length === 0
        ? <Empty icon="👥" text={search ? "Aucun client correspondant" : "Aucun client — ajoutez votre premier !"} />
        : <div style={{ display: "grid", gap: 12 }}>
            {filtered.map((c, idx) => {
              const paid = (c.payments || []).filter(p => p.status === "payé").reduce((s, p) => s + Number(p.amount), 0);
              const actif = (c.status || "actif") === "actif";
              const hasPending = (c.payments || []).some(p => p.status === "en attente");
              return (
                <div key={c.id} onClick={() => onSelect(c.id)}
                  style={{ background: C.s1, border: `1px solid ${hasPending ? C.orange + "55" : C.border}`, borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 18, cursor: "pointer", transition: "all 0.2s ease", boxShadow: "none", animation: "slideUp 0.35s ease both", animationDelay: `${idx * 40}ms` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.background = C.s2; e.currentTarget.style.boxShadow = C.shadow2; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = hasPending ? C.orange + "55" : C.border; e.currentTarget.style.background = C.s1; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${C.goldAlpha}, rgba(201,168,76,0.2))`, border: `1.5px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `inset 0 1px 2px rgba(201,168,76,0.1)` }}>
                    <span style={{ color: C.gold, fontWeight: 700, fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{(c.firstName || "?")[0]}{(c.lastName || "")[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{c.firstName} {c.lastName}</div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{c.email || c.phone || "—"}{c.goal ? ` · ${c.goal}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}><div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{(c.sessions || []).length}</div><div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>séances</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ color: C.green, fontWeight: 700, fontSize: 16 }}>{fmoney(paid)}</div><div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>encaissé</div></div>
                    {hasPending && <Tag color={C.orange}>Impayé</Tag>}
                    <Tag color={actif ? C.green : C.muted}>{actif ? "Actif" : "Inactif"}</Tag>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}
