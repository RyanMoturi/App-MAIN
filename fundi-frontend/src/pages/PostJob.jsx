import React, { useState } from 'react';

const PostJob = ({ onSubmit }) => {
  const skills = [
  "Plumbing",
  "Electrical",
  "Carpentry",
];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillRequired: '',
    location: '',
    image: null
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [formVisible, setFormVisible] = useState(true);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      alert('Client not logged in.');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('skillRequired', formData.skillRequired);
    data.append('location', formData.location);
    data.append('clientId', clientId);
    if (formData.image) data.append('image', formData.image);

    const response = await fetch('/api/jobs', {
      method: 'POST',
      body: data,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      setSuccessMessage('✅ Job posted successfully!');
      setFormVisible(false);
      setFormData({
        title: '',
        description: '',
        skillRequired: '',
        location: '',
        image: null
      });
    } else {
      alert('❌ Failed to post job.');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-lg mx-auto">
      {successMessage && (
        <div className="mb-4 text-green-700 bg-green-100 p-3 rounded">
          {successMessage}
          <div className="mt-2 text-sm">
            <button
              className="text-blue-600 underline"
              onClick={() => { setFormVisible(true); setSuccessMessage(''); }}
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
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
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
            <select
            name="skillRequired"
            value={formData.skillRequired}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Required Skill</option>

            {skills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
</select>
          <input
            name="location"
            placeholder="Location"
            onChange={handleChange}
            value={formData.location}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
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
