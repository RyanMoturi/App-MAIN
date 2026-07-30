import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PostJob from "./PostJob";
import { formatTimeAgo } from "../utils/timeAgo";
import MessagesPanel from "../components/MessagesPanel";
import FundiProfile from "../components/FundiProfile";
import { MenuIcon } from "../components/Icons";
import LocationAutocomplete from "../components/LocationAutocomplete";
import {
  getBrowserLocation,
  hasCoordinates,
  savedAccountLocation,
} from "../utils/location";

const TABS = [
  "My Jobs",
  "Find Fundis",
  "Messages",
  "Notifications",
  "Profile",
];

const ClientDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("My Jobs");
  const [pageMenuOpen, setPageMenuOpen] = useState(false);

  // Jobs
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [showPostJob, setShowPostJob] = useState(false);

  // Fundis
  const [fundis, setFundis] = useState([]);
  const [loadingFundis, setLoadingFundis] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [location, setLocation] = useState("");
  const [searchOrigin, setSearchOrigin] = useState(savedAccountLocation);
  const [locationStatus, setLocationStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const [selectedFundiId, setSelectedFundiId] = useState(null);
  const [contactFundi, setContactFundi] = useState(null);
  const [pendingChat, setPendingChat] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Profile
  const [clientProfile, setClientProfile] = useState({
    name: "",
    email: "",
    phone_number: "",
    location: "",
    apartment: "",
    latitude: null,
    longitude: null,
    place_id: "",
    profile_photo: "",
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "client") {
      navigate("/login");
    }
  }, [navigate]);

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

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      setJobs(data);
    } catch (err) {
      setJobsError("Failed to load jobs.");
      console.log(err);
    }

    setLoadingJobs(false);
  };

  const fetchFundis = async (
    category = "All",
    searchLocation = "",
    origin = searchOrigin
  ) => {
    setLoadingFundis(true);

    try {
      let url = "/api/fundi";

      const params = new URLSearchParams();

      if (category !== "All") {
        params.append("category", category);
      }

      if (hasCoordinates(origin)) {
        params.append("latitude", String(origin.latitude));
        params.append("longitude", String(origin.longitude));
      } else if (searchLocation.trim() !== "") {
        params.append("location", searchLocation);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      setFundis(data);
    } catch (err) {
      console.log(err);
    }

    setLoadingFundis(false);
  };

  const findNearestFundis = async (
    category = selectedCategory,
    searchLocation = location
  ) => {
    setLocating(true);
    setLocationStatus("Finding your current location…");

    let origin = savedAccountLocation();

    try {
      origin = await getBrowserLocation();
      setLocationStatus("Sorted nearest to your current location.");
    } catch (error) {
      if (origin) {
        setLocationStatus("Sorted nearest to your saved account address.");
      } else {
        setLocationStatus(
          "Allow location access or choose an address to sort by distance."
        );
      }
      console.info("Live location was not available.", error);
    } finally {
      setLocating(false);
    }

    setSearchOrigin(origin);
    await fetchFundis(category, searchLocation, origin);
  };

  const fetchNotifications = async () => {
    const clientId = localStorage.getItem("clientId");
    if (!clientId) return;

    setLoadingNotifications(true);

    try {
      const res = await fetch(
        `/api/notifications?userId=${clientId}&userRole=client`
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
    const clientId = localStorage.getItem("clientId");

    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId,
        userId: clientId,
        userRole: "client",
      }),
    });

    fetchNotifications();
  };

  const fetchClientProfile = async () => {
    const clientId = localStorage.getItem("clientId");
    if (!clientId) return;

    try {
      const res = await fetch(`/api/client/${clientId}/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setClientProfile({
          name: data.name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          location: data.location || "",
          apartment: data.apartment || "",
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          place_id: data.place_id || "",
          profile_photo: data.profile_photo || "",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const saveClientProfile = async () => {
    const clientId = localStorage.getItem("clientId");
    const formData = new FormData();

    formData.append("name", clientProfile.name);
    formData.append("email", clientProfile.email);
    formData.append("phone_number", clientProfile.phone_number || "");
    formData.append("location", clientProfile.location || "");
    formData.append("apartment", clientProfile.apartment || "");
    formData.append("latitude", String(clientProfile.latitude ?? ""));
    formData.append("longitude", String(clientProfile.longitude ?? ""));
    formData.append("place_id", clientProfile.place_id || "");

    if (newProfilePhoto) {
      formData.append("profile_photo", newProfilePhoto);
    }

    setSavingProfile(true);

    try {
      const res = await fetch(`/api/client/${clientId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      localStorage.setItem("name", clientProfile.name);
      localStorage.setItem("email", clientProfile.email);
      localStorage.setItem("location", clientProfile.location);
      localStorage.setItem("apartment", clientProfile.apartment || "");

      if (hasCoordinates(clientProfile)) {
        localStorage.setItem("latitude", String(clientProfile.latitude));
        localStorage.setItem("longitude", String(clientProfile.longitude));
        setSearchOrigin({
          latitude: Number(clientProfile.latitude),
          longitude: Number(clientProfile.longitude),
        });
      } else {
        localStorage.removeItem("latitude");
        localStorage.removeItem("longitude");
      }

      alert(data.message);
      setEditingProfile(false);
      setNewProfilePhoto(null);
      fetchClientProfile();
    } catch (err) {
      alert(err.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (activeTab === "My Jobs") {
      fetchJobs();
    }

    if (activeTab === "Find Fundis") {
      findNearestFundis(selectedCategory, location);
    }

    if (activeTab === "Notifications") {
      fetchNotifications();
    }

    if (activeTab === "Profile") {
      fetchClientProfile();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-3xl font-bold mb-6">
        Client Dashboard
      </h1>

      <div className="relative mb-8 max-w-xs">
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

      {activeTab === "My Jobs" && (
        <div>

          <div className="flex justify-between items-center mb-6">

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
                : "Post Job"}
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
            <div>No jobs posted.</div>
          ) : (
            <div className="space-y-4">

              {jobs.map((job) => (

                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block bg-white rounded-lg shadow p-5 hover:shadow-lg"
                >

                  <div className="flex justify-between">

                    <div>

                      <h3 className="text-xl font-bold">
                        {job.title}
                      </h3>

                      <p className="text-gray-600">
                        {job.description}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-gray-700">
                        Budget:{" "}
                        {job.budget_type === "fixed" && job.budget_amount
                          ? `KES ${Number(job.budget_amount).toLocaleString()}`
                          : "Negotiable"}
                      </p>

                      {job.agreed_price && (
                        <p className="mt-1 text-sm text-gray-700">
                          Agreed price: KES{" "}
                          {Number(job.agreed_price).toLocaleString()}
                        </p>
                      )}

                      <p className="text-sm text-gray-500 mt-2">
                        {formatTimeAgo(job.created_at)}
                      </p>

                      <p
                        className={`font-semibold mt-2 ${
                          job.is_taken ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        Status:
                        {" "}
                        {job.status || "Open"}
                      </p>

                    </div>

                    <span className="text-blue-600">
                      View →
                    </span>

                  </div>

                  {job.image_url && (
                    <img
                      src={job.image_url}
                      alt={job.title}
                      className="mt-4 rounded w-full h-48 object-cover"
                    />
                  )}

                </Link>

              ))}

            </div>
          )}

        </div>
      )}
            {activeTab === "Find Fundis" && (
        <div>

          <h2 className="text-2xl font-semibold mb-6">
            Find Fundis
          </h2>

          {/* Search Filters */}

          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(280px,1fr)_auto_auto]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded border px-4 py-2"
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

              <LocationAutocomplete
                id="fundi-search-location"
                value={location}
                onTextChange={(address) => {
                  setLocation(address);
                  setSearchOrigin(null);
                  setLocationStatus(
                    "Choose an address suggestion to search around that area."
                  );
                }}
                onPlaceSelect={(place) => {
                  const origin = {
                    latitude: place.latitude,
                    longitude: place.longitude,
                  };
                  setLocation(place.address);
                  setSearchOrigin(origin);
                  setLocationStatus(`Searching near ${place.address}.`);
                }}
                bias={savedAccountLocation()}
                placeholder="Search around an address or building"
                className="w-full rounded border bg-white"
              />

              <button
                type="button"
                onClick={() =>
                  fetchFundis(selectedCategory, location, searchOrigin)
                }
                className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocation("");
                  findNearestFundis(selectedCategory, "");
                }}
                disabled={locating}
                className="rounded bg-gray-900 px-5 py-2 text-white hover:bg-black disabled:opacity-60"
              >
                {locating ? "Locating…" : "Near me"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600">
                {locationStatus ||
                  "Results use your current or saved account location."}
              </p>
              <button
                type="button"
                onClick={() => {
                  const origin = savedAccountLocation();
                  setSelectedCategory("All");
                  setLocation("");
                  setSearchOrigin(origin);
                  setLocationStatus(
                    origin
                      ? "Sorted nearest to your saved account address."
                      : ""
                  );
                  fetchFundis("All", "", origin);
                }}
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                Clear filters
              </button>
            </div>
          </div>

          {loadingFundis ? (

            <div className="text-center py-10">
              Loading fundis...
            </div>

          ) : fundis.length === 0 ? (

            <div className="text-center text-gray-500 py-10">
              No fundis found.
            </div>

          ) : (

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {fundis.map((fundi) => (

                <div
                  key={fundi.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-5"
                >

                  <div className="flex justify-between items-start">

                    <div>

                      <h3 className="text-xl font-bold">
                        {fundi.name}
                      </h3>

                      <p className="text-blue-600 font-semibold">
                        {fundi.skill}
                      </p>

                    </div>

                    <span className="text-yellow-500 font-semibold">
                      ⭐ {fundi.rating || "0.0"}
                    </span>

                  </div>

                  <p className="text-gray-500 mt-3">
                    📍 {fundi.location}
                  </p>

                  {fundi.distance_km != null && (
                    <p className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                      {fundi.distance_km < 1
                        ? `${Math.round(fundi.distance_km * 1000)} m away`
                        : `${fundi.distance_km.toFixed(1)} km away`}
                    </p>
                  )}

                  <p className="text-gray-600 mt-3">
                    {fundi.bio || "No bio available."}
                  </p>

                  <div className="flex gap-3 mt-6">

                    <button
                      onClick={() => setSelectedFundiId(fundi.id)}
                      className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => setContactFundi(fundi)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Contact
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>
      )}
            {/* ===================== MESSAGES ===================== */}

      {activeTab === "Messages" && (
        <div>

          <h2 className="text-2xl font-semibold mb-6">
            Messages
          </h2>

          <MessagesPanel
            clientJobs={jobs}
            pendingChat={pendingChat}
            onChatStarted={() => setPendingChat(null)}
          />

        </div>
      )}

      {/* ===================== NOTIFICATIONS ===================== */}

      {activeTab === "Notifications" && (
        <div>

          <h2 className="text-2xl font-semibold mb-6">
            Notifications
          </h2>

          {loadingNotifications ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (

            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No notifications.
            </div>

          ) : (

            <div className="space-y-4">

              {notifications.map((notification) => (

                <div
                  key={notification.id}
                  className="bg-white rounded-lg shadow p-5 flex justify-between items-center"
                >

                  <div>

                    <p className="font-medium">
                      {notification.content}
                    </p>

                    {notification.created_at && (
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.created_at}
                      </p>
                    )}

                  </div>

                  <div className="flex items-center gap-3">
                    {!notification.is_read && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}

                    {!notification.is_read && (
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                </div>

              ))}

            </div>

          )}

        </div>
      )}
            {/* ===================== PROFILE ===================== */}

      {activeTab === "Profile" && (
        <div>

          <h2 className="text-2xl font-semibold mb-6">
            My Profile
          </h2>

          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">

            <div className="mb-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                {newProfilePhoto || clientProfile.profile_photo ? (
                  <img
                    src={
                      newProfilePhoto
                        ? URL.createObjectURL(newProfilePhoto)
                        : clientProfile.profile_photo
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              {editingProfile && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewProfilePhoto(e.target.files[0])}
                />
              )}
            </div>

            <div className="mb-5">
              <label className="block font-semibold mb-2">
                Name
              </label>

              <input
                type="text"
                value={clientProfile.name}
                readOnly={!editingProfile}
                onChange={(e) =>
                  setClientProfile({ ...clientProfile, name: e.target.value })
                }
                className={`w-full border rounded px-4 py-2 ${
                  editingProfile ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>

            <div className="mb-5">
              <label className="block font-semibold mb-2">
                Email
              </label>

              <input
                type="email"
                value={clientProfile.email}
                readOnly={!editingProfile}
                onChange={(e) =>
                  setClientProfile({ ...clientProfile, email: e.target.value })
                }
                className={`w-full border rounded px-4 py-2 ${
                  editingProfile ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>

            <div className="mb-5">
              <label className="block font-semibold mb-2">
                Phone Number
              </label>

              <input
                type="text"
                value={clientProfile.phone_number}
                readOnly={!editingProfile}
                onChange={(e) =>
                  setClientProfile({
                    ...clientProfile,
                    phone_number: e.target.value,
                  })
                }
                className={`w-full border rounded px-4 py-2 ${
                  editingProfile ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>

            <div className="mb-5">
              <label className="block font-semibold mb-2">
                Location
              </label>

              {editingProfile ? (
                <LocationAutocomplete
                  id="profile-location"
                  value={clientProfile.location}
                  onTextChange={(address) =>
                    setClientProfile((previous) => ({
                      ...previous,
                      location: address,
                      latitude: null,
                      longitude: null,
                      place_id: "",
                    }))
                  }
                  onPlaceSelect={(place) =>
                    setClientProfile((previous) => ({
                      ...previous,
                      location: place.address,
                      latitude: place.latitude,
                      longitude: place.longitude,
                      place_id: place.placeId,
                    }))
                  }
                  bias={clientProfile}
                  className="w-full rounded border bg-white"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={clientProfile.location}
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
                value={clientProfile.apartment}
                readOnly={!editingProfile}
                onChange={(e) =>
                  setClientProfile({
                    ...clientProfile,
                    apartment: e.target.value,
                  })
                }
                placeholder="e.g. Apt B12, 3rd floor"
                className={`w-full border rounded px-4 py-2 ${
                  editingProfile ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>

            <div className="mb-5">
              <label className="block font-semibold mb-2">
                Role
              </label>

              <input
                type="text"
                value="Client"
                readOnly
                className="w-full border rounded px-4 py-2 bg-gray-100"
              />
            </div>

            <div className="flex gap-3">

              {editingProfile ? (
                <>
                  <button
                    onClick={saveClientProfile}
                    disabled={savingProfile}
                    className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>

                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setNewProfilePhoto(null);
                      fetchClientProfile();
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

      {selectedFundiId && (
        <FundiProfile
          fundiId={selectedFundiId}
          onClose={() => setSelectedFundiId(null)}
          onMessage={(fundi) => {
            setSelectedFundiId(null);
            setPendingChat({
              otherUserId: fundi.id,
              otherUserRole: "fundi",
              otherUserName: fundi.name,
            });
            setActiveTab("Messages");
          }}
        />
      )}

      {contactFundi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Contact {contactFundi.name}</h2>
              <button
                onClick={() => setContactFundi(null)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {contactFundi.email || "Not provided"}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {contactFundi.phone_number || "Not provided"}
              </p>
            </div>

            <button
              onClick={() => {
                setPendingChat({
                  otherUserId: contactFundi.id,
                  otherUserRole: "fundi",
                  otherUserName: contactFundi.name,
                });
                setContactFundi(null);
                setActiveTab("Messages");
              }}
              className="mt-5 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Open Messages
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDashboard;
