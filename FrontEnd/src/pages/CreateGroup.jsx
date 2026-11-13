import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, label, val, useCatalog, MIN_DATE, MAX_DATE } from "../api.js";
import { Chips } from "./SignUp.jsx";

export default function CreateGroup({ user }) {
  const nav = useNavigate();
  const { cities, interests, error: catalogError } = useCatalog();
  const [f, setF] = useState({
    name: "",
    city: "",
    checkIn: "",
    checkOut: "",
    groupSize: 3,
    budget: "",
    interests: user?.interests || [],
    itinerary: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.name.trim() || !f.city || !f.checkIn || !f.checkOut) return setError("Fill in the name, city and dates.");
    if (f.checkOut <= f.checkIn) return setError("Check-out must be after check-in.");
    if (!(Number(f.budget) > 0)) return setError("Enter a budget per person.");
    try {
      const g = await api.createGroup({ ...f, groupSize: Number(f.groupSize), budget: Number(f.budget), ownerId: user.id });
      nav(`/groups/${g.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <h1>Create a group trip</h1>
      <label>Group name<input value={f.name} onChange={set("name")} /></label>
      <label>Destination
        <select value={f.city} onChange={set("city")}>
          <option value="">Choose a city</option>
          {cities.map((c) => <option key={val(c)} value={val(c)}>{label(c)}</option>)}
        </select>
      </label>
      <div className="row">
        <label>Check-in<input type="date" min={MIN_DATE} max={MAX_DATE} value={f.checkIn} onChange={set("checkIn")} /></label>
        <label>Check-out<input type="date" min={MIN_DATE} max={MAX_DATE} value={f.checkOut} onChange={set("checkOut")} /></label>
      </div>
      <label>Total travellers wanted (including you)
        <select value={f.groupSize} onChange={set("groupSize")}>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label>Budget per person (₹)<input type="number" min="0" value={f.budget} onChange={set("budget")} /></label>
      <label>Proposed itinerary<textarea rows="4" value={f.itinerary} onChange={set("itinerary")} /></label>
      <div className="field">Interests
        <Chips options={interests} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} />
      </div>
      {catalogError && <p className="error">{catalogError}</p>}
      {error && <p className="error">{error}</p>}
      <button className="btn">Post group</button>
    </form>
  );
}
