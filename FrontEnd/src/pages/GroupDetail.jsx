import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, useLoad, fmtDate, inr } from "../api.js";

export default function GroupDetail({ user }) {
  const { id } = useParams();
  const { data: g, loading, error, reload } = useLoad(() => api.getGroup(id), [id]);
  const [msg, setMsg] = useState("");

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  const members = g.members || [];
  const isMember = members.some((m) => String(m.id) === String(user.id));
  const isOwner = String(g.ownerId) === String(user.id);
  const full = members.length >= g.groupSize;
  const requested = g.myRequestStatus === "pending";

  const interested = async () => {
    try {
      await api.interested(id, user.id);
      setMsg("Request sent. The owner will review it.");
      reload();
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <>
      <h1>{g.name}</h1>
      <p className="muted">
        {g.city} · {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · budget {inr(g.budget)} per person ·{" "}
        {members.length}/{g.groupSize} travellers
      </p>
      {g.itinerary && <p className="prose">{g.itinerary}</p>}

      <h2>Travellers</h2>
      <ul className="people">
        {members.map((m) => (
          <li key={m.id}>
            <Link to={`/users/${m.id}`}>{m.name}</Link>
            {String(m.id) === String(g.ownerId) && <span className="pill">owner</span>}
          </li>
        ))}
      </ul>

      <div className="row">
        {isMember && <Link className="btn" to={`/groups/${id}/trip`}>Open group page</Link>}
        {isOwner && (
          <Link className="btn ghost" to={`/groups/${id}/requests`}>
            Requests {g.pendingCount > 0 && <span className="badge">{g.pendingCount}</span>}
          </Link>
        )}
        {!isMember && (
          <button className="btn" disabled={full || requested} onClick={interested}>
            {full ? "Group is full" : requested ? "Request pending" : "I'm interested"}
          </button>
        )}
      </div>
      {msg && <p className="muted">{msg}</p>}
    </>
  );
}
