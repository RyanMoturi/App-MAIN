import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatTimeAgo } from "../utils/timeAgo";
import MessagesPanel from "../components/MessagesPanel";


const TABS = [
  "Find Jobs",
  "My Applications",
  "Active Jobs",
  "Completed Jobs",
  "Messages",
  "Notifications",
  "Profile",
  "Portfolio",
];

const FundiDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TABS[0]);

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState(null);

  const [applications, setApplications] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: "",
    skill: "",
    bio: "",
    national_id: "",
    phone_number: "",
    rating: 5,
    profile_photo: "",
  });

  const [newPhoto, setNewPhoto] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "fundi") {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "Find Jobs") {
      fetchJobs();
    }

    if (activeTab === "My Applications") {
      fetchApplications();
    }

    if (activeTab === "Active Jobs") {
      fetchApplications();
    }

    if (activeTab === "Completed Jobs") {
      fetchCompletedJobs();
    }

    if (activeTab === "Notifications") {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const fundiId = localStorage.getItem("fundiId");

      const res = await fetch(`/api/fundi/${fundiId}`);

      const data = await res.json();

      setProfile(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    setJobsError(null);

    try {
      const res = await fetch("/api/jobs");

      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await res.json();

      const fundiSkill = profile.skill || localStorage.getItem("skill");

      const filteredJobs = fundiSkill
        ? data.filter(
            (job) =>
              job.skill_required &&
              job.skill_required.toLowerCase() ===
                fundiSkill.toLowerCase()
          )
        : data;

      setJobs(filteredJobs);
    } catch (err) {
      console.log(err);
      setJobsError("Failed to load jobs.");
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const fundiId = localStorage.getItem("fundiId");

      const res = await fetch(
        `/api/applications/fundi/${fundiId}`
      );

      const data = await res.json();

      const applicationList = Array.isArray(data) ? data : [];

      setApplications(applicationList);
      setActiveJobs(
        applicationList.filter(
          (application) =>
            application.status === "Accepted" &&
            application.job_status !== "Completed"
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCompletedJobs = async () => {
    try {
      const fundiId = localStorage.getItem("fundiId");
      const res = await fetch(`/api/fundi/${fundiId}/completed-jobs`);

      if (res.ok) {
        setCompletedJobs(await res.json());
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchNotifications = async () => {
    const fundiId = localStorage.getItem("fundiId");
    if (!fundiId) return;

    setLoadingNotifications(true);

    try {
      const res = await fetch(
        `/api/notifications?userId=${fundiId}&userRole=fundi`
      );

      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationRead = async (notificationId) => {
    const fundiId = localStorage.getItem("fundiId");

    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId,
        userId: fundiId,
        userRole: "fundi",
      }),
    });

    fetchNotifications();
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);

      const fundiId = localStorage.getItem("fundiId");

      const formData = new FormData();

      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("location", profile.location);
      formData.append("skill", profile.skill);
      formData.append("bio", profile.bio);
      formData.append("phone_number", profile.phone_number || "");

      if (newPhoto) {
        formData.append("profile_photo", newPhoto);
      }

      const res = await fetch(`/api/fundi/${fundiId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      alert(data.message);

      fetchProfile();
      setEditingProfile(false);
      setNewPhoto(null);

      setSavingProfile(false);

    } catch (err) {
      console.log(err);
      setSavingProfile(false);
    }
  };
  return (
  <div className="p-6 bg-gray-100 min-h-screen">
    <h1 className="text-3xl font-bold mb-4">Fundi Dashboard</h1>

    <div className="flex gap-4 mb-6 flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded ${
            activeTab === tab
              ? "bg-black text-white"
              : "bg-white border"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* ================= FIND JOBS ================= */}

    {activeTab === "Find Jobs" && (
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Find Jobs
        </h2>

        {loadingJobs ? (
          <div className="text-center py-12">
            Loading jobs...
          </div>
        ) : jobsError ? (
          <div className="text-center text-red-600 py-12">
            {jobsError}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-500">
            No jobs found for your skill.
          </div>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => {
              const isTaken = job.status && job.status !== "Open";

              return (
              <li
                key={job.id}
                className="bg-white rounded shadow p-4 flex flex-col md:flex-row justify-between gap-4"
              >
                <div className="flex-1">

                  {job.image_url && (
                    <img
                      src={job.image_url}
                      alt={job.title}
                      className="w-full md:w-64 h-40 object-cover rounded mb-3"
                    />
                  )}

                  <h3 className="font-bold text-lg">
                    {job.title}
                  </h3>

                  <p className="text-gray-600">
                    {job.location}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {formatTimeAgo(job.created_at)}
                  </p>

                  <p className="text-gray-700 mt-2">
                    {job.description}
                  </p>

                  <p className="mt-2 text-sm text-blue-600">
                    Skill Required: {job.skill_required}
                  </p>

                  <p
                    className={`mt-2 text-sm font-semibold ${
                      isTaken ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    Status: {job.status || "Open"}
                  </p>

                </div>

                <button
                  disabled={isTaken || applyingJobId === job.id}
                  className={`px-4 py-2 rounded h-fit ${
                    isTaken
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  } disabled:opacity-70`}
                  onClick={async () => {

                    const fundiId =
                      localStorage.getItem("fundiId");

                    setApplyingJobId(job.id);

                    try {
                      const res = await fetch(
                        "/api/applications/apply",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type":
                              "application/json",
                          },
                          body: JSON.stringify({
                            jobId: job.id,
                            fundiId,
                            message: "",
                          }),
                        }
                      );

                      const data = await res.json();

                      alert(data.message);

                      fetchApplications();
                      fetchJobs();
                    } finally {
                      setApplyingJobId(null);
                    }
                  }}
                >
                  {isTaken
                    ? "Unavailable"
                    : applyingJobId === job.id
                      ? "Applying..."
                      : "Apply"}
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    )}

    {/* ================= MY APPLICATIONS ================= */}

    {activeTab === "My Applications" && (
      <div>

        <h2 className="text-xl font-semibold mb-4">
          My Applications
        </h2>

        {applications.length === 0 ? (

          <div className="bg-white p-6 rounded shadow text-center text-gray-500">
            You haven't applied for any jobs yet.
          </div>

        ) : (

          <ul className="space-y-4">

            {applications.map((app) => (

              <li
                key={app.id}
                className="bg-white rounded shadow p-4 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-bold">
                    {app.title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {app.location}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {formatTimeAgo(app.job_created_at)}
                  </p>

                  <p className="text-blue-600 mt-2">
                    Status: {app.status}
                  </p>

                  <p className="text-gray-600">
                    Message:
                    {" "}
                    {app.message || "None"}
                  </p>

                </div>

                {app.status === "Pending" && (
                  <button
                    className="bg-red-600 text-white px-3 py-2 rounded"
                    onClick={async () => {

                      await fetch(
                        `/api/applications/${app.id}`,
                        {
                          method: "DELETE",
                        }
                      );

                      fetchApplications();

                    }}
                  >
                    Withdraw
                  </button>
                )}

              </li>

            ))}

          </ul>

        )}

      </div>
    )}
    {activeTab === "Active Jobs" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Active Jobs</h2>

    {activeJobs.length === 0 ? (
      <div className="bg-white p-6 rounded shadow text-center text-gray-500">
        You have no active jobs at the moment.
      </div>
    ) : (
      <ul className="space-y-4">
        {activeJobs.map((job) => (
          <li
            key={job.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold">{job.title}</h3>
              <p className="text-gray-600">{job.location}</p>
              <p className="text-sm text-green-600 mt-1">
                Status: Active
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimeAgo(job.job_created_at)}
              </p>
            </div>

            <button className="bg-blue-600 text-white px-3 py-2 rounded">
              View
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
{activeTab === "Completed Jobs" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Completed Jobs</h2>

    {completedJobs.length === 0 ? (
      <div className="bg-white p-6 rounded shadow text-center text-gray-500">
        No completed jobs yet.
      </div>
    ) : (
      <ul className="space-y-4">
        {completedJobs.map((job) => (
          <li key={job.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{job.title}</h3>
            <p className="text-gray-600">{job.location}</p>
            <p className="text-sm text-green-600 mt-1">
              Completed {formatTimeAgo(job.completed_at).replace("Posted ", "")}
            </p>
            {job.rating && (
              <p className="text-sm text-yellow-600 mt-1">
                Rating: {job.rating}/5
              </p>
            )}
            {job.comment && (
              <p className="text-sm text-gray-700 mt-1">{job.comment}</p>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
)}
{activeTab === "Messages" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Messages</h2>

    <MessagesPanel />
  </div>
)}
{activeTab === "Notifications" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">
      Notifications
    </h2>

    {loadingNotifications ? (
      <div className="bg-white p-6 rounded shadow text-center text-gray-500">
        Loading notifications...
      </div>
    ) : notifications.length === 0 ? (
      <div className="bg-white p-6 rounded shadow text-center text-gray-500">
        No notifications.
      </div>
    ) : (
      <ul className="space-y-3">
        {notifications.map((note) => (
          <li
            key={note.id}
            className="bg-white p-4 rounded shadow"
          >
            <div className="flex justify-between gap-4">
              <div>
                <p>{note.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {note.created_at}
                </p>
              </div>

              {!note.is_read && (
                <button
                  onClick={() => markNotificationRead(note.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
{activeTab === "Profile" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Profile</h2>

    <div className="bg-white p-6 rounded shadow flex flex-col md:flex-row gap-6">

      {/* ================= LEFT: PROFILE CARD ================= */}
      <div className="md:w-1/3 flex flex-col items-center text-center border-r md:pr-6">

        {/* Profile Image */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 mb-4">
          <img
            src={
              newPhoto
                ? URL.createObjectURL(newPhoto)
                : profile.profile_photo ||
                  "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        <h3 className="text-lg font-bold">{profile.name || "Your Name"}</h3>
        <p className="text-gray-500">{profile.skill || "Your Skill"}</p>
        <p className="text-sm text-gray-400 mt-1">
          {profile.location || "Location not set"}
        </p>

        <div className="mt-3 text-yellow-500 font-semibold">
          ⭐ {profile.rating || 5} Rating
        </div>
      </div>

      {/* ================= RIGHT: EDIT FORM ================= */}
      <div className="md:w-2/3 space-y-3">

        <input
          className={`w-full border p-2 rounded ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
          placeholder="Name"
          value={profile.name}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, name: e.target.value })
          }
        />

        <input
          className={`w-full border p-2 rounded ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
          placeholder="Email"
          value={profile.email}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, email: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded bg-gray-100"
          placeholder="National ID"
          value={profile.national_id || ""}
          readOnly
        />

        <input
          className={`w-full border p-2 rounded ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
          placeholder="Phone Number"
          value={profile.phone_number || ""}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, phone_number: e.target.value })
          }
        />

        <input
          className={`w-full border p-2 rounded ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
          placeholder="Location"
          value={profile.location}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, location: e.target.value })
          }
        />

        <input
          className={`w-full border p-2 rounded ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
          placeholder="Skill"
          value={profile.skill}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, skill: e.target.value })
          }
        />

        <textarea
          className={`w-full border p-2 rounded ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
          placeholder="Bio"
          value={profile.bio}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, bio: e.target.value })
          }
        />

        {/* Upload new photo */}
        {editingProfile && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Profile Photo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewPhoto(e.target.files[0])}
            className="w-full"
          />
        </div>
        )}

        {editingProfile ? (
          <div className="flex gap-3">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="bg-green-600 text-white px-4 py-2 rounded flex-1 disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>

            <button
              onClick={() => {
                setEditingProfile(false);
                setNewPhoto(null);
                fetchProfile();
              }}
              className="bg-gray-300 px-4 py-2 rounded flex-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingProfile(true)}
            className="bg-black text-white px-4 py-2 rounded w-full"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  </div>
)}
{activeTab === "Portfolio" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Portfolio</h2>

    <div className="bg-white p-6 rounded shadow">
      <p className="text-gray-500 mb-4">
        Showcase your past work here.
      </p>

      {portfolio.length === 0 ? (
        <p className="text-gray-500">
          No portfolio items uploaded yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {portfolio.map((item) => (
            <div
              key={item.id}
              className="border rounded p-3"
            >
              <img
                src={item.image}
                alt=""
                className="w-full h-32 object-cover rounded"
              />
              <p className="mt-2 font-semibold">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
  </div>
);

};

export default FundiDashboard;
