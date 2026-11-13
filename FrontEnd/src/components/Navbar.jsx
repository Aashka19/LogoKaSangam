import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { api } from "../api.js";

export default function Navbar({ user, onLogout }) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!user) return;
    const tick = () => api.pendingCount(user.id).then((r) => setPending(r.count ?? r)).catch(() => {});
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [user]);

  return (
    <header className="nav">
      <div className="nav-in">
        <Link to="/" className="brand">Travel Together</Link>
        {user && (
          <nav>
            <NavLink to="/search">Find a group</NavLink>
            <NavLink to="/groups/new">Create a group</NavLink>
            <NavLink to="/" end>
              My trips {pending > 0 && <span className="badge">{pending}</span>}
            </NavLink>
            <Link to={`/users/${user.id}`} className="avatar" title={user.name}>{user.name?.[0]?.toUpperCase()}</Link>
            <button className="link" onClick={onLogout}>Sign out</button>
          </nav>
        )}
      </div>
    </header>
  );
}
