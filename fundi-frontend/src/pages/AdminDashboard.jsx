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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

        <div className="grid md:grid-cols-2 gap-6 mb-10">

          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-3">
              Manage Clients
            </h3>

            <button
              onClick={() => navigate("/admin/clients")}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              View Clients
            </button>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-3">
              Manage Fundis
            </h3>

            <button
              onClick={() => navigate("/admin/fundis")}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              View Fundis
            </button>
          </div>

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
