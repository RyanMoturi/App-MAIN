import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("adminId");

    window.dispatchEvent(new Event("authChanged"));

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-red-600 text-white shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-5">
          <h1 className="text-2xl font-bold">
            Fundi-Link Admin Dashboard
          </h1>

          <button
            onClick={logout}
            className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">

        <h2 className="text-3xl font-bold mb-8">
          Welcome, Admin 👋
        </h2>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500">Clients</h3>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500">Fundis</h3>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500">Jobs Posted</h3>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>

        </div>

        {/* Management Cards */}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-xl mb-3">
              Manage Clients
            </h3>

            <p className="text-gray-600 mb-5">
              View or remove registered clients.
            </p>

            <button
              onClick={() => navigate("/admin/clients")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View Clients
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-xl mb-3">
              Manage Fundis
            </h3>

            <p className="text-gray-600 mb-5">
              View or remove fundis.
            </p>

            <button
              onClick={() => navigate("/admin/fundis")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              View Fundis
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-xl mb-3">
              Manage Jobs
            </h3>

            <p className="text-gray-600 mb-5">
              View jobs posted by clients.
            </p>

            <button
              onClick={() => navigate("/admin/jobs")}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              View Jobs
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-xl mb-3">
              Reports
            </h3>

            <p className="text-gray-600 mb-5">
              View simple platform statistics.
            </p>

            <button
              onClick={() => navigate("/admin/reports")}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              View Reports
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;