import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('client');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    skills: '',
    bio: '',
    location: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint =
      role === 'fundi'
        ? 'http://localhost:5001/api/auth/signup/fundi'
        : 'http://localhost:5001/api/auth/signup/client';

    const payload =
      role === 'fundi'
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            skill: formData.skills,
            bio: formData.bio,
            location: formData.location
          }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            location: formData.location,
            phone_number: formData.phone_number
          };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Signup successful!');
        navigate('/login');
      } else {
        alert(`Signup failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>

        <div className="flex justify-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`px-4 py-2 rounded-full border ${role === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setRole('fundi')}
            className={`px-4 py-2 rounded-full border ${role === 'fundi' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Fundi
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />

          {role === 'client' && (
            <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          )}

          {role === 'fundi' && (
  <>
    <select
      name="skills"
      value={formData.skills}
      onChange={handleChange}
      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      required
    >
      <option value="">Select Your Skill</option>
      <option value="Plumbing">Plumbing</option>
      <option value="Electrical">Electrical</option>
      <option value="Carpentry">Carpentry</option>
    </select>

    <textarea
      name="bio"
      placeholder="Brief Bio"
      value={formData.bio}
      onChange={handleChange}
      className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      rows="4"
      required
    />
  </>
)}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded"
          >
            Sign Up as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
