import { inr } from "../api.js";

export default function BookingModal({ option, members, busy, error, onConfirm, onClose }) {
  const per = option.perPerson ?? option.totalPrice / members;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Finalize group booking</h2>
        <p><strong>{option.hotelName || option.name}</strong> · {option.roomType}</p>
        <p>{inr(option.totalPrice)} total, split equally between {members} {members === 1 ? "member" : "members"}: <strong>{inr(per)} per person</strong>.</p>
        <p className="muted">Once finalized, the booking is locked for all group members and cannot be edited.</p>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={onConfirm}>
            {busy ? "Finalizing…" : "Finalize & lock booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
