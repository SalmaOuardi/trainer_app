export const gid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
export const fdate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
export const fmoney = n => `${parseFloat(n || 0).toFixed(2)} €`;
export const today = () => new Date().toISOString().slice(0, 10);
