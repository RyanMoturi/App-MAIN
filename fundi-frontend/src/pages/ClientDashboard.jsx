import React from 'react';
import { Link } from 'react-router-dom';


const ClientDashboard = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome, Client!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Service Card */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-2">Need a Fundi?</h2>
          <p className="mb-4">Quickly request a service for your home or office needs.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Request Service
          </button>
        </div>

        {/* Current Job Status */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-2">Ongoing Jobs</h2>
          <p className="text-gray-600">You have 1 active request with John the Electrician.</p>
        </div>

        {/* Recommended Fundis */}
        <div className="bg-white shadow-md rounded-2xl p-5 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Recommended Fundis</h2>
          <div className="flex space-x-4 overflow-x-auto">
            {[1, 2, 3].map((fundi) => (
              <div key={fundi} className="bg-gray-200 p-4 rounded-lg w-64">
                <h3 className="font-bold">Fundi Name</h3>
                <p className="text-sm text-gray-700">Skill: Plumbing</p>
                <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
