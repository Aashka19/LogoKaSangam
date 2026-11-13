import { useEffect, useState } from "react";

const BASE = import.meta.env.VITE_API_URL || "/api";

async function req(path, method = "GET", body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || data?.message || data?.detail || `Request failed (${res.status})`);
  return data;
}

const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

export const api = {
  cities: () => req("/catalog/cities"),
  interests: () => req("/catalog/interests"),
  signup: (d) => req("/users", "POST", d),
  getUser: (id) => req(`/users/${id}`),
  myGroups: (uid) => req(`/users/${uid}/groups`),
  createGroup: (d) => req("/groups", "POST", d),
  getGroup: (id, userId) => req(`/groups/${id}?${qs({ userId })}`),
  search: (criteria) => req("/matches/search", "POST", criteria),
  interested: (gid, criteria) => req(`/groups/${gid}/interest`, "POST", criteria),
  pending: (gid, userId) => req(`/groups/${gid}/requests?${qs({ userId })}`),
  decide: (gid, rid, action, userId) => req(`/groups/${gid}/requests/${rid}/${action}`, "POST", { userId }),
  pendingCount: (uid) => req(`/users/${uid}/pending-count`),
  hotels: (gid, checkIn, checkOut, userId) => req(`/groups/${gid}/hotels?${qs({ checkIn, checkOut, userId })}`),
  saveOption: (gid, d) => req(`/groups/${gid}/saved-options`, "POST", d),
  removeOption: (gid, oid, userId) => req(`/groups/${gid}/saved-options/${oid}?${qs({ userId })}`, "DELETE"),
  book: (gid, optionId, userId) => req(`/groups/${gid}/book`, "POST", { optionId, userId }),
  messages: (gid, userId) => req(`/groups/${gid}/messages?${qs({ userId })}`),
  sendMessage: (gid, userId, text) => req(`/groups/${gid}/messages`, "POST", { userId, text }),
};

export const session = {
  get: () => localStorage.getItem("userId"),
  set: (id) => localStorage.setItem("userId", id),
  clear: () => localStorage.removeItem("userId"),
};

export const label = (x) => (typeof x === "string" ? x : x.name || x.label || String(x.id));
export const val = (x) => (typeof x === "string" ? x : x.id ?? x.name);
export const inr = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
export const fmtDate = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

export const MIN_DATE = "2027-04-01";
export const MAX_DATE = "2027-04-20";

export function useCatalog() {
  const [cities, setCities] = useState([]);
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.cities(), api.interests()])
      .then(([cityOptions, interestOptions]) => {
        setCities(cityOptions);
        setInterests(interestOptions);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  return { cities, interests, error };
}

export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const run = () => {
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => setState({ data, error: "", loading: false }))
      .catch((e) => setState({ data: null, error: e.message, loading: false }));
  };
  useEffect(run, deps);
  return { ...state, reload: run };
}

export const thumb = (s = "") => {
  const h = [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 40;
  return { background: `linear-gradient(135deg, hsl(${210 + h} 85% 28%), hsl(${200 + h} 85% 48%))` };
};
