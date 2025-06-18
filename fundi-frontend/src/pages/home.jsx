import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div>
      <section className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Fundi</h1>
        <p className="text-lg mb-6">Connect with skilled artisans across Kenya with ease.</p>

        <div className="flex justify-center gap-4">
          <Link to="/signup" className="bg-blue-600 text-white px-6 py-2 rounded">Get Started</Link>
          <Link to="/login" className="border border-blue-600 px-6 py-2 rounded text-blue-600">Login</Link>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Why Fundi?</h2>
          <p className="max-w-xl mx-auto text-gray-700">
            Whether you need a plumber, electrician, carpenter or tailor, Fundi connects you to verified artisans in your area. Empowering local talent. Simplifying your life.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
