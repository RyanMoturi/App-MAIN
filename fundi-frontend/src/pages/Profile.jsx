import React from 'react';

const Profile = () => (
  <div className="max-w-xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-4 text-center">My Profile</h1>
    <div className="bg-white shadow rounded p-6">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" value="John Doe" readOnly />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="email" value="john@example.com" readOnly />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" value="Client" readOnly />
      </div>
      <button className="bg-black hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled>Edit Profile</button>
    </div>
  </div>
);

export default Profile; 