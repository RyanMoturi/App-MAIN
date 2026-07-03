import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PostJob from "./PostJob";

const TABS = [
  "My Jobs",
  "Find Fundis",
  "Messages",
  "Notifications",
  "Profile",
];

const mockMessages = [
  {
    id: 1,
    from: "Jane Mwangi",
    content: "I can start tomorrow!",
    job: "Fix Sink",
  },
  {
    id: 2,
    from: "Mary Wanjiku",
    content: "Do you have a color preference?",
    job: "Paint Living Room",
  },
];

const mockNotifications = [
  {
    id: 1,
    content: "Jane Mwangi applied for your job: Fix Sink",
  },
  {
    id: 2,
    content: "Mary Wanjiku was accepted for your job: Paint Living Room",
  },
];

const ClientDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TABS[0]);

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const [showPostJob, setShowPostJob] = useState(false);

  const [fundis, setFundis] = useState([]);
  const [loadingFundis, setLoadingFundis] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [messages] = useState(mockMessages);
  const [notifications] = useState(mockNotifications);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "client") {
      navigate("/login");
    }
  }, [navigate]);

  // ================= FETCH CLIENT JOBS =================

  const fetchJobs = async () => {
    setLoadingJobs(true);
    setJobsError("");

    try {
      const clientId = localStorage.getItem("clientId");
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/client/${clientId}/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();

      setJobs(data);
    } catch (err) {
      console.error(err);
      setJobsError("Failed to load jobs.");
    }

    setLoadingJobs(false);
  };

  // ================= FETCH FUNDIS =================

  const fetchFundis = async (category = "All") => {
    setLoadingFundis(true);

    try {
      let endpoint = "/api/fundi";

      if (category !== "All") {
        endpoint = `/api/fundi/category/${category}`;
      }

      const res = await fetch(endpoint);

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();

      setFundis(data);
    } catch (err) {
      console.error(err);
    }

    setLoadingFundis(false);
  };

  useEffect(() => {
    if (activeTab === "My Jobs") {
      fetchJobs();
    }

    if (activeTab === "Find Fundis") {
      fetchFundis(selectedCategory);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-3xl font-bold mb-6">
        Client Dashboard
      </h1>

      <div className="flex gap-4 mb-8 flex-wrap">
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

      {/* ================= MY JOBS ================= */}

      {activeTab === "My Jobs" && (
        <div>

          <div className="flex justify-between mb-6">

            <h2 className="text-2xl font-semibold">
              My Jobs
            </h2>

            <button
              onClick={() =>
                setShowPostJob(!showPostJob)
              }
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {showPostJob
                ? "Cancel"
                : "Post a Job"}
            </button>

          </div>

          {showPostJob && (
            <PostJob onSubmit={fetchJobs} />
          )}

          {loadingJobs ? (
            <div>Loading jobs...</div>
          ) : jobsError ? (
            <div className="text-red-600">
              {jobsError}
            </div>
          ) : jobs.length === 0 ? (
            <div>No jobs posted yet.</div>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="block bg-white rounded shadow p-4 hover:ring-2 hover:ring-blue-500"
                  >

                    <div className="flex justify-between">

                      <div>

                        <h3 className="font-bold">
                          {job.title}
                        </h3>

                        {job.status && (
                          <span className="text-gray-500 text-sm">
                            {job.status}
                          </span>
                        )}

                      </div>

                      <span className="text-blue-600">
                        View →
                      </span>

                    </div>

                    {job.image_url && (
                      <img
                        src={job.image_url}
                        alt={job.title}
                        className="mt-3 rounded w-full h-48 object-cover"
                      />
                    )}

                    <p className="mt-3 text-gray-600">
                      {job.description}
                    </p>

                  </Link>
                </li>
              ))}
            </ul>
          )}

        </div>
      )}

      {/* ================= FIND FUNDIS ================= */}

      {activeTab === "Find Fundis" && (
        <div>

          <h2 className="text-2xl font-semibold mb-6">
            Find Fundis
          </h2>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              fetchFundis(e.target.value);
            }}
            className="border rounded px-4 py-2 mb-6"
          >
            <option value="All">All Categories</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Painting">Painting</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Roofing">Roofing</option>
            <option value="Welding">Welding</option>
            <option value="Masonry">Masonry</option>
          </select>

          {loadingFundis ? (
            <div>Loading fundis...</div>
          ) : fundis.length === 0 ? (
            <div>No fundis found.</div>
          ) : (
            <ul className="space-y-4">

              {fundis.map((fundi) => (

                <li
                  key={fundi.id}
                  className="bg-white rounded shadow p-5 flex justify-between items-center"
                >

                  <div>

                    <h3 className="font-bold text-lg">
                      {fundi.name}
                    </h3>

                    <p>{fundi.skill}</p>

                    <p className="text-gray-500">
                      {fundi.location}
                    </p>

                    <p className="text-yellow-500">
                      ⭐ {fundi.rating}
                    </p>

                    <p className="mt-2 text-gray-600">
                      {fundi.bio}
                    </p>

                  </div>

                  <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    View Profile
                  </button>

                </li>

              ))}

            </ul>
          )}

        </div>
      )}
      {/* ================= MESSAGES ================= */}

      {activeTab === "Messages" && (
        <div>

          <h2 className="text-2xl font-semibold mb-6">
            Messages
          </h2>

          <ul className="space-y-4">

            {messages.map((msg) => (

              <li
                key={msg.id}
                className="bg-white rounded shadow p-5"
              >

                <h3 className="font-bold">
                  From: {msg.from}
                </h3>

                <p className="mt-2">
                  {msg.content}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Regarding: {msg.job}
                </p>

              </li>

            ))}

          </ul>

        </div>
      )}

      {/* ================= NOTIFICATIONS ================= */}

      {activeTab === "Notifications" && (
        <div>

          <h2 className="text-2xl font-semibold mb-6">
            Notifications
          </h2>

          <ul className="space-y-3">

            {notifications.map((notification) => (

              <li
                key={notification.id}
                className="bg-white rounded shadow p-4"
              >
                {notification.content}
              </li>

            ))}

          </ul>

        </div>
      )}

      {/* ================= PROFILE ================= */}

      {activeTab === "Profile" && (

        <div>

          <h2 className="text-2xl font-semibold mb-6">
            My Profile
          </h2>

          <div className="bg-white rounded shadow p-6">

            <div className="mb-5">

              <label className="block font-semibold mb-2">
                Name
              </label>

              <input
                className="border rounded w-full p-2"
                value={localStorage.getItem("name") || ""}
                readOnly
              />

            </div>

            <div className="mb-5">

              <label className="block font-semibold mb-2">
                Email
              </label>

              <input
                className="border rounded w-full p-2"
                value={localStorage.getItem("email") || ""}
                readOnly
              />

            </div>

            <div className="mb-5">

              <label className="block font-semibold mb-2">
                Location
              </label>

              <input
                className="border rounded w-full p-2"
                value={localStorage.getItem("location") || ""}
                readOnly
              />

            </div>

            <div className="mb-5">

              <label className="block font-semibold mb-2">
                Role
              </label>

              <input
                className="border rounded w-full p-2"
                value="Client"
                readOnly
              />

            </div>

            <button
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
              disabled
            >
              Edit Profile (Coming Soon)
            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default ClientDashboard;