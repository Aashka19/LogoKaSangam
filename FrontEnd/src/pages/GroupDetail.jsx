import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, useCatalog, useLoad, fmtDate, inr, label, val } from "../api.js";

export default function GroupDetail({ user }) {
  const { id } = useParams();
  const { data: g, loading, error, reload } = useLoad(() => api.getGroup(id, user.id), [id, user.id]);
  const { interests, error: catalogError } = useCatalog();
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState("");

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  const members = g.members || [];
  const isMember = g.isMember || members.some((m) => String(m.id) === String(user.id));
  const isOwner = g.isOwner || String(g.ownerId) === String(user.id);
  const isFull = members.length >= g.groupSize;

  const expressInterest = async () => {
    setRequesting(true);
    setActionError("");
    try {
      await api.interested(id, {
        userId: user.id,
        city: g.city,
        checkIn: g.checkIn,
        checkOut: g.checkOut,
        budget: g.budget,
        interests: user.interests || [],
        genderPreference: user.genderPreference || "any",
      });
      reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <>
      <div className="row between align-center">
        <h1>{g.name}</h1>
        {g.genderComposition && <span className="pill">{g.genderComposition}</span>}
      </div>
      <p className="muted">
        {g.city} · {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · budget {inr(g.budget)} per person ·{" "}
        {members.length}/{g.groupSize} travellers · travel preference: {String(g.genderPreference || "any").replace("_only", " only")}
      </p>

      {g.itinerary && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Proposed Itinerary</h3>
          <p className="prose" style={{ margin: 0 }}>{g.itinerary}</p>
        </div>
      )}

      {g.interests?.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Group Interests</h3>
          <div className="chips">
            {g.interests.map((interest) => {
              const option = interests.find((item) => val(item) === interest);
              return <span className="chip on" key={interest}>{option ? label(option) : interest}</span>;
            })}
          </div>
        </div>
      )}
      {catalogError && <p className="error">{catalogError}</p>}

      <h2>Travellers ({members.length}/{g.groupSize})</h2>
      <ul className="people" style={{ marginBottom: "1.5rem" }}>
        {members.map((m) => (
          <li key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link to={`/users/${m.id}`}><strong>{m.name}</strong></Link>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {m.gender}{m.age ? `, ${m.age} yrs` : ""}{m.homeCity ? ` · from ${m.homeCity}` : ""}
            </span>
            {String(m.id) === String(g.ownerId) && <span className="pill">Host</span>}
          </li>
        ))}
      </ul>

      {actionError && <p className="error">{actionError}</p>}

      <div className="row" style={{ gap: "0.75rem", marginTop: "1rem" }}>
        {isMember && (
          <Link className="btn" to={`/groups/${id}/trip`}>
            Open Group Workspace
          </Link>
        )}
        {isOwner && (
          <Link className="btn ghost" to={`/groups/${id}/requests`}>
            Requests {g.pendingCount > 0 && <span className="badge">{g.pendingCount}</span>}
          </Link>
        )}
        {!isMember && !isOwner && (
          <>
            {isFull ? (
              <span className="pill">This group is full</span>
            ) : g.myRequestStatus === "pending" ? (
              <span className="pill warning">Request Pending Approval</span>
            ) : g.myRequestStatus === "approved" ? (
              <Link className="btn" to={`/groups/${id}/trip`}>Open Group Page</Link>
            ) : (
              <button className="btn" onClick={expressInterest} disabled={requesting}>
                {requesting ? "Sending Request…" : "Express Interest to Join"}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
