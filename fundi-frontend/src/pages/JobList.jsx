import React from 'react';

const jobs = [
  { id: 1, title: 'Plumbing Repair', location: 'Nairobi', description: 'Fix leaking kitchen sink.' },
  { id: 2, title: 'Electrical Installation', location: 'Mombasa', description: 'Install new lighting fixtures.' },
  { id: 3, title: 'Painting', location: 'Kisumu', description: 'Paint 3-bedroom house.' },
];

const JobList = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-6 text-center">Available Jobs</h1>
    <ul className="space-y-4">
      {jobs.map(job => (
        <li key={job.id} className="bg-white shadow rounded p-6 hover:bg-yellow-50 transition">
          <a href={`/jobs/${job.id}`} className="text-xl font-semibold text-black hover:text-yellow-600">{job.title}</a>
          <p className="text-gray-600">{job.location}</p>
          <p className="text-gray-700 mt-2">{job.description}</p>
        </li>
      ))}
    </ul>
  </div>
);

export default JobList; 