import { Link } from "react-router-dom";
import { fmtDate, inr, thumb } from "../api.js";

export default function MatchCard({ g, requesting, onInterested }) {
  const full = g.memberCount >= g.groupSize;
  return (
    <article className="listing">
      <div className="thumb" style={thumb(g.city)}><span>{g.city}</span></div>
      <div className="listing-body">
        <h3>{g.name}</h3>
        <p className="muted">
          {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · hosted by <Link to={`/users/${g.ownerId}`}>{g.ownerName}</Link>
        </p>
        <p className="muted">Budget {inr(g.budget)} per person</p>
        {g.reasons?.length > 0 && (
          <ul className="reasons">
            {g.reasons.map((r, i) => <li key={i}>✓ {r}</li>)}
          </ul>
        )}
      </div>
      <div className="listing-side">
        <div className="seats"><strong>{g.memberCount}/{g.groupSize}</strong><span>travellers</span></div>
        <button
          className="btn"
          disabled={full || requesting || g.myRequestStatus === "pending"}
          onClick={onInterested}
        >
          {full ? "Group is full" : requesting ? "Sending…" : g.myRequestStatus === "pending" ? "Request pending" : "I'm interested"}
        </button>
      </div>
    </article>
  );
}
