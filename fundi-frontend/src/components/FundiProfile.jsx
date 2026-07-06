import React, { useEffect, useState } from 'react';
import StarRating from './StarRating';

const FundiProfile = ({ fundiId, onClose, onMessage }) => {
  const [fundi, setFundi] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [fundiRes, reviewsRes, completedJobsRes] = await Promise.all([
          fetch(`/api/fundi/${fundiId}`),
          fetch(`/api/fundi/${fundiId}/reviews`),
          fetch(`/api/fundi/${fundiId}/completed-jobs`),
        ]);
        if (fundiRes.ok) setFundi(await fundiRes.json());
        if (reviewsRes.ok) setReviews(await reviewsRes.json());
        if (completedJobsRes.ok) setCompletedJobs(await completedJobsRes.json());
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [fundiId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Fundi Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading profile...</div>
        ) : !fundi ? (
          <div className="p-8 text-center text-red-600">Fundi not found.</div>
        ) : (
          <div className="p-6">
            <h3 className="text-2xl font-bold">{fundi.name}</h3>
            <p className="text-gray-600 mt-1">{fundi.skill} &middot; {fundi.location}</p>
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={Math.round(Number(fundi.rating) || 0)} readOnly size="sm" />
              <span className="text-sm text-gray-600">
                {Number(fundi.rating || 0).toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
            {fundi.bio && <p className="mt-4 text-gray-700">{fundi.bio}</p>}

            <button
              onClick={() => onMessage(fundi)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Send Message
            </button>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Portfolio</h4>
              {completedJobs.length === 0 ? (
                <p className="text-gray-500 text-sm">No completed jobs yet.</p>
              ) : (
                <ul className="space-y-3">
                  {completedJobs.map((job) => (
                    <li key={job.id} className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{job.title}</span>
                        <StarRating value={Number(job.rating) || 0} readOnly size="sm" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Completed{" "}
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleDateString()
                          : "date not recorded"}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {job.comment || "No review left yet."}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Reviews</h4>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviews yet.</p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((review) => (
                    <li key={review.id} className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{review.client_name}</span>
                        <StarRating value={review.rating} readOnly size="sm" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{review.job_title}</p>
                      {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundiProfile;
