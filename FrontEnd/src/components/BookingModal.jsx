import { inr } from "../api.js";

export default function BookingModal({ option, members, busy, error, onConfirm, onClose }) {
  const per = option.perPerson ?? option.totalPrice / members;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm booking</h2>
        <p><strong>{option.hotelName || option.name}</strong> · {option.roomType}</p>
        <p>{inr(option.totalPrice)} total, split between {members} members: <strong>{inr(per)} each</strong>.</p>
        <p className="muted">Once confirmed, the booking is locked and can't be edited.</p>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={onConfirm}>
            {busy ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
