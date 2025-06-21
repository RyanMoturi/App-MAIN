import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ for redirecting

const Login = () => {
  const navigate = useNavigate(); // ✅ Hook to redirect
  const [role, setRole] = useState('client'); // client or fundi
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Welcome back, ${data.name}!`);

        // Optional: save token/user info
        // localStorage.setItem('user', JSON.stringify(data));

        // ✅ Redirect to appropriate dashboard
        if (data.role === 'fundi') {
          navigate('/fundi-dashboard');
        } else {
          navigate('/client-dashboard');
        }

      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('❌ Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {/* Role Toggle */}
        <div className="flex justify-center mb-4 space-x-4">
          <button
            onClick={() => setRole('client')}
            className={`px-4 py-2 rounded ${role === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Client
          </button>
          <button
            onClick={() => setRole('fundi')}
            className={`px-4 py-2 rounded ${role === 'fundi' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Fundi
          </button>
        </div>

        {message && <div className="mb-4 text-sm text-center text-red-600">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 mb-3 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 mb-3 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Login as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
