import React from 'react';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded p-6 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form>
          <input type="email" placeholder="Email" className="w-full border p-2 mb-3 rounded" />
          <input type="password" placeholder="Password" className="w-full border p-2 mb-3 rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
