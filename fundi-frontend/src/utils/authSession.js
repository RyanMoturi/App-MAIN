export const saveAuthSession = (data, role) => {
  localStorage.setItem("userId", data.user.id);
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", role);
  localStorage.setItem("name", data.user.name || "");
  localStorage.setItem("email", data.user.email || "");
  localStorage.setItem("location", data.user.location || "");
  localStorage.setItem("apartment", data.user.apartment || "");

  if (data.user.latitude != null && data.user.longitude != null) {
    localStorage.setItem("latitude", String(data.user.latitude));
    localStorage.setItem("longitude", String(data.user.longitude));
  } else {
    localStorage.removeItem("latitude");
    localStorage.removeItem("longitude");
  }

  if (role === "client" && data.clientId) {
    localStorage.setItem("clientId", data.clientId);
  }
  if (role === "fundi" && data.fundiId) {
    localStorage.setItem("fundiId", data.fundiId);
    localStorage.setItem("skill", data.user.skill || "");
    localStorage.setItem("bio", data.user.bio || "");
    localStorage.setItem("rating", data.user.rating || "");
    localStorage.setItem("is_verified", data.user.is_verified ? "1" : "0");
    localStorage.setItem("verification_status", data.user.verification_status || "Pending");
  }
  if (role === "admin" && data.adminId) {
    localStorage.setItem("adminId", data.adminId);
  }

  window.dispatchEvent(new Event("authChanged"));
};

export const dashboardForRole = (role) =>
  role === "client"
    ? "/client-dashboard"
    : role === "fundi"
      ? "/fundi-dashboard"
      : "/admin-dashboard";
