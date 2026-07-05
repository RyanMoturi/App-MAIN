import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatTimeAgo } from '../utils/timeAgo';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [review, setReview] = useState({
    rating: '5',
    comment: '',
  });
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
  const isTaken = job?.status && job.status !== 'Open';
  const acceptedApplication = applications.find((app) => app.status === 'Accepted');

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

  const fetchApplications = async () => {
    const appRes = await fetch(`/api/applications/job/${id}`);
    const appData = await appRes.json();
    setApplications(Array.isArray(appData) ? appData : []);
  };

  useEffect(() => {
    fetchJob();
    fetchApplications();
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

  const handleAccept = async (applicationId) => {
    setAcceptingId(applicationId);

    try {
      const res = await fetch(`/api/applications/${applicationId}/accept`, {
        method: 'PUT',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to accept application.');
      }

      alert(data.message);
      await fetchJob();
      await fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to accept application.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCompleteJob = async () => {
    setCompleting(true);

    try {
      const res = await fetch(`/api/jobs/${id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete job.');
      }

      alert(data.message);
      await fetchJob();
      await fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to complete job.');
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!acceptedApplication) {
      alert('No accepted fundi found for this job.');
      return;
    }

    setSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: Number(id),
          client_id: Number(clientId),
          fundi_id: acceptedApplication.fundi_id,
          rating: Number(review.rating),
          comment: review.comment,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      alert(data.message);
      setReview({ rating: '5', comment: '' });
      await fetchJob();
      await fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
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
          <p className="text-sm text-gray-500 mb-4">{formatTimeAgo(job.created_at)}</p>
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
          <p
            className={`mt-4 text-sm font-semibold ${
              isTaken ? 'text-red-600' : 'text-green-600'
            }`}
          >
            Status: {job.status || 'Open'}
          </p>

          {acceptedApplication && (
            <p className="mt-2 text-sm text-gray-600">
              Accepted fundi: {acceptedApplication.name}
            </p>
          )}

          {isOwner && job.status === 'In Progress' && (
            <button
              onClick={handleCompleteJob}
              disabled={completing}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {completing ? 'Completing...' : 'Mark Job Completed'}
            </button>
          )}

          {isOwner && job.status === 'Completed' && acceptedApplication && (
            <form
              onSubmit={handleSubmitReview}
              className="mt-5 border-t pt-4 space-y-3"
            >
              <h3 className="font-semibold">Rate this fundi</h3>

              <select
                value={review.rating}
                onChange={(e) =>
                  setReview({ ...review, rating: e.target.value })
                }
                className="w-full border p-2 rounded"
              >
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>

              <textarea
                value={review.comment}
                onChange={(e) =>
                  setReview({ ...review, comment: e.target.value })
                }
                placeholder="Write a short review..."
                className="w-full border p-2 rounded"
                rows="3"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}
      <h2 className="text-2xl font-bold mt-8 mb-4">
    Applicants
</h2>

{applications.length === 0 ? (
    <p>No applications yet.</p>
) : (
    applications.map((app) => (
        <div
            key={app.id}
            className="bg-white shadow rounded p-4 mb-3"
        >
            <h3>{app.name}</h3>

            <p>{app.skill}</p>

            <p>{app.location}</p>

            <p>⭐ {app.rating}</p>

            <p className="text-sm text-gray-500">
                Applied {formatTimeAgo(app.applied_at).replace('Posted ', '')}
            </p>

            <p
                className={`text-sm font-semibold ${
                    app.status === 'Accepted'
                        ? 'text-green-600'
                        : app.status === 'Rejected'
                          ? 'text-red-600'
                          : 'text-blue-600'
                }`}
            >
                Status: {app.status}
            </p>

            <button
                disabled={isTaken || app.status !== 'Pending' || acceptingId === app.id}
                onClick={() => handleAccept(app.id)}
                className={`px-4 py-2 rounded ${
                    app.status === 'Accepted'
                        ? 'bg-green-600 text-white'
                        : isTaken || app.status !== 'Pending'
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-70`}
            >
                {app.status === 'Accepted'
                    ? 'Accepted'
                    : acceptingId === app.id
                      ? 'Accepting...'
                      : isTaken || app.status !== 'Pending'
                        ? 'Unavailable'
                        : 'Accept'}
            </button>
        </div>
    ))
)}
    </div>
  );
};

export default JobDetails;
