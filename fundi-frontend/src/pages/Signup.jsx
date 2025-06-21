import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ for redirection

const Signup = () => {
  const navigate = useNavigate(); // ✅ react-router hook
  const [role, setRole] = useState('client'); // default to client
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    skills: ''
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
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password_hash: formData.password,
          role: role,
          ...(role === 'fundi' && { skills: formData.skills })
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Signup successful!');

        // ✅ Redirect based on role
        if (role === 'fundi') {
          navigate('/fundi-dashboard');
        } else {
          navigate('/client-dashboard');
        }

      } else {
        alert(`Signup failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        {/* Role Toggle Buttons */}
        <div className="flex justify-center mb-4 space-x-4">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`px-4 py-2 rounded ${role === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setRole('fundi')}
            className={`px-4 py-2 rounded ${role === 'fundi' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Fundi
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-2 mb-3 rounded"
            required
          />

          {/* Fundi-only field */}
          {role === 'fundi' && (
            <input
              type="text"
              name="skills"
              placeholder="Your Skills (e.g., plumbing, electrical)"
              value={formData.skills}
              onChange={handleChange}
              className="w-full border p-2 mb-3 rounded"
            />
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Sign Up as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
