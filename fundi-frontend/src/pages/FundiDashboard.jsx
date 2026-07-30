import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatTimeAgo } from "../utils/timeAgo";
import MessagesPanel from "../components/MessagesPanel";
import { MenuIcon } from "../components/Icons";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { hasCoordinates } from "../utils/location";


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
  const [pageMenuOpen, setPageMenuOpen] = useState(false);

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
    apartment: "",
    latitude: null,
    longitude: null,
    place_id: "",
    skill: "",
    bio: "",
    national_id: "",
    phone_number: "",
    is_verified: false,
    verification_status: "Pending",
    verification_note: "",
    rating: 5,
    profile_photo: "",
    good_conduct_certificate: "",
    professional_certificates: "",
  });

  const [newPhoto, setNewPhoto] = useState(null);
  const [goodConductCertificate, setGoodConductCertificate] = useState(null);
  const [professionalCertificates, setProfessionalCertificates] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const isVerified =
    profile.is_verified === true ||
    profile.is_verified === 1 ||
    profile.is_verified === "1";

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

    if (activeTab === "Portfolio") {
      fetchCompletedJobs();
    }

    if (activeTab === "Notifications") {
      fetchNotifications();
    }

    if (activeTab === "Profile") {
      fetchProfile();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const fundiId = localStorage.getItem("fundiId");
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/fundi/me/${fundiId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      formData.append("apartment", profile.apartment || "");
      formData.append("latitude", String(profile.latitude ?? ""));
      formData.append("longitude", String(profile.longitude ?? ""));
      formData.append("place_id", profile.place_id || "");
      formData.append("skill", profile.skill);
      formData.append("bio", profile.bio);
      formData.append("phone_number", profile.phone_number || "");

      if (newPhoto) {
        formData.append("profile_photo", newPhoto);
      }

      if (goodConductCertificate) {
        formData.append("good_conduct_certificate", goodConductCertificate);
      }

      if (professionalCertificates) {
        formData.append("professional_certificates", professionalCertificates);
      }

      const res = await fetch(`/api/fundi/${fundiId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      localStorage.setItem("name", profile.name);
      localStorage.setItem("email", profile.email);
      localStorage.setItem("location", profile.location);
      localStorage.setItem("apartment", profile.apartment || "");
      if (hasCoordinates(profile)) {
        localStorage.setItem("latitude", String(profile.latitude));
        localStorage.setItem("longitude", String(profile.longitude));
      } else {
        localStorage.removeItem("latitude");
        localStorage.removeItem("longitude");
      }
      localStorage.setItem("skill", profile.skill);
      localStorage.setItem("bio", profile.bio);

      alert(data.message);

      fetchProfile();
      setEditingProfile(false);
      setNewPhoto(null);
      setGoodConductCertificate(null);
      setProfessionalCertificates(null);

      setSavingProfile(false);

    } catch (err) {
      console.log(err);
      alert(err.message || "Failed to save profile");
      setSavingProfile(false);
    }
  };
  return (
  <div className="p-6 bg-gray-100 min-h-screen">
    <h1 className="text-3xl font-bold mb-4">Fundi Dashboard</h1>

    {!isVerified && (
      <div className="mb-4 bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded">
        Verification status: {profile.verification_status || "Pending"}.
        {" "}
        You can browse jobs, but you cannot apply until an admin verifies your account.
        {profile.verification_note && (
          <span className="block mt-1">Admin note: {profile.verification_note}</span>
        )}
      </div>
    )}

    <div className="relative mb-6 max-w-xs">
      <button
        type="button"
        onClick={() => setPageMenuOpen(!pageMenuOpen)}
        className="flex w-full items-center justify-between rounded bg-white px-4 py-3 font-semibold shadow border hover:bg-gray-50"
      >
        <span>{activeTab}</span>
        <MenuIcon className="h-5 w-5" />
      </button>

      {pageMenuOpen && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded border bg-white shadow-lg">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setPageMenuOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-100 ${
                activeTab === tab ? "bg-gray-100 text-black" : "text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
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
                  disabled={!isVerified || isTaken || applyingJobId === job.id}
                  className={`px-4 py-2 rounded h-fit ${
                    !isVerified || isTaken
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
                    : !isVerified
                      ? "Pending Verification"
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
    <h2 className="text-2xl font-semibold mb-6">My Profile</h2>

    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <div className="mb-5 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
          {newPhoto || profile.profile_photo ? (
            <img
              src={
                newPhoto
                  ? URL.createObjectURL(newPhoto)
                  : profile.profile_photo
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex-1">
          <p className="font-semibold">{profile.name || "Your Name"}</p>
          <p className="text-sm text-gray-500">
            {profile.skill || "Skill not set"}
          </p>
          <p className="text-sm text-gray-500">
            Verification: {profile.verification_status || "Pending"}
          </p>
        </div>

        {editingProfile && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewPhoto(e.target.files[0])}
          />
        )}
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Name</label>
        <input
          type="text"
          value={profile.name || ""}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, name: e.target.value })
          }
          className={`w-full border rounded px-4 py-2 ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Email</label>
        <input
          type="email"
          value={profile.email || ""}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, email: e.target.value })
          }
          className={`w-full border rounded px-4 py-2 ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">National ID</label>
        <input
          type="text"
          value={profile.national_id || ""}
          readOnly
          className="w-full border rounded px-4 py-2 bg-gray-100"
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Phone Number</label>
        <input
          type="text"
          value={profile.phone_number || ""}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, phone_number: e.target.value })
          }
          className={`w-full border rounded px-4 py-2 ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Location</label>
        {editingProfile ? (
          <LocationAutocomplete
            id="fundi-profile-location"
            value={profile.location || ""}
            onTextChange={(address) =>
              setProfile((previous) => ({
                ...previous,
                location: address,
                latitude: null,
                longitude: null,
                place_id: "",
              }))
            }
            onPlaceSelect={(place) =>
              setProfile((previous) => ({
                ...previous,
                location: place.address,
                latitude: place.latitude,
                longitude: place.longitude,
                place_id: place.placeId,
              }))
            }
            bias={profile}
            className="w-full rounded border bg-white"
            required
          />
        ) : (
          <input
            type="text"
            value={profile.location || ""}
            readOnly
            className="w-full rounded border bg-gray-100 px-4 py-2"
          />
        )}
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">
          Apartment, house or floor
        </label>
        <input
          type="text"
          value={profile.apartment || ""}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, apartment: e.target.value })
          }
          placeholder="e.g. Apt B12, 3rd floor"
          className={`w-full border rounded px-4 py-2 ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Skill</label>
        <input
          type="text"
          value={profile.skill || ""}
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, skill: e.target.value })
          }
          className={`w-full border rounded px-4 py-2 ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Bio</label>
        <textarea
          value={profile.bio || ""}
          rows="4"
          readOnly={!editingProfile}
          onChange={(e) =>
            setProfile({ ...profile, bio: e.target.value })
          }
          className={`w-full border rounded px-4 py-2 ${
            editingProfile ? "bg-white" : "bg-gray-100"
          }`}
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Role</label>
        <input
          type="text"
          value="Fundi"
          readOnly
          className="w-full border rounded px-4 py-2 bg-gray-100"
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">Average Rating</label>
        <input
          type="text"
          value={`${profile.rating || 5}/5`}
          readOnly
          className="w-full border rounded px-4 py-2 bg-gray-100"
        />
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">
          Certificate of Good Conduct
        </label>
        {profile.good_conduct_certificate && !goodConductCertificate && (
          <a
            href={profile.good_conduct_certificate}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-blue-600 hover:underline mb-2"
          >
            View uploaded certificate
          </a>
        )}
        {editingProfile && (
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setGoodConductCertificate(e.target.files[0])}
            className="w-full border rounded px-4 py-2"
          />
        )}
      </div>

      <div className="mb-5">
        <label className="block font-semibold mb-2">
          Professional Certifications
        </label>
        {profile.professional_certificates && !professionalCertificates && (
          <a
            href={profile.professional_certificates}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-blue-600 hover:underline mb-2"
          >
            View uploaded certifications
          </a>
        )}
        {editingProfile && (
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setProfessionalCertificates(e.target.files[0])}
            className="w-full border rounded px-4 py-2"
          />
        )}
      </div>

      <div className="flex gap-3">
        {editingProfile ? (
          <>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>

            <button
              onClick={() => {
                setEditingProfile(false);
                setNewPhoto(null);
                setGoodConductCertificate(null);
                setProfessionalCertificates(null);
                fetchProfile();
              }}
              className="bg-gray-300 px-5 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditingProfile(true)}
            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800"
          >
            Edit Profile
          </button>
        )}

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
)}
{activeTab === "Profile" && false && (
  <div>
    <h2 className="text-2xl font-semibold mb-6">My Profile</h2>

    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">

      {/* ================= LEFT: PROFILE CARD ================= */}
      <div className="flex flex-col items-center text-center border-b pb-6 mb-6">

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
      <div className="space-y-3">

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
        Your completed jobs, ratings, reviews, and completion dates appear here.
      </p>

      {completedJobs.length === 0 ? (
        <p className="text-gray-500">
          No completed jobs in your portfolio yet.
        </p>
      ) : (
        <div className="space-y-4">
          {completedJobs.map((job) => (
            <div
              key={job.id}
              className="border rounded p-4"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {job.description}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Completed on{" "}
                    {job.completed_at
                      ? new Date(job.completed_at).toLocaleDateString()
                      : "Not recorded"}
                  </p>
                </div>
                <span className="text-yellow-600 font-semibold whitespace-nowrap">
                  Rating: {job.rating || "Not rated"}/5
                </span>
              </div>

              <div className="mt-3 bg-gray-50 rounded p-3">
                <p className="text-sm font-semibold">Client Review</p>
                <p className="text-sm text-gray-700 mt-1">
                  {job.comment || "No review left yet."}
                </p>
              </div>
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
