import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    clients: 0,
    fundis: 0,
    jobs: 0,
    skills: 0,
    recentClients: [],
    recentFundis: [],
  });

  const [loading, setLoading] = useState(true);
  const [fundis, setFundis] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedFundi, setSelectedFundi] = useState(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [updatingVerification, setUpdatingVerification] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(
        "/api/admin/dashboard"
      );

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }

      fetchFundis();
      fetchReports();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports/fundi-reports");
      if (response.ok) {
        setReports(await response.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFundis = async () => {
    try {
      const response = await fetch("/api/admin/fundis");
      if (response.ok) {
        setFundis(await response.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewFundiDetails = async (fundiId) => {
    try {
      const response = await fetch(`/api/admin/fundi/${fundiId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedFundi(data);
        setVerificationNote(data.verification_note || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateVerification = async (status) => {
    if (!selectedFundi) return;

    setUpdatingVerification(true);

    try {
      const response = await fetch(
        `/api/admin/fundi/${selectedFundi.id}/verification`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            note: verificationNote,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to update fundi");

      alert(data.message);
      await fetchDashboard();
      await fetchFundis();
      await viewFundiDetails(selectedFundi.id);
    } catch (err) {
      alert(err.message || "Failed to update fundi");
    } finally {
      setUpdatingVerification(false);
    }
  };

  const updateReport = async (reportId, status, banFundi = false) => {
    try {
      const adminNote = window.prompt("Admin note (optional)") || "";
      const response = await fetch(`/api/reports/fundi-reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_note: adminNote,
          ban_fundi: banFundi,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to update report");

      alert(data.message);
      fetchReports();
      fetchFundis();
      fetchDashboard();
    } catch (err) {
      alert(err.message || "Failed to update report");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-red-600 text-white p-5 flex justify-between">
        <h1 className="text-2xl font-bold">
          Fundi-Link Admin Dashboard
        </h1>

        <button
          onClick={logout}
          className="bg-white text-red-600 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="p-8">

        <div className="grid md:grid-cols-4 gap-6 mb-10">

          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500">Clients</h3>
            <p className="text-4xl font-bold">
              {stats.clients}
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500">Fundis</h3>
            <p className="text-4xl font-bold">
              {stats.fundis}
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500">Jobs</h3>
            <p className="text-4xl font-bold">
              {stats.jobs}
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500">Skills</h3>
            <p className="text-4xl font-bold">
              {stats.skills}
            </p>
          </div>

        </div>

        <div className="bg-white p-6 rounded shadow mb-10">
          <h3 className="text-xl font-bold mb-4">
            Fundi Verification
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {fundis.length === 0 ? (
                <p className="text-gray-500">No fundis found.</p>
              ) : (
                fundis.map((fundi) => (
                  <button
                    key={fundi.id}
                    onClick={() => viewFundiDetails(fundi.id)}
                    className="w-full text-left border rounded p-3 hover:bg-gray-50"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">{fundi.name}</p>
                        <p className="text-sm text-gray-500">
                          {fundi.skill} - {fundi.location}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          fundi.verification_status === "Verified"
                            ? "text-green-600"
                            : fundi.verification_status === "Rejected"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {fundi.verification_status || "Pending"}
                      </span>
                      {(fundi.is_flagged || fundi.is_banned) && (
                        <span className="text-xs text-red-600 font-semibold">
                          {fundi.is_banned ? "Banned" : "Flagged"}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {selectedFundi ? (
              <div className="border rounded p-4">
                <h4 className="font-bold text-lg">{selectedFundi.name}</h4>
                <p className="text-sm text-gray-600">{selectedFundi.email}</p>
                <p className="text-sm text-gray-600">Phone: {selectedFundi.phone_number || "Not set"}</p>
                <p className="text-sm text-gray-600">National ID: {selectedFundi.national_id}</p>
                <p className="text-sm text-gray-600">Skill: {selectedFundi.skill}</p>
                <p className="text-sm text-gray-600">Location: {selectedFundi.location}</p>
                {selectedFundi.is_flagged ? (
                  <p className="text-sm text-red-600 font-semibold">This fundi has been flagged.</p>
                ) : null}
                {selectedFundi.is_banned ? (
                  <p className="text-sm text-red-600 font-semibold">This fundi is banned.</p>
                ) : null}
                <p className="text-sm text-gray-700 mt-2">{selectedFundi.bio}</p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="font-semibold mb-2">ID Photo</p>
                    {selectedFundi.id_photo ? (
                      <img
                        src={selectedFundi.id_photo}
                        alt="National ID"
                        className="w-full h-40 object-cover rounded border"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No ID photo.</p>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Profile Photo</p>
                    {selectedFundi.profile_photo ? (
                      <img
                        src={selectedFundi.profile_photo}
                        alt="Profile"
                        className="w-full h-40 object-cover rounded border"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No profile photo.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="font-semibold mb-2">Good Conduct Certificate</p>
                    {selectedFundi.good_conduct_certificate ? (
                      <a
                        href={selectedFundi.good_conduct_certificate}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View certificate
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">Not uploaded.</p>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Professional Certifications</p>
                    {selectedFundi.professional_certificates ? (
                      <a
                        href={selectedFundi.professional_certificates}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View certifications
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">Not uploaded.</p>
                    )}
                  </div>
                </div>

                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Verification note (optional)"
                  className="w-full border rounded p-2 mt-4"
                  rows="3"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => updateVerification("Verified")}
                    disabled={updatingVerification}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => updateVerification("Rejected")}
                    disabled={updatingVerification}
                    className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="border rounded p-6 text-gray-500">
                Select a fundi to review their details.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow mb-10">
          <h3 className="text-xl font-bold mb-4">
            Fundi Reports
          </h3>

          {reports.length === 0 ? (
            <p className="text-gray-500">No reports submitted.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {report.fundi_name} reported by {report.client_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Job: {report.job_title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Reason: {report.reason}
                      </p>
                      {report.details && (
                        <p className="text-sm text-gray-700 mt-2">
                          {report.details}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {report.created_at}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        report.status === "Pending"
                          ? "text-yellow-600"
                          : report.status === "Dismissed"
                            ? "text-gray-600"
                            : "text-red-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => updateReport(report.id, "Dismissed", false)}
                      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => updateReport(report.id, "Reviewed", false)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    >
                      Keep Flagged
                    </button>
                    <button
                      onClick={() => updateReport(report.id, "Reviewed", true)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Ban Fundi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-xl mb-4">
              Recent Clients
            </h3>

            {stats.recentClients.map(client => (
              <div
                key={client.id}
                className="border-b py-2"
              >
                <p>{client.name}</p>
                <p className="text-gray-500 text-sm">
                  {client.email}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-xl mb-4">
              Recent Fundis
            </h3>

            {stats.recentFundis.map(fundi => (
              <div
                key={fundi.id}
                className="border-b py-2"
              >
                <p>{fundi.name}</p>
                <p className="text-gray-500 text-sm">
                  {fundi.skill}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
