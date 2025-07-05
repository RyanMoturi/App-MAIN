import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-black text-white flex justify-between px-6 py-4">
      <Link to="/" className="text-xl font-bold">Fundi-Link</Link>
    </nav>
  );
};

export default Navbar;
