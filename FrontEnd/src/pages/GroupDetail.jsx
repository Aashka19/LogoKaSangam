import { Link, useParams } from "react-router-dom";
import { api, useCatalog, useLoad, fmtDate, inr, label, val } from "../api.js";

export default function GroupDetail({ user }) {
  const { id } = useParams();
  const { data: g, loading, error } = useLoad(() => api.getGroup(id, user.id), [id, user.id]);
  const { interests, error: catalogError } = useCatalog();

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  const members = g.members || [];
  const isMember = members.some((m) => String(m.id) === String(user.id));
  const isOwner = String(g.ownerId) === String(user.id);
  return (
    <>
      <h1>{g.name}</h1>
      <p className="muted">
        {g.city} · {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · budget {inr(g.budget)} per person ·{" "}
        {members.length}/{g.groupSize} travellers · travel preference: {g.genderPreference.replace("_only", " only")}
      </p>
      {g.itinerary && <p className="prose">{g.itinerary}</p>}
      {g.interests?.length > 0 && (
        <div className="chips">{g.interests.map((interest) => {
          const option = interests.find((item) => val(item) === interest);
          return <span className="chip on" key={interest}>{option ? label(option) : interest}</span>;
        })}</div>
      )}
      {catalogError && <p className="error">{catalogError}</p>}

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
      </div>
    </>
  );
}
