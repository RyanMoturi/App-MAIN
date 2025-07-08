import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
    <h1 className="text-6xl font-bold text-yellow-500 mb-4">404</h1>
    <p className="text-2xl text-gray-700 mb-6">Page Not Found</p>
    <Link to="/" className="bg-black text-white px-6 py-2 rounded hover:bg-yellow-500 transition">Go Home</Link>
  </div>
);

export default NotFound; 