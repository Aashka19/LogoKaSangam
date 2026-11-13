import { Link, useParams } from "react-router-dom";
import { api, useLoad, fmtDate } from "../api.js";

export default function Profile() {
  const { id } = useParams();
  const { data: u, loading, error } = useLoad(() => api.getUser(id), [id]);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <h1>{u.name}</h1>
      <p className="muted">{u.age ? `${u.age} · ` : ""}{u.gender} · from {u.homeCity}</p>
      <h2>Interests</h2>
      <div className="chips">{(u.interests || []).map((i) => <span className="chip on" key={i}>{i}</span>)}</div>
      <h2>Groups</h2>
      {(u.groups || []).length === 0 && <p className="muted">Not in any groups yet.</p>}
      {(u.groups || []).map((g) => (
        <article className="card" key={g.id}>
          <h3><Link to={`/groups/${g.id}`}>{g.name}</Link></h3>
          <p className="muted">{g.city} · {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)}</p>
        </article>
      ))}
    </>
  );
}
