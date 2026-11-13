import { Link, useParams } from "react-router-dom";
import { api, useCatalog, useLoad, fmtDate, label, val } from "../api.js";

export default function Profile() {
  const { id } = useParams();
  const { data: u, loading, error } = useLoad(() => api.getUser(id), [id]);
  const { interests, error: catalogError } = useCatalog();

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <div className="row align-center" style={{ gap: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>{u.name}</h1>
        {u.travellerId && <span className="pill">{u.travellerId}</span>}
      </div>
      <p className="muted">
        {u.age ? `${u.age} yrs · ` : ""}{u.gender} · from {u.homeCity} · travel preference: {String(u.genderPreference || "any").replace("_only", " only")}
      </p>
      <h2>Interests</h2>
      <div className="chips">{(u.interests || []).map((i) => {
        const option = interests.find((item) => val(item) === i);
        return <span className="chip on" key={i}>{option ? label(option) : i}</span>;
      })}</div>
      {catalogError && <p className="error">{catalogError}</p>}
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
