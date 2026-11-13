import { Link } from "react-router-dom";
import { fmtDate, inr, thumb } from "../api.js";

export default function MatchCard({ g, requesting, onInterested }) {
  const full = g.memberCount >= g.groupSize;
  return (
    <article className="listing">
      <div className="thumb" style={thumb(g.city)}><span>{g.city}</span></div>
      <div className="listing-body">
        <div className="row between align-center" style={{ gap: "0.5rem" }}>
          <h3 style={{ margin: 0 }}>
            <Link to={`/groups/${g.id}`}>{g.name}</Link>
          </h3>
          <div className="row" style={{ gap: "0.35rem" }}>
            {g.compatibilityPercent && (
              <span className="pill success" title="Compatibility score">
                {g.compatibilityPercent}% Match
              </span>
            )}
            {g.genderComposition && (
              <span className="pill" title="Group gender composition">
                {g.genderComposition}
              </span>
            )}
          </div>
        </div>
        <p className="muted">
          {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · hosted by{" "}
          <Link to={`/users/${g.ownerId}`}>{g.ownerName}</Link>
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
        <div className="column" style={{ gap: "0.5rem", width: "100%" }}>
          <button
            className="btn"
            disabled={full || requesting || g.myRequestStatus === "pending"}
            onClick={onInterested}
          >
            {full ? "Group is full" : requesting ? "Sending…" : g.myRequestStatus === "pending" ? "Request pending" : "I'm interested"}
          </button>
          <Link className="btn ghost" to={`/groups/${g.id}`} style={{ textAlign: "center" }}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
