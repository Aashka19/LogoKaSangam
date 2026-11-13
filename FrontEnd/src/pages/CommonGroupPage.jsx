import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, useLoad, fmtDate, inr } from "../api.js";
import HotelCard from "../components/HotelCard.jsx";
import BookingModal from "../components/BookingModal.jsx";

export default function CommonGroupPage({ user }) {
  const { id } = useParams();
  const { data: g, loading, error, reload } = useLoad(() => api.getGroup(id, user.id), [id, user.id]);
  const [hotels, setHotels] = useState(null);
  const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
  const [err, setErr] = useState("");
  const [toBook, setToBook] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bookErr, setBookErr] = useState("");

  useEffect(() => {
    if (g) setDates({ checkIn: g.checkIn, checkOut: g.checkOut });
  }, [g?.id]);

  useEffect(() => {
    if (g) search(g.checkIn, g.checkOut);
  }, [g?.id]);

  async function search(ci = dates.checkIn, co = dates.checkOut) {
    setErr("");
    try {
      const r = await api.hotels(id, ci, co, user.id);
      setHotels(r.hotels || r);
    } catch (e) {
      setErr(e.message);
      setHotels([]);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  const members = g.members || [];
  const n = members.length || 1;
  const isOwner = g.isOwner || String(g.ownerId) === String(user.id);
  const saved = g.savedOptions || [];
  const booking = g.booking;
  const savedKey = (h) =>
    saved.find((s) =>
      s.hotelId === h.hotelId &&
      s.roomId === h.roomId &&
      s.checkIn === dates.checkIn &&
      s.checkOut === dates.checkOut
    );

  const save = async (h) => {
    try {
      await api.saveOption(id, {
        hotelId: h.hotelId,
        roomId: h.roomId,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        userId: user.id,
      });
      setErr("");
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };

  const remove = async (s) => {
    try {
      await api.removeOption(id, s.id, user.id);
      setErr("");
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setBookErr("");
    try {
      await api.book(id, toBook.id || toBook.optionId, user.id);
      setToBook(null);
      reload();
    } catch (e) {
      setBookErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="row between align-center">
        <h1>{g.name}</h1>
        <Link className="btn ghost" to={`/groups/${id}`}>Trip Details</Link>
      </div>
      <p className="muted">
        {g.city} · {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · {members.map((m) => m.name).join(", ")}
      </p>

      {/* Creator notification badge for pending join requests per FAQ */}
      {isOwner && g.pendingCount > 0 && (
        <div className="card pending-alert" style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🔔 You have <strong>{g.pendingCount}</strong> pending join request{g.pendingCount > 1 ? "s" : ""} waiting for your review.</span>
          <Link className="btn sm" to={`/groups/${id}/requests`} style={{ padding: "0.35rem 0.75rem" }}>
            Review Requests ({g.pendingCount})
          </Link>
        </div>
      )}

      {booking && (
        <div className="card locked" style={{ borderLeft: "4px solid #10b981", background: "#f0fdf4", marginBottom: "1.5rem" }}>
          <h3 style={{ color: "#065f46", marginTop: 0 }}>✓ Booking Confirmed & Locked</h3>
          <p><strong>Booking Reference:</strong> {booking.id}</p>
          <p><strong>Hotel:</strong> {booking.hotelName} ({booking.roomType})</p>
          <p><strong>Dates:</strong> {fmtDate(booking.checkIn)} – {fmtDate(booking.checkOut)} ({booking.nights} nights)</p>
          <p className="big" style={{ margin: "0.5rem 0" }}>
            {inr(booking.perPerson)} <small>per person</small> · {inr(booking.totalPrice)} total split among {n} members
          </p>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            This booking is locked for all members. Total cost has been updated and split equally per person.
          </p>
        </div>
      )}

      <div className="split">
        <section>
          <h2>Search hotels</h2>
          <div className="row end">
            <label>Check-in<input type="date" value={dates.checkIn} min="2027-04-01" max="2027-04-20" onChange={(e) => setDates({ ...dates, checkIn: e.target.value })} /></label>
            <label>Check-out<input type="date" value={dates.checkOut} min="2027-04-01" max="2027-04-20" onChange={(e) => setDates({ ...dates, checkOut: e.target.value })} /></label>
            <button className="btn" onClick={() => search()}>Search</button>
          </div>
          {err && <p className="error">{err}</p>}
          {hotels && hotels.length === 0 && !err && <p className="muted">No rooms available for these dates. Try different dates.</p>}
          {(hotels || []).map((h) => (
            <HotelCard
              key={`${h.hotelId}-${h.roomId}`}
              h={h}
              members={n}
              locked={!!booking}
              saved={!!savedKey(h)}
              onSave={() => save(h)}
              onRemove={() => remove(savedKey(h))}
            />
          ))}
        </section>

        <aside>
          <h2>Saved options & alignment</h2>
          {saved.length === 0 && <p className="muted">Save hotel options to compare and finalize consensus as a group.</p>}
          {saved.map((s) => (
            <HotelCard
              key={s.id}
              h={s}
              members={n}
              locked={!!booking}
              saved
              onRemove={() => remove(s)}
              onBook={() => setToBook(s)}
              bookLabel="Finalize Booking"
            />
          ))}
          <Chat gid={id} user={user} />
        </aside>
      </div>

      {toBook && (
        <BookingModal option={toBook} members={n} busy={busy} error={bookErr} onConfirm={confirm} onClose={() => setToBook(null)} />
      )}
    </>
  );
}

function Chat({ gid, user }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const tick = () => api.messages(gid, user.id)
      .then((r) => {
        setMsgs(r.messages || r);
        setError("");
      })
      .catch((e) => setError(e.message));
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [gid, user.id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.sendMessage(gid, user.id, text.trim());
      setText("");
      const r = await api.messages(gid, user.id);
      setMsgs(r.messages || r);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Group Discussion</h2>
      {error && <p className="error">{error}</p>}
      <div className="chat" style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "0.5rem" }}>
        {msgs.length === 0 && <p className="muted">No messages yet. Coordinate hotel choices here!</p>}
        {msgs.map((m) => (
          <p key={m.id} style={{ margin: "0.35rem 0" }}>
            <strong>{m.userName || m.name}:</strong> {m.text}
          </p>
        ))}
      </div>
      <form className="row" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the group" />
        <button className="btn">Send</button>
      </form>
    </div>
  );
}
