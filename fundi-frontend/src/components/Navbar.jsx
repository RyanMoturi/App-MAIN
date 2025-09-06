import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [role, setRole] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    setRole(storedRole);
    setLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <nav className="bg-black text-white flex flex-wrap items-center justify-between px-6 py-4">
      <Link to="/" className="text-xl font-bold mr-8">Fundi-Link</Link>
      <div className="flex flex-wrap gap-4 items-center">
        <Link to="/" className="hover:text-yellow-400 transition">Home</Link>
        <Link to="/about" className="hover:text-yellow-400 transition">About</Link>
        <Link to="/contact" className="hover:text-yellow-400 transition">Contact</Link>
        {/* Only fundis see Job List */}
        {role === 'fundi' && <Link to="/jobs" className="hover:text-yellow-400 transition">Job List</Link>}
        {/* Profile link for any logged-in user */}
        {loggedIn && <Link to="/profile" className="hover:text-yellow-400 transition">Profile</Link>}
        {/* Only show the dashboard for the correct role */}
        {role === 'client' && <Link to="/client-dashboard" className="hover:text-yellow-400 transition">Client Dashboard</Link>}
        {role === 'fundi' && <Link to="/fundi-dashboard" className="hover:text-yellow-400 transition">Fundi Dashboard</Link>}
        {/* Auth links */}
        {!loggedIn && <Link to="/login" className="hover:text-yellow-400 transition">Login</Link>}
        {!loggedIn && <Link to="/signup" className="hover:text-yellow-400 transition">Signup</Link>}
        {loggedIn && <button onClick={handleLogout} className="hover:text-yellow-400 transition bg-transparent border-none cursor-pointer">Logout</button>}
      </div>
    </nav>
  );
};

export default Navbar;
