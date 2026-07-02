import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillRequired: '',
    location: '',
    image: null,
  });

  const clientId = localStorage.getItem('clientId');
  const role = localStorage.getItem('role');
  const isOwner = role === 'client' && job && String(job.client_id) === String(clientId);
  const backLink = role === 'client' ? '/client-dashboard' : '/jobs';
  const backLabel = role === 'client' ? 'Back to My Jobs' : 'Back to Job List';

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) throw new Error('Job not found');
        const data = await res.json();
        setJob(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          skillRequired: data.skill_required || '',
          location: data.location || '',
          image: null,
        });
      } catch {
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('skillRequired', formData.skillRequired);
      data.append('location', formData.location);
      data.append('clientId', clientId);
      if (formData.image) data.append('image', formData.image);

      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        body: data,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Update failed');

      const updated = await fetch(`/api/jobs/${id}`);
      const updatedJob = await updated.json();
      setJob(updatedJob);
      setEditing(false);
    } catch {
      alert('Failed to update job.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) throw new Error('Delete failed');
      navigate('/client-dashboard');
    } catch {
      alert('Failed to delete job.');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading job...</div>;
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600 mb-4">{error || 'Job not found.'}</p>
        <Link to={backLink} className="text-blue-600 underline">Back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Link to={backLink} className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; {backLabel}
      </Link>

      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-bold">{editing ? 'Edit Job' : job.title}</h1>
        {isOwner && !editing && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="bg-white shadow rounded p-6 space-y-4">
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
            rows="4"
          />
          <input
            name="skillRequired"
            placeholder="Required Skill"
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
          <div>
            <label className="block text-sm text-gray-600 mb-1">Replace image (optional)</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white shadow rounded p-6">
          {job.image_url && (
            <img src={job.image_url} alt={job.title} className="w-full h-48 object-cover rounded mb-4" />
          )}
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{job.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-800">Skill Required:</span>
              <p className="text-gray-600">{job.skill_required}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Location:</span>
              <p className="text-gray-600">{job.location}</p>
            </div>
          </div>
          {job.status && (
            <p className="mt-4 text-sm text-gray-500">Status: {job.status}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetails;
