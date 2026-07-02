import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const syncAuth = () => {
      setLoggedIn(!!localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
    };
    // initial
    syncAuth();
    // react to changes
    window.addEventListener('authChanged', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('authChanged', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 px-6 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-6">
          Welcome to <span className="text-gray-900">Fundi-Link</span>
        </h1>

        <p className="text-lg mb-8 text-gray-600">
          Connect with skilled artisans across Kenya with ease. Empowering local talent. Simplifying your life.
        </p>

        {!loggedIn ? (
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
        ) : (
          <div className="flex justify-center gap-6 mb-12">
            {role === 'client' && (
              <Link
                to="/client-dashboard"
                className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                Go to Client Dashboard
              </Link>
            )}
            {role === 'fundi' && (
              <Link
                to="/fundi-dashboard"
                className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                Go to Fundi Dashboard
              </Link>
            )}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-6 mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Why Fundi-Link?</h2>
          <p className="text-gray-600">
            Whether you need a plumber, electrician, carpenter or tailor, Fundi connects you to verified artisans in your area. Empowering local talent. Simplifying your life.
          </p>
        </div>
      </div>

      <section className="max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-4 text-center">About Fundi-Link</h2>
        <p className="text-lg text-gray-700 mb-4 text-center">
          Fundi-Link is a platform that connects clients with skilled fundis (handymen and professionals) for a variety of jobs. Whether you need repairs, installations, or specialized services, Fundi-Link makes it easy to find trusted professionals and get the job done efficiently.
        </p>
        <ul className="list-disc pl-8 text-gray-600 bg-white shadow-md rounded-lg p-6">
          <li>Post jobs and get matched with qualified fundis</li>
          <li>Browse available jobs and apply as a fundi</li>
          <li>Secure, easy-to-use, and reliable</li>
        </ul>
      </section>

      <section className="max-w-xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center">Contact Us</h2>
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Your Name" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="Your Email" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">Message</label>
            <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="message" placeholder="Your Message" rows="4"></textarea>
          </div>
          <div className="flex items-center justify-between">
            <button className="bg-black hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
              Send
            </button>
          </div>
        </form>
        <div className="text-center text-gray-600">
          <p>Email: support@fundi-link.com</p>
          <p>Phone: +123 456 7890</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
