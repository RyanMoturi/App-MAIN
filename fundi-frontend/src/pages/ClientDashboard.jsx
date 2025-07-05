import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PostJob from './PostJob';

const ClientDashboard = () => {
  const [showPostForm, setShowPostForm] = useState(false);
  const [message, setMessage] = useState('');
  
  // TODO: Replace this with dynamic user ID from auth
  const clientId = 1;

  const handlePostJob = async (jobData) => {
    try {
      const response = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...jobData, client_id: clientId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Job posted successfully!');
        setShowPostForm(false); // Hide form after success
      } else {
        setMessage('❌ Failed to post job: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Post Job Error:', error);
      setMessage('❌ Server error while posting job.');
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome, Client!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Service Card */}
        <div className="bg-white shadow-md rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-2">Need a Fundi?</h2>
          <p className="mb-4">Quickly request a service for your home or office needs.</p>
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showPostForm ? 'Cancel' : 'Request Service'}
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

      {/* Post Job Form Section */}
      {showPostForm && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Post a New Job</h2>
          <PostJob onSubmit={handlePostJob} />
        </div>
      )}

      {/* Feedback Message */}
      {message && <p className="mt-4 text-center text-sm font-medium text-blue-700">{message}</p>}
    </div>
  );
};

export default ClientDashboard;
