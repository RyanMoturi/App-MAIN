import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [role, setRole] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    setRole(storedRole);
    setLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      const storedRole = localStorage.getItem('role');
      const token = localStorage.getItem('token');
      setRole(storedRole);
      setLoggedIn(!!token);
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener('authChanged', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('authChanged', syncAuthState);
    };
  }, []);

  useEffect(() => {
    // Update state on route changes as well (covers SPA navigations)
    const storedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    setRole(storedRole);
    setLoggedIn(!!token);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setLoggedIn(false);
    window.dispatchEvent(new Event('authChanged'));
    navigate('/login');
  };

  return (
    <nav className="bg-black text-white flex flex-wrap items-center justify-between px-6 py-4">
      <Link to="/" className="text-xl font-bold mr-8">Fundi-Link</Link>
      <div className="flex flex-wrap gap-4 items-center">
        <Link to="/" className="hover:text-yellow-400 transition">Home</Link>
        {/* Show the correct dashboard link for the logged-in role; keep visible for clients when logged in */}
        {role === 'client' && loggedIn && (
          <Link to="/client-dashboard" className="hover:text-yellow-400 transition">Client Dashboard</Link>
        )}
        {role === 'fundi' && loggedIn && (
          <Link to="/fundi-dashboard" className="hover:text-yellow-400 transition">Fundi Dashboard</Link>
        )}
        {role !== 'fundi' && loggedIn && (
          <Link to="/profile" className="hover:text-yellow-400 transition">Profile</Link>
        )}
        {/* Auth links hidden when logged in */}
        {!loggedIn && <Link to="/login" className="hover:text-yellow-400 transition">Login</Link>}
        {!loggedIn && <Link to="/signup" className="hover:text-yellow-400 transition">Signup</Link>}
        {loggedIn && <button onClick={handleLogout} className="hover:text-yellow-400 transition bg-transparent border-none cursor-pointer">Logout</button>}
      </div>
    </nav>
  );
};

export default Navbar;
