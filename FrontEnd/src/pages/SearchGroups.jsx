import { useState } from "react";
import { api, label, val, useCatalog, MIN_DATE, MAX_DATE } from "../api.js";
import { Chips } from "./SignUp.jsx";
import MatchCard from "../components/MatchCard.jsx";

export default function SearchGroups({ user }) {
  const { cities, interests } = useCatalog();
  const [f, setF] = useState({
    homeCity: user.homeCity || "", city: "", checkIn: "", checkOut: "",
    interests: user.interests || [], budget: "", genderPreference: user.genderPreference || "any",
  });
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState({ interests: [], gender: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.city || !f.checkIn || !f.checkOut) return setError("Choose a destination and dates.");
    if (f.checkOut <= f.checkIn) return setError("Check-out must be after check-in.");
    if (!(Number(f.budget) > 0)) return setError("Enter your budget per person.");
    setBusy(true);
    try {
      const r = await api.search({ ...f, budget: Number(f.budget), userId: user.id });
      setResults(r.matches || r);
      setFilter({ interests: [], gender: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shown = (results || []).filter(
    (g) =>
      (!filter.gender || g.ownerGender === filter.gender) &&
      filter.interests.every((i) => (g.sharedInterests || []).includes(i))
  );

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <h1>Find your travel crew</h1>
          <p>Match with solo travellers heading to the same city on the same dates.</p>
          <form onSubmit={submit}>
            <div className="searchbar">
              <label>From<input value={f.homeCity} onChange={set("homeCity")} placeholder="Home city" /></label>
              <label>Destination
                <select value={f.city} onChange={set("city")}>
                  <option value="">Choose a city</option>
                  {cities.map((c) => <option key={val(c)} value={val(c)}>{label(c)}</option>)}
                </select>
              </label>
              <label>Check-in<input type="date" min={MIN_DATE} max={MAX_DATE} value={f.checkIn} onChange={set("checkIn")} /></label>
              <label>Check-out<input type="date" min={MIN_DATE} max={MAX_DATE} value={f.checkOut} onChange={set("checkOut")} /></label>
              <label>Budget per person (₹)<input type="number" min="0" value={f.budget} onChange={set("budget")} /></label>
              <label>Travel with
                <select value={f.genderPreference} onChange={set("genderPreference")}>
                  <option value="any">Anyone</option>
                  <option value="female_only">Women only</option>
                  <option value="male_only">Men only</option>
                </select>
              </label>
              <button className="btn search-btn" disabled={busy}>{busy ? "Searching…" : "Search"}</button>
            </div>
            <div className="hero-interests">
              <span>Interests</span>
              <Chips options={interests} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} />
            </div>
            {error && <p className="hero-error">{error}</p>}
          </form>
        </div>
      </section>

      {results && (
        <div className="results">
          <aside className="side-filters">
            <h3>Filter results</h3>
            <div className="field">Must share
              <Chips options={f.interests} value={filter.interests} onChange={(v) => setFilter({ ...filter, interests: v })} />
            </div>
            <label>Host gender
              <select value={filter.gender} onChange={(e) => setFilter({ ...filter, gender: e.target.value })}>
                <option value="">Any</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
          </aside>
          <section>
            <h2 className="tight">{shown.length} matching {shown.length === 1 ? "group" : "groups"}</h2>
            {shown.length === 0 && (
              <div className="empty">
                <h3>No groups match yet</h3>
                <p className="muted">Try widening your dates, adding interests or raising your budget, or create your own group.</p>
              </div>
            )}
            {shown.map((g) => <MatchCard key={g.id} g={g} />)}
          </section>
        </div>
      )}
    </>
  );
}
