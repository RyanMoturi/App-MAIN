import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const TABS = [
  "Find Jobs",
  "My Applications",
  "Active Jobs",
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
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [portfolio, setPortfolio] = useState([]);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: "",
    skill: "",
    bio: "",
    national_id: "",
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
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const fundiId = localStorage.getItem("fundiId");

      const res = await fetch(`/api/fundis/${fundiId}`);

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

      setApplications(data);
    } catch (err) {
      console.log(err);
    }
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

      if (newPhoto) {
        formData.append("profile_photo", newPhoto);
      }

      const res = await fetch(`/api/fundis/${fundiId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      alert(data.message);

      fetchProfile();

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
            {jobs.map((job) => (
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

                  <p className="text-gray-700 mt-2">
                    {job.description}
                  </p>

                  <p className="mt-2 text-sm text-blue-600">
                    Skill Required: {job.skill_required}
                  </p>

                </div>

                <button
                  className="bg-green-600 text-white px-4 py-2 rounded h-fit"
                  onClick={async () => {

                    const fundiId =
                      localStorage.getItem("fundiId");

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
                  }}
                >
                  Apply
                </button>
              </li>
            ))}
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

                  <p className="text-blue-600 mt-2">
                    Status: {app.status}
                  </p>

                  <p className="text-gray-600">
                    Message:
                    {" "}
                    {app.message || "None"}
                  </p>

                </div>

                {app.status === "pending" && (
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
                Status: {job.status}
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
{activeTab === "Messages" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Messages</h2>

    {messages.length === 0 ? (
      <div className="bg-white p-6 rounded shadow text-center text-gray-500">
        No messages yet.
      </div>
    ) : (
      <ul className="space-y-3">
        {messages.map((msg) => (
          <li
            key={msg.id}
            className="bg-white p-4 rounded shadow"
          >
            <p className="font-semibold">{msg.sender}</p>
            <p className="text-gray-600">{msg.text}</p>
            <p className="text-xs text-gray-400 mt-1">
              {msg.created_at}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
{activeTab === "Notifications" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">
      Notifications
    </h2>

    {notifications.length === 0 ? (
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
            <p>{note.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {note.created_at}
            </p>
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
          className="w-full border p-2 rounded"
          placeholder="Name"
          value={profile.name}
          onChange={(e) =>
            setProfile({ ...profile, name: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={profile.email}
          onChange={(e) =>
            setProfile({ ...profile, email: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Location"
          value={profile.location}
          onChange={(e) =>
            setProfile({ ...profile, location: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Skill"
          value={profile.skill}
          onChange={(e) =>
            setProfile({ ...profile, skill: e.target.value })
          }
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder="Bio"
          value={profile.bio}
          onChange={(e) =>
            setProfile({ ...profile, bio: e.target.value })
          }
        />

        {/* Upload new photo */}
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

        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
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