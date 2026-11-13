import { Link } from "react-router-dom";
import { api, useLoad, fmtDate, thumb } from "../api.js";

export default function Home({ user }) {
  const { data, loading, error } = useLoad(() => api.myGroups(user.id), [user.id]);
  const groups = data?.groups || data || [];

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <h1>Hi {user.name}, where to next?</h1>
          <p>Find travellers going your way, or post your own trip and let them find you.</p>
          <div className="row">
            <Link className="btn gold" to="/search">Find a group</Link>
            <Link className="btn light" to="/groups/new">Create a group</Link>
          </div>
        </div>
      </section>

      <h2>Your trips</h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && groups.length === 0 && (
        <div className="empty">
          <h3>No trips yet</h3>
          <p className="muted">Create a group or search for one to join.</p>
        </div>
      )}
      {groups.map((g) => (
        <article className="listing" key={g.id}>
          <div className="thumb" style={thumb(g.city)}><span>{g.city}</span></div>
          <div className="listing-body">
            <h3><Link to={`/groups/${g.id}`}>{g.name}</Link></h3>
            <p className="muted">{fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · {g.memberCount} members</p>
            <span className="pill">{g.status || g.role}</span>
          </div>
          <div className="listing-side">
            {(g.role === "member" || g.role === "owner" || g.status === "approved") && (
              <Link className="btn" to={`/groups/${g.id}/trip`}>Open group page</Link>
            )}
            {g.role === "owner" && (
              <Link className="btn ghost" to={`/groups/${g.id}/requests`}>
                Requests {g.pendingCount > 0 && <span className="badge">{g.pendingCount}</span>}
              </Link>
            )}
          </div>
        </article>
      ))}
    </>
  );
}
