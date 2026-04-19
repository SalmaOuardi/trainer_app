import { SK, saveToStorage } from "./lib.js";

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const AUTH_KEY = "jeli-auth";
export const PW_KEY = "jeli-pw-hash";
export const DEFAULT_PW = import.meta.env.VITE_DEFAULT_PW || "ChangeMe123";

const CLIENT_PREFIX = "jeli-client-";

const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

// Fetch all clients (per-row model)
export const sbGetAll = async () => {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/store?key=like.${CLIENT_PREFIX}%&select=value`, { headers });
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data.map(row => JSON.parse(row.value));
  } catch { return null; }
};

// Upsert a single client row
export const sbSaveClient = async (client) => {
  await fetch(`${SB_URL}/rest/v1/store`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ key: `${CLIENT_PREFIX}${client.id}`, value: JSON.stringify(client) }),
  });
};

// Delete a single client row
export const sbDeleteClient = async (id) => {
  await fetch(`${SB_URL}/rest/v1/store?key=eq.${CLIENT_PREFIX}${id}`, {
    method: "DELETE",
    headers,
  });
};

// Legacy helpers used only for one-time migration
export const sbGetLegacy = async () => {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/store?key=eq.${SK}&select=value`, { headers });
    const data = await r.json();
    if (data && data[0]) return JSON.parse(data[0].value);
    return null;
  } catch { return null; }
};

export const sbDeleteLegacy = async () => {
  try {
    await fetch(`${SB_URL}/rest/v1/store?key=eq.${SK}`, { method: "DELETE", headers });
  } catch {}
};

export const sbGetPw = async () => {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/store?key=eq.${PW_KEY}&select=value`, { headers });
    const data = await r.json();
    if (data && data[0]) return data[0].value;
    return null;
  } catch { return null; }
};

export const sbSetPw = async (hash) => {
  await fetch(`${SB_URL}/rest/v1/store`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ key: PW_KEY, value: hash }),
  });
};
