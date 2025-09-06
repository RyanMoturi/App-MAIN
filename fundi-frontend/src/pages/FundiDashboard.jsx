import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TABS = ['Find Jobs', 'My Applications', 'Active Jobs', 'Messages', 'Notifications', 'Profile', 'Portfolio'];

const mockApplications = [
  { id: 1, job: 'Fix Sink', status: 'pending', message: 'I can help!' },
  { id: 2, job: 'Paint Living Room', status: 'accepted', message: 'Experienced painter.' }
];
const mockActiveJobs = [
  { id: 2, title: 'Paint Living Room', client: 'Alice', status: 'In Progress' }
];
const mockMessages = [
  { id: 1, from: 'Alice', content: 'Can you start tomorrow?', job: 'Paint Living Room' }
];
const mockNotifications = [
  { id: 1, content: 'Your application for Fix Sink was accepted!' }
];
const mockPortfolio = [
  { id: 1, title: 'Bathroom Plumbing', image: '', description: 'Fixed leaking pipes.' },
  { id: 2, title: 'House Painting', image: '', description: 'Painted 3-bedroom house.' }
];

const FundiDashboard = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [applications] = useState(mockApplications);
  const [activeJobs] = useState(mockActiveJobs);
  const [messages] = useState(mockMessages);
  const [notifications] = useState(mockNotifications);
  const [portfolio] = useState(mockPortfolio);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'fundi') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch jobs for 'Find Jobs' tab
  useEffect(() => {
    if (activeTab !== 'Find Jobs') return;
    const fetchJobs = async () => {
      setLoadingJobs(true);
      setJobsError(null);
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        const fundiSkill = localStorage.getItem('skill');
        const filtered = fundiSkill ? data.filter(job => job.skill_required && job.skill_required.toLowerCase() === fundiSkill.toLowerCase()) : data;
        setJobs(filtered);
      } catch (err) {
        setJobsError('Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, [activeTab]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Fundi Dashboard</h1>
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
      {activeTab === 'Find Jobs' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Find Jobs</h2>
          {loadingJobs ? (
            <div className="text-center py-12">Loading jobs...</div>
          ) : jobsError ? (
            <div className="text-center text-red-600 py-12">{jobsError}</div>
          ) : jobs.length === 0 ? (
            <div className="text-center text-gray-500">No jobs found for your skill.</div>
          ) : (
            <ul className="space-y-4">
              {jobs.map(job => (
                <li key={job.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex-1">
                    {job.image_url && (
                      <img src={job.image_url} alt="Job" className="w-full md:w-48 h-32 object-cover rounded mb-2" />
                    )}
                    <span className="font-bold">{job.title}</span> - {job.skill_required} <span className="ml-2 text-gray-500">({job.location})</span>
                    <div className="text-sm text-gray-500">{job.description}</div>
                  </div>
                  <button className="bg-green-600 text-white px-2 py-1 rounded mt-2 md:mt-0 md:ml-4">Apply</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {activeTab === 'My Applications' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Applications</h2>
          <ul className="space-y-4">
            {applications.map(app => (
              <li key={app.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                <div>
                  <span className="font-bold">{app.job}</span> - <span className="text-sm text-gray-500">{app.status}</span>
                  <div className="text-sm text-gray-500">{app.message}</div>
                </div>
                {app.status === 'pending' && <button className="bg-red-600 text-white px-2 py-1 rounded">Withdraw</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === 'Active Jobs' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Jobs</h2>
          <ul className="space-y-4">
            {activeJobs.map(job => (
              <li key={job.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                <div>
                  <span className="font-bold">{job.title}</span> for <span className="text-blue-600">{job.client}</span>
                  <div className="text-sm text-gray-500">Status: {job.status}</div>
                </div>
                <button className="bg-blue-600 text-white px-2 py-1 rounded">Mark Complete</button>
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
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" value="Jane Mwangi" readOnly />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="email" value="jane@example.com" readOnly />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Skill</label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" value="Plumbing" readOnly />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Location</label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" value="Nairobi" readOnly />
            </div>
            <button className="bg-black hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled>Edit Profile</button>
          </div>
        </div>
      )}
      {activeTab === 'Portfolio' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
          <ul className="space-y-4">
            {portfolio.map(item => (
              <li key={item.id} className="bg-white rounded shadow p-4">
                <div className="font-bold">{item.title}</div>
                <div className="text-gray-700">{item.description}</div>
                {/* Placeholder for image */}
                <div className="mt-2 bg-gray-200 h-32 w-full rounded flex items-center justify-center text-gray-400">Image</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FundiDashboard;
