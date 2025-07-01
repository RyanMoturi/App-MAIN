import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Login successful!');
        navigate(data.role === 'fundi' ? '/fundi-dashboard' : '/client-dashboard');
      } else {
        alert(`Login failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login to Fundi</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
