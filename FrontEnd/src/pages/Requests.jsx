import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, useCatalog, useLoad, label, val } from "../api.js";

export default function Requests({ user }) {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(() => api.pending(id, user.id), [id, user.id]);
  const { interests, error: catalogError } = useCatalog();
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const list = data?.requests || data || [];

  const decide = async (rid, action) => {
    setBusyId(rid);
    setActionError("");
    try {
      await api.decide(id, rid, action, user.id);
      reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <div className="row between align-center">
        <h1>Join requests</h1>
        <div className="row" style={{ gap: "0.5rem" }}>
          <Link className="btn ghost" to={`/groups/${id}`}>Group details</Link>
          <Link className="btn" to={`/groups/${id}/trip`}>Group workspace</Link>
        </div>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}
      {catalogError && <p className="error">{catalogError}</p>}
      {!loading && !error && list.length === 0 && <p className="muted">No pending requests.</p>}
      {list.map((r) => (
        <article className="card" key={r.id}>
          <div className="row between">
            <h3><Link to={`/users/${r.userId}`}>{r.name}</Link></h3>
            <span className="muted">{r.gender}{r.age ? `, ${r.age} yrs` : ""} · from {r.homeCity}</span>
          </div>
          {r.sharedInterests?.length > 0 && (
            <p className="muted">Shared interests: {r.sharedInterests.map((interest) => {
              const option = interests.find((item) => val(item) === interest);
              return option ? label(option) : interest;
            }).join(", ")}</p>
          )}
          <div className="row">
            <button
              className="btn"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "approve")}
            >
              {busyId === r.id ? "Approving…" : "Approve"}
            </button>
            <button
              className="btn ghost"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "reject")}
            >
              Reject
            </button>
          </div>
        </article>
      ))}
    </>
  );
}
