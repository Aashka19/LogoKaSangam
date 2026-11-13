import { Link, useParams } from "react-router-dom";
import { api, useCatalog, useLoad, label, val } from "../api.js";

export default function Requests({ user }) {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(() => api.pending(id, user.id), [id, user.id]);
  const { interests, error: catalogError } = useCatalog();
  const list = data?.requests || data || [];

  const decide = async (rid, action) => {
    try {
      await api.decide(id, rid, action, user.id);
      reload();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <>
      <h1>Join requests</h1>
      <Link to={`/groups/${id}`}>Back to group</Link>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {catalogError && <p className="error">{catalogError}</p>}
      {!loading && !error && list.length === 0 && <p className="muted">No pending requests.</p>}
      {list.map((r) => (
        <article className="card" key={r.id}>
          <div className="row between">
            <h3><Link to={`/users/${r.userId}`}>{r.name}</Link></h3>
            <span className="muted">{r.homeCity}</span>
          </div>
          {r.sharedInterests?.length > 0 && (
            <p className="muted">Shared interests: {r.sharedInterests.map((interest) => {
              const option = interests.find((item) => val(item) === interest);
              return option ? label(option) : interest;
            }).join(", ")}</p>
          )}
          <div className="row">
            <button className="btn" onClick={() => decide(r.id, "approve")}>Approve</button>
            <button className="btn ghost" onClick={() => decide(r.id, "reject")}>Reject</button>
          </div>
        </article>
      ))}
    </>
  );
}
