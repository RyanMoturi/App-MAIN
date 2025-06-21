import React from 'react';
import { Link } from 'react-router-dom';


const FundiDashboard = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome, Fundi!</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Job Requests */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-2">New Job Requests</h2>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>

        {/* Accepted Jobs */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-2">Ongoing Jobs</h2>
          <p className="text-2xl font-bold text-green-600">2</p>
        </div>

        {/* Reviews */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-2">Your Reviews</h2>
          <p className="text-sm text-gray-600">⭐ 4.8 average (12 reviews)</p>
        </div>

        {/* Manage Profile */}
        <div className="bg-white shadow-md rounded-2xl p-5 col-span-1 md:col-span-3">
          <h2 className="text-lg font-semibold mb-2">Update Your Profile</h2>
          <p className="text-sm mb-3 text-gray-600">Make sure your profile is up-to-date to get more clients.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundiDashboard;
