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
    budgetType: 'fixed',
    budgetAmount: '',
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
    data.append('budgetType', formData.budgetType);
    data.append('budgetAmount', formData.budgetAmount);
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
      onSubmit?.();
      setFormData({
        title: '',
        description: '',
        skillRequired: '',
        location: '',
        budgetType: 'fixed',
        budgetAmount: '',
        image: null
      });
    } else {
      alert('❌ Failed to post job.');
    }
  };

  return (
    <div className="surface-card mx-auto max-w-2xl p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">New opportunity</p>
      <h2 className="mb-2 mt-1 text-3xl font-black">Post a job</h2>
      <p className="mb-7 text-gray-600">Describe the work clearly so nearby fundis can respond with confidence.</p>
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
            className="field-control"
          />
          <textarea
            name="description"
            placeholder="Job Description"
            onChange={handleChange}
            value={formData.description}
            required
            rows="5"
            className="field-control"
          />
            <select
            name="skillRequired"
            value={formData.skillRequired}
            onChange={handleChange}
            required
            className="field-control"
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
            className="field-control"
          />
          <fieldset className="rounded-2xl border border-gray-200 bg-stone-50 p-4">
            <legend className="px-1 text-sm font-semibold text-gray-700">
              Job budget
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="budgetType"
                  value="fixed"
                  checked={formData.budgetType === 'fixed'}
                  onChange={handleChange}
                />
                Set a budget
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="budgetType"
                  value="negotiable"
                  checked={formData.budgetType === 'negotiable'}
                  onChange={handleChange}
                />
                Negotiable
              </label>
            </div>
            {formData.budgetType === 'fixed' && (
              <div className="mt-3">
                <label className="mb-1 block text-sm text-gray-600">
                  Budget amount (KES)
                </label>
                <input
                  type="number"
                  name="budgetAmount"
                  min="1"
                  step="1"
                  value={formData.budgetAmount}
                  onChange={handleChange}
                  placeholder="e.g. 5000"
                  required
                  className="field-control"
                />
              </div>
            )}
          </fieldset>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="w-full rounded-xl border border-dashed border-gray-300 bg-stone-50 p-4 text-sm"
          />
          <button type="submit" className="primary-action w-full">
            Post Job
          </button>
        </form>
      )}
    </div>
  );
};

export default PostJob;
