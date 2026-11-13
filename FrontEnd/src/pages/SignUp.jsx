import { useState } from "react";
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

  const submit = async (e) => {
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

  return (
    <form className="form" onSubmit={submit}>
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
  );
}
