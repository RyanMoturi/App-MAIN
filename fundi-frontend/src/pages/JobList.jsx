import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../utils/timeAgo';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        // Get fundi skill from localStorage
        const fundiSkill = localStorage.getItem('skill');
        // Only show jobs matching fundi's skill
        const filtered = fundiSkill ? data.filter(job => job.skill_required && job.skill_required.toLowerCase() === fundiSkill.toLowerCase()) : data;
        setJobs(filtered);
      } catch (err) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return <div className="text-center py-12">Loading jobs...</div>;
  if (error) return <div className="text-center text-red-600 py-12">{error}</div>;

  return (
    <div className="app-shell">
    <div className="app-container max-w-5xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Local opportunities</p>
      <h1 className="mt-1 text-4xl font-black">Available jobs</h1>
      <p className="mb-8 mt-2 text-gray-600">Work matched to your skills, with the details you need up front.</p>
      {jobs.length === 0 ? (
          <div className="surface-card p-12 text-center text-gray-500">No jobs found for your skill.</div>
      ) : (
        <ul className="space-y-4">
          {jobs.map(job => (
            <li key={job.id} className="surface-card overflow-hidden p-6 transition hover:-translate-y-1 hover:border-green-300 hover:shadow-xl">
              {job.image_url && (
                <img src={job.image_url} alt="Job" className="w-full h-48 object-cover rounded mb-2" />
              )}
              <div className="flex items-start justify-between gap-4">
              <Link to={`/jobs/${job.id}`} className="text-xl font-black text-gray-950 hover:text-green-700">{job.title}</Link>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">{job.skill_required || 'General'}</span>
              </div>
              <p className="mt-2 text-gray-600">⌖ {job.location}</p>
              <p className="text-sm text-gray-500 mt-1">{formatTimeAgo(job.created_at)}</p>
              <p className="text-gray-700 mt-2">{job.description}</p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  job.status && job.status !== 'Open' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                Status: {job.status || 'Open'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
    </div>
  );
};

export default JobList; 
