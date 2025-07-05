import React, { useState } from 'react';

const PostJob = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillRequired: '',
    location: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ title: '', description: '', skillRequired: '', location: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <input name="title" placeholder="Job Title" onChange={handleChange} value={formData.title} required className="w-full border p-2 rounded" />
      <textarea name="description" placeholder="Job Description" onChange={handleChange} value={formData.description} required className="w-full border p-2 rounded" />
      <input name="skillRequired" placeholder="Required Skill (e.g., Plumbing)" onChange={handleChange} value={formData.skillRequired} required className="w-full border p-2 rounded" />
      <input name="location" placeholder="Location" onChange={handleChange} value={formData.location} required className="w-full border p-2 rounded" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Post Job</button>
    </form>
  );
};

export default PostJob;
