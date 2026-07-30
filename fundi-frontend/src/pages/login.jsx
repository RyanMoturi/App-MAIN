import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignIn from '../components/GoogleSignIn';
import { dashboardForRole, saveAuthSession } from '../utils/authSession';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'client'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

      if (response.ok) {
        saveAuthSession(data, formData.role);
        navigate(dashboardForRole(formData.role));

      } else {
        alert(data.error || `Login failed with status ${response.status}`);
      }

    } catch (err) {
      console.error('Login error:', err);
      alert('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">

        <h2 className="text-2xl font-bold text-center mb-6">
          Login to Fundi-Link
        </h2>

        <div className="flex justify-center gap-3 mb-5">

          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'client' })}
            className={`px-4 py-2 rounded-full border ${
              formData.role === 'client'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200'
            }`}
          >
            Client
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'fundi' })}
            className={`px-4 py-2 rounded-full border ${
              formData.role === 'fundi'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200'
            }`}
          >
            Fundi
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'admin' })}
            className={`px-4 py-2 rounded-full border ${
              formData.role === 'admin'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200'
            }`}
          >
            Admin
          </button>

        </div>

        {formData.role !== 'admin' && (
          <>
            <GoogleSignIn role={formData.role} />
            <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              or use email
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            className={`w-full text-white font-semibold py-3 rounded ${
              formData.role === 'client'
                ? 'bg-blue-600 hover:bg-blue-700'
                : formData.role === 'fundi'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Login as {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
