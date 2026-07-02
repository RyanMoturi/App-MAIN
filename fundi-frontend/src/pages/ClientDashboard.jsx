import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PostJob from './PostJob';

const TABS = ['My Jobs', 'Find Fundis', 'Messages', 'Notifications', 'Profile'];

const mockFundis = [
  { id: 1, name: 'Jane Mwangi', skill: 'Plumbing', rating: 4.9, location: 'Nairobi' },
  { id: 2, name: 'Mary Wanjiku', skill: 'Painting', rating: 4.7, location: 'Kisumu' }
];
const mockMessages = [
  { id: 1, from: 'Jane Mwangi', content: 'I can start tomorrow!', job: 'Fix Sink' },
  { id: 2, from: 'Mary Wanjiku', content: 'Do you have a color preference?', job: 'Paint Living Room' }
];
const mockNotifications = [
  { id: 1, content: 'Jane Mwangi applied for your job: Fix Sink' },
  { id: 2, content: 'Mary Wanjiku was accepted for your job: Paint Living Room' }
];

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [fundis] = useState(mockFundis);
  const [messages] = useState(mockMessages);
  const [notifications] = useState(mockNotifications);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'client') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch jobs posted by this client
  const fetchJobs = async () => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const clientId = localStorage.getItem('clientId');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/client/${clientId}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setJobsError('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'My Jobs') fetchJobs();
  }, [activeTab]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Client Dashboard</h1>
      <div className="flex gap-4 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-black text-white' : 'bg-white text-black border'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {activeTab === 'My Jobs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Jobs</h2>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setShowPostJob(v => !v)}
            >
              {showPostJob ? 'Cancel' : 'Post a Job'}
            </button>
          </div>
          {showPostJob && <PostJob onSubmit={fetchJobs} />}
          {loadingJobs ? (
            <div className="text-center py-12">Loading jobs...</div>
          ) : jobsError ? (
            <div className="text-center text-red-600 py-12">{jobsError}</div>
          ) : jobs.length === 0 ? (
            <div className="text-center text-gray-500">No jobs posted yet.</div>
          ) : (
            <ul className="space-y-4">
              {jobs.map(job => (
                <li key={job.id}>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="block bg-white rounded shadow p-4 hover:ring-2 hover:ring-blue-400 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold">{job.title}</span>
                        {job.status && (
                          <span className="ml-2 text-sm text-gray-500">[{job.status}]</span>
                        )}
                      </div>
                      <span className="text-sm text-blue-600">View / Edit &rarr;</span>
                    </div>
                    {job.image_url && (
                      <img src={job.image_url} alt="Job" className="w-full h-48 object-cover rounded mb-2 mt-2" />
                    )}
                    {job.description && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{job.description}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {activeTab === 'Find Fundis' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Find Fundis</h2>
          <ul className="space-y-4">
            {fundis.map(fundi => (
              <li key={fundi.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                <div>
                  <span className="font-bold">{fundi.name}</span> - {fundi.skill} <span className="ml-2 text-yellow-500">⭐ {fundi.rating}</span>
                  <div className="text-sm text-gray-500">{fundi.location}</div>
                </div>
                <button className="bg-blue-600 text-white px-2 py-1 rounded">View Profile</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === 'Messages' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          <ul className="space-y-4">
            {messages.map(msg => (
              <li key={msg.id} className="bg-white rounded shadow p-4">
                <div className="font-bold">From: {msg.from}</div>
                <div className="text-gray-700">{msg.content}</div>
                <div className="text-sm text-gray-500">Regarding: {msg.job}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === 'Notifications' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <ul className="space-y-2">
            {notifications.map(note => (
              <li key={note.id} className="bg-white rounded shadow p-3">{note.content}</li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === 'Profile' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Profile</h2>
          <div className="bg-white rounded shadow p-6">
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
      )}
    </div>
  );
};

export default ClientDashboard;
