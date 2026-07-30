import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatTimeAgo } from '../utils/timeAgo';
import StarRating from '../components/StarRating';

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
  const [savingPrice, setSavingPrice] = useState(false);
  const [paying, setPaying] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [review, setReview] = useState({
    rating: '5',
    comment: '',
  });
  const [report, setReport] = useState({
    reason: '',
    details: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillRequired: '',
    location: '',
    budgetType: 'fixed',
    budgetAmount: '',
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
      setAgreedPrice(data.agreed_price ? String(data.agreed_price) : '');
      setFormData({
        title: data.title || '',
        description: data.description || '',
        skillRequired: data.skill_required || '',
        location: data.location || '',
        budgetType: data.budget_type || 'negotiable',
        budgetAmount: data.budget_amount ? String(data.budget_amount) : '',
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

  useEffect(() => {
    if (job?.payment_status !== 'Pending') return undefined;

    const interval = window.setInterval(fetchJob, 5000);
    return () => window.clearInterval(interval);
  }, [job?.payment_status]);

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
      data.append('budgetType', formData.budgetType);
      data.append('budgetAmount', formData.budgetAmount);
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

  const handleSaveAgreedPrice = async (e) => {
    e.preventDefault();
    setSavingPrice(true);
    try {
      const res = await fetch(`/api/payments/jobs/${id}/agreed-price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ price: Number(agreedPrice) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save price.');
      alert(data.message);
      await fetchJob();
    } catch (err) {
      alert(err.message || 'Failed to save price.');
    } finally {
      setSavingPrice(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const res = await fetch(`/api/payments/jobs/${id}/stk-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ phone: paymentPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start M-PESA payment.');
      alert(data.message);
      await fetchJob();
    } catch (err) {
      alert(err.message || 'Could not start M-PESA payment.');
    } finally {
      setPaying(false);
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

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!acceptedApplication) {
      alert('No accepted fundi found for this job.');
      return;
    }

    if (!report.reason.trim()) {
      alert('Please enter a report reason.');
      return;
    }

    setSubmittingReport(true);

    try {
      const res = await fetch('/api/reports/fundi-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: Number(id),
          client_id: Number(clientId),
          fundi_id: acceptedApplication.fundi_id,
          reason: report.reason,
          details: report.details,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report.');
      }

      alert(data.message);
      setReport({ reason: '', details: '' });
    } catch (err) {
      alert(err.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
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
    <div className="app-shell">
    <div className="app-container max-w-3xl">
      <Link to={backLink} className="mb-5 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-green-300 hover:text-green-800">
        &larr; {backLabel}
      </Link>

      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-black sm:text-4xl">{editing ? 'Edit Job' : job.title}</h1>
        {isOwner && !editing && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="secondary-action px-4 py-2"
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
        <form onSubmit={handleSave} className="surface-card space-y-4 p-6">
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
            className="field-control"
            rows="4"
          />
          <input
            name="skillRequired"
            placeholder="Required Skill"
            onChange={handleChange}
            value={formData.skillRequired}
            required
            className="field-control"
          />
          <input
            name="location"
            placeholder="Location"
            onChange={handleChange}
            value={formData.location}
            required
            className="w-full border p-2 rounded"
          />
          <fieldset className="rounded border p-3">
            <legend className="px-1 text-sm font-semibold">Budget</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="budgetType"
                  value="fixed"
                  checked={formData.budgetType === 'fixed'}
                  onChange={handleChange}
                />
                Fixed
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
              <input
                type="number"
                name="budgetAmount"
                min="1"
                step="1"
                value={formData.budgetAmount}
                onChange={handleChange}
                placeholder="Budget in KES"
                required
                className="mt-3 w-full rounded border p-2"
              />
            )}
          </fieldset>
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
            <div>
              <span className="font-semibold text-gray-800">Budget:</span>
              <p className="text-gray-600">
                {job.budget_type === 'fixed' && job.budget_amount
                  ? `KES ${Number(job.budget_amount).toLocaleString()}`
                  : 'Negotiable'}
              </p>
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

          {isOwner && acceptedApplication && job.status !== 'Completed' && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="font-semibold text-gray-900">Price and payment</h3>
              <p className="mt-1 text-sm text-gray-600">
                Enter the final amount after you and the fundi agree.
              </p>

              <form
                onSubmit={handleSaveAgreedPrice}
                className="mt-3 flex flex-col gap-2 sm:flex-row"
              >
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Agreed price (KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    disabled={job.payment_status === 'Pending'}
                    required
                    className="w-full rounded border bg-white p-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPrice || job.payment_status === 'Pending'}
                  className="self-end rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
                >
                  {savingPrice ? 'Saving...' : 'Save agreed price'}
                </button>
              </form>

              <p className="mt-3 text-sm font-medium text-gray-700">
                Payment status: {job.payment_status || 'Not started'}
              </p>

              {job.completion_requested_at &&
                job.payment_status !== 'Paid' &&
                job.payment_status !== 'Pending' && (
                  <form onSubmit={handlePay} className="mt-4 border-t pt-4">
                    <p className="mb-3 text-sm font-semibold text-green-800">
                      The fundi has marked the work as finished. Pay KES{' '}
                      {Number(job.agreed_price).toLocaleString()} via M-PESA.
                    </p>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Safaricom phone number
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="tel"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        placeholder="0712345678"
                        required
                        className="flex-1 rounded border bg-white p-2"
                      />
                      <button
                        type="submit"
                        disabled={paying}
                        className="rounded bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {paying ? 'Sending prompt...' : 'Pay with M-PESA'}
                      </button>
                    </div>
                  </form>
                )}

              {job.payment_status === 'Pending' && (
                <p className="mt-4 rounded bg-amber-100 p-3 text-sm text-amber-900">
                  M-PESA prompt sent. Complete it on your phone; this page will
                  update automatically.
                </p>
              )}
            </div>
          )}

          {isOwner && job.status === 'Completed' && acceptedApplication && (
            <form
              onSubmit={handleSubmitReview}
              className="mt-5 border-t pt-4 space-y-3"
            >
              <h3 className="font-semibold">Rate this fundi</h3>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Tap a star to rate the completed work
                </p>
                <StarRating
                  value={Number(review.rating)}
                  onChange={(rating) =>
                    setReview({ ...review, rating: String(rating) })
                  }
                  size="lg"
                  showLabel
                />
              </div>

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

          {isOwner && acceptedApplication && (
            <form
              onSubmit={handleSubmitReport}
              className="mt-5 border-t pt-4 space-y-3"
            >
              <h3 className="font-semibold text-red-700">Report this fundi</h3>
              <p className="text-sm text-gray-600">
                Use this if the fundi broke something, behaved wrongly, or did not follow the agreement.
              </p>

              <input
                value={report.reason}
                onChange={(e) =>
                  setReport({ ...report, reason: e.target.value })
                }
                placeholder="Short reason"
                className="w-full border p-2 rounded"
              />

              <textarea
                value={report.details}
                onChange={(e) =>
                  setReport({ ...report, details: e.target.value })
                }
                placeholder="Explain what happened..."
                className="w-full border p-2 rounded"
                rows="3"
              />

              <button
                type="submit"
                disabled={submittingReport}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
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
    </div>
  );
};

export default JobDetails;
