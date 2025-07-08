import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'client'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData) // ✅ this fixes the issue
      });

      const data = await response.json();

      if (response.ok) {
        if (formData.role === 'client' && data.clientId) {
          localStorage.setItem('clientId', data.clientId);
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', formData.role); // Store role for later use
        alert('Login successful!');
        if (formData.role ==='client'){
          navigate('/client-dashboard');
        }else{
          navigate('/fundi-dashboard');
        }
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login to Fundi</h2>

        <div className="flex justify-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'client' })}
            className={`px-4 py-2 rounded-full border ${formData.role === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'fundi' })}
            className={`px-4 py-2 rounded-full border ${formData.role === 'fundi' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Fundi
          </button>
        </div>

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
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded"
          >
            Login as {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
