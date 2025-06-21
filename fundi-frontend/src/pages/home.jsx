import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-6">
          Welcome to <span className="text-gray-900">Fundi</span>
        </h1>

        <p className="text-lg mb-8 text-gray-600">
          Connect with skilled artisans across Kenya with ease. Empowering local talent. Simplifying your life.
        </p>

        <div className="flex justify-center gap-6 mb-12">
          <Link
            to="/Signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Login
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Why Fundi?</h2>
          <p className="text-gray-600">
            Whether you need a plumber, electrician, carpenter or tailor, Fundi connects you to verified artisans in your area. Empowering local talent. Simplifying your life.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
