import React from 'react';

const Profile = () => (
  <div className="app-shell">
  <div className="app-container max-w-2xl">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Account</p>
    <h1 className="mb-7 mt-1 text-4xl font-black">My profile</h1>
    <div className="surface-card p-6 sm:p-8">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
        <input className="field-control" type="text" value="John Doe" readOnly />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
        <input className="field-control" type="email" value="john@example.com" readOnly />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
        <input className="field-control" type="text" value="Client" readOnly />
      </div>
      <button className="primary-action" disabled>Edit Profile</button>
    </div>
  </div>
  </div>
);

export default Profile;
