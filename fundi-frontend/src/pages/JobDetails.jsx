import React from 'react';
import { useParams } from 'react-router-dom';

const JobDetails = () => {
  const { id } = useParams();
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Job Details</h1>
      <p className="text-lg text-gray-700 mb-2">Job ID: <span className="font-mono">{id}</span></p>
      <div className="bg-white shadow rounded p-6 mt-4">
        <p className="text-gray-600">Detailed information about the job will appear here.</p>
      </div>
    </div>
  );
};

export default JobDetails; 