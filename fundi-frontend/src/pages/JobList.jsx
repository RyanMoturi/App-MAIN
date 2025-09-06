import React, { useEffect, useState } from 'react';

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
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Available Jobs</h1>
      {jobs.length === 0 ? (
        <div className="text-center text-gray-500">No jobs found for your skill.</div>
      ) : (
        <ul className="space-y-4">
          {jobs.map(job => (
            <li key={job.id} className="bg-white shadow rounded p-6 hover:bg-yellow-50 transition">
              {job.image_url && (
                <img src={job.image_url} alt="Job" className="w-full h-48 object-cover rounded mb-2" />
              )}
              <a href={`/jobs/${job.id}`} className="text-xl font-semibold text-black hover:text-yellow-600">{job.title}</a>
              <p className="text-gray-600">{job.location}</p>
              <p className="text-gray-700 mt-2">{job.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobList; 