import React, { useState } from 'react';

const PostJob = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillRequired: '',
    location: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [formVisible, setFormVisible] = useState(true);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      alert('Client not logged in.');
      return;
    }

    const jobData = {
      ...formData,
      clientId: parseInt(clientId),
    };

    const result = await onSubmit(jobData);

    if (result?.success) {
      setSuccessMessage('✅ Job posted successfully!');
      setFormVisible(false);
    } else {
      alert('❌ Failed to post job.');
    }

    setFormData({
      title: '',
      description: '',
      skillRequired: '',
      location: '',
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-lg mx-auto">
      {successMessage && (
        <div className="mb-4 text-green-700 bg-green-100 p-3 rounded">
          {successMessage}
          <div className="mt-2 text-sm">
            <button
              className="text-blue-600 underline"
              onClick={() => setFormVisible(true)}
            >
              Post another job
            </button>
            {' or '}
            <button
              className="text-blue-600 underline"
              onClick={() => window.location.href = '/client-dashboard'}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {formVisible && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            placeholder="Job Title"
            onChange={handleChange}
            value={formData.title}
            required
            className="w-full border p-2 rounded"
          />
          <textarea
            name="description"
            placeholder="Job Description"
            onChange={handleChange}
            value={formData.description}
            required
            className="w-full border p-2 rounded"
          />
          <input
            name="skillRequired"
            placeholder="Required Skill (e.g., Plumbing)"
            onChange={handleChange}
            value={formData.skillRequired}
            required
            className="w-full border p-2 rounded"
          />
          <input
            name="location"
            placeholder="Location"
            onChange={handleChange}
            value={formData.location}
            required
            className="w-full border p-2 rounded"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Post Job
          </button>
        </form>
      )}
    </div>
  );
};

export default PostJob;
