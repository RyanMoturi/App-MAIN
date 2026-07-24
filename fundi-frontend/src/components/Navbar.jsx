import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CloseIcon, MenuIcon, ShieldIcon, ToolIcon, UserIcon } from './Icons';

const Navbar = () => {
  const [role, setRole] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
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

  const closeMenu = () => setOpen(false);

  const navLinkClass =
    'flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black transition';

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-3 text-xl font-bold text-gray-950"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded bg-black text-white">
            <ToolIcon className="h-5 w-5" />
          </span>
          Fundi-Link
        </Link>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center rounded border border-gray-300 p-2 text-gray-800 hover:bg-gray-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/" className={navLinkClass}>
            <ToolIcon className="h-4 w-4" />
            Home
          </Link>
          {role === 'client' && loggedIn && (
            <Link to="/client-dashboard" className={navLinkClass}>
              <UserIcon className="h-4 w-4" />
              Client Dashboard
            </Link>
          )}
          {role === 'fundi' && loggedIn && (
            <Link to="/fundi-dashboard" className={navLinkClass}>
              <ShieldIcon className="h-4 w-4" />
              Fundi Dashboard
            </Link>
          )}
          {!loggedIn && <Link to="/login" className={navLinkClass}>Login</Link>}
          {!loggedIn && (
            <Link
              to="/signup"
              className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              Sign up
            </Link>
          )}
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link to="/" onClick={closeMenu} className={navLinkClass}>
              <ToolIcon className="h-4 w-4" />
              Home
            </Link>
            {role === 'client' && loggedIn && (
              <Link to="/client-dashboard" onClick={closeMenu} className={navLinkClass}>
                <UserIcon className="h-4 w-4" />
                Client Dashboard
              </Link>
            )}
            {role === 'fundi' && loggedIn && (
              <Link to="/fundi-dashboard" onClick={closeMenu} className={navLinkClass}>
                <ShieldIcon className="h-4 w-4" />
                Fundi Dashboard
              </Link>
            )}
            {!loggedIn && <Link to="/login" onClick={closeMenu} className={navLinkClass}>Login</Link>}
            {!loggedIn && <Link to="/signup" onClick={closeMenu} className={navLinkClass}>Sign up</Link>}
            {loggedIn && (
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="flex items-center rounded px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
