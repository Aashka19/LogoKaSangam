import { useEffect, useState } from "react";
import { api, label, val, useCatalog } from "../api.js";

export function Chips({ options, value, onChange }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="chips">
      {options.map((o) => (
        <button type="button" key={val(o)} className={"chip" + (value.includes(val(o)) ? " on" : "")} onClick={() => toggle(val(o))}>
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export default function SignUp({ onDone }) {
  const { interests, error: catalogError } = useCatalog();
  const [tab, setTab] = useState("signup"); // "signup" or "login"
  const [existingUsers, setExistingUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [f, setF] = useState({
    name: "",
    age: "",
    gender: "female",
    homeCity: "",
    interests: [],
    genderPreference: "any",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (tab === "login") {
      setLoadingUsers(true);
      api.getUsers()
        .then((res) => {
          const list = res.users || res || [];
          setExistingUsers(list);
          if (list.length > 0 && !selectedUserId) {
            setSelectedUserId(list[0]._id || list[0].id);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoadingUsers(false));
    }
  }, [tab]);

  const submitSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.name.trim()) return setError("Enter your name.");
    if (!f.homeCity.trim()) return setError("Enter your home city.");
    try {
      const res = await api.signup({ ...f, age: Number(f.age) || null });
      onDone(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedUserId) return setError("Select a traveller to sign in.");
    try {
      const user = await api.getUser(selectedUserId);
      onDone(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form">
      <div className="row center tab-group" style={{ marginBottom: "1.5rem", gap: "0.5rem" }}>
        <button
          type="button"
          className={`btn ${tab === "signup" ? "" : "ghost"}`}
          onClick={() => { setTab("signup"); setError(""); }}
        >
          Create Profile
        </button>
        <button
          type="button"
          className={`btn ${tab === "login" ? "" : "ghost"}`}
          onClick={() => { setTab("login"); setError(""); }}
        >
          Sign In Existing
        </button>
      </div>

      {tab === "signup" ? (
        <form onSubmit={submitSignup}>
          <h1>Set up your profile</h1>
          <label>Name<input value={f.name} onChange={set("name")} placeholder="e.g. Sarah Thomas" /></label>
          <label>Age<input type="number" min="18" value={f.age} onChange={set("age")} placeholder="18+" /></label>
          <label>Gender
            <select value={f.gender} onChange={set("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Home city<input value={f.homeCity} onChange={set("homeCity")} placeholder="e.g. Bangalore" /></label>
          <label>Travel with
            <select value={f.genderPreference} onChange={set("genderPreference")}>
              <option value="any">Anyone</option>
              <option value="female_only">Women only</option>
              <option value="male_only">Men only</option>
            </select>
          </label>
          <div className="field">Interests
            <Chips options={interests} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} />
          </div>
          {catalogError && <p className="error">{catalogError}</p>}
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit">Create profile</button>
        </form>
      ) : (
        <form onSubmit={submitLogin}>
          <h1>Sign in as traveller</h1>
          <p className="muted">Choose an existing profile from the data pack or previously created travellers.</p>
          {loadingUsers && <p className="muted">Loading travellers…</p>}
          {!loadingUsers && existingUsers.length === 0 && (
            <p className="muted">No travellers found yet. Create a new profile to get started.</p>
          )}
          {existingUsers.length > 0 && (
            <label>Select profile
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                {existingUsers.map((u) => {
                  const uid = u._id || u.id;
                  return (
                    <option key={uid} value={uid}>
                      {u.name} ({u.gender}, from {u.homeCity}) {u.travellerId ? `[${u.travellerId}]` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" disabled={!selectedUserId || loadingUsers}>
            Sign in
          </button>
        </form>
      )}
    </div>
  );
}
