import { Link } from "react-router-dom";
import { fmtDate, thumb } from "../api.js";

export default function MatchCard({ g }) {
  const full = g.memberCount >= g.groupSize;
  return (
    <article className="listing">
      <div className="thumb" style={thumb(g.city)}><span>{g.city}</span></div>
      <div className="listing-body">
        <h3><Link to={`/groups/${g.id}`}>{g.name}</Link></h3>
        <p className="muted">
          {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · hosted by <Link to={`/users/${g.ownerId}`}>{g.ownerName}</Link>
        </p>
        {g.reasons?.length > 0 && (
          <ul className="reasons">
            {g.reasons.map((r, i) => <li key={i}>✓ {r}</li>)}
          </ul>
        )}
      </div>
      <div className="listing-side">
        <div className="seats"><strong>{g.memberCount}/{g.groupSize}</strong><span>travellers</span></div>
        <Link className="btn" to={`/groups/${g.id}`}>{full ? "View group" : "See details"}</Link>
      </div>
    </article>
  );
}
