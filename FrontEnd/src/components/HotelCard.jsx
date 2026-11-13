import { inr, thumb } from "../api.js";

export default function HotelCard({ h, members, saved, onSave, onRemove, onBook, locked }) {
  const name = h.hotelName || h.name;
  const per = h.perPerson ?? h.totalPrice / members;
  return (
    <article className="listing">
      <div className="thumb" style={thumb(name)}>
        <span>{h.stars ? `${h.stars}★` : "Hotel"}</span>
      </div>
      <div className="listing-body">
        <h3>{name}</h3>
        <p className="muted">
          {h.roomType}{h.nights ? ` · ${h.nights} nights` : ""}{h.rating ? ` · rated ${h.rating}` : ""}
        </p>
        <p className="muted">{inr(h.totalPrice)} total for {members} {members === 1 ? "member" : "members"}</p>
      </div>
      <div className="listing-side">
        <div className="price"><strong>{inr(per)}</strong><span>per person</span></div>
        {!locked && (
          <div className="row">
            {saved
              ? <button className="btn ghost" onClick={onRemove}>Remove</button>
              : <button className="btn ghost" onClick={onSave}>Save</button>}
            {onBook && <button className="btn" onClick={onBook}>Book</button>}
          </div>
        )}
      </div>
    </article>
  );
}
