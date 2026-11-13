import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, useLoad, fmtDate, inr } from "../api.js";
import HotelCard from "../components/HotelCard.jsx";
import BookingModal from "../components/BookingModal.jsx";

export default function CommonGroupPage({ user }) {
  const { id } = useParams();
  const { data: g, loading, error, reload } = useLoad(() => api.getGroup(id), [id]);
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
      const r = await api.hotels(id, ci, co);
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
  const saved = g.savedOptions || [];
  const booking = g.booking;
  const savedKey = (h) => saved.find((s) => s.hotelId === h.hotelId && s.roomId === h.roomId);

  const save = async (h) => { await api.saveOption(id, { hotelId: h.hotelId, roomId: h.roomId, userId: user.id }); reload(); };
  const remove = async (s) => { await api.removeOption(id, s.id); reload(); };

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
      <h1>{g.name}</h1>
      <p className="muted">
        {g.city} · {fmtDate(g.checkIn)} – {fmtDate(g.checkOut)} · {members.map((m) => m.name).join(", ")}
      </p>

      {booking && (
        <div className="card locked">
          <h3>Booked</h3>
          <p>Booking {booking.id} · {booking.hotelName}</p>
          <p className="big">{inr(booking.perPerson)} <small>per person</small> · {inr(booking.totalPrice)} total</p>
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
          <h2>Saved options</h2>
          {saved.length === 0 && <p className="muted">Save hotels to compare them as a group.</p>}
          {saved.map((s) => (
            <HotelCard
              key={s.id}
              h={s}
              members={n}
              locked={!!booking}
              saved
              onRemove={() => remove(s)}
              onBook={() => setToBook(s)}
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

  useEffect(() => {
    const tick = () => api.messages(gid).then((r) => setMsgs(r.messages || r)).catch(() => {});
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [gid]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.sendMessage(gid, user.id, text.trim()).catch(() => {});
    setText("");
    api.messages(gid).then((r) => setMsgs(r.messages || r)).catch(() => {});
  };

  return (
    <>
      <h2>Chat</h2>
      <div className="chat">
        {msgs.length === 0 && <p className="muted">No messages yet.</p>}
        {msgs.map((m) => (
          <p key={m.id}><strong>{m.userName || m.name}:</strong> {m.text}</p>
        ))}
      </div>
      <form className="row" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the group" />
        <button className="btn">Send</button>
      </form>
    </>
  );
}
