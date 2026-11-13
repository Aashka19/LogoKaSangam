import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api, session } from "./api.js";
import Navbar from "./components/Navbar.jsx";
import SignUp from "./pages/SignUp.jsx";
import Home from "./pages/Home.jsx";
import CreateGroup from "./pages/CreateGroup.jsx";
import SearchGroups from "./pages/SearchGroups.jsx";
import GroupDetail from "./pages/GroupDetail.jsx";
import Requests from "./pages/Requests.jsx";
import CommonGroupPage from "./pages/CommonGroupPage.jsx";
import Profile from "./pages/Profile.jsx";

export default function App() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!session.get());

  useEffect(() => {
    const id = session.get();
    if (!id) return;
    api.getUser(id).then(setUser).catch(() => session.clear()).finally(() => setReady(true));
  }, []);

  const login = (u) => {
    const id = u._id || u.id;
    session.set(id);
    setUser({ ...u, id });
    nav("/");
  };
  const logout = () => {
    session.clear();
    setUser(null);
    nav("/signup");
  };

  if (!ready) return <p className="muted pad">Loading…</p>;

  const guard = (el) => (user ? el : <Navigate to="/signup" replace />);

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <main className="wrap">
        <Routes>
          <Route path="/signup" element={<SignUp onDone={login} />} />
          <Route path="/" element={guard(<Home user={user} />)} />
          <Route path="/groups/new" element={guard(<CreateGroup user={user} />)} />
          <Route path="/search" element={guard(<SearchGroups user={user} />)} />
          <Route path="/groups/:id" element={guard(<GroupDetail user={user} />)} />
          <Route path="/groups/:id/requests" element={guard(<Requests user={user} />)} />
          <Route path="/groups/:id/trip" element={guard(<CommonGroupPage user={user} />)} />
          <Route path="/users/:id" element={guard(<Profile />)} />
          <Route path="*" element={<p className="pad">Page not found.</p>} />
        </Routes>
      </main>
      <footer className="foot">Travel Together · Plan trips with people who share your plans</footer>
    </>
  );
}
