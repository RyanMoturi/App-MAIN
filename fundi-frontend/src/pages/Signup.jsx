import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { hasGoogleMapsKey } from "../utils/googleMaps";
import {
  getBrowserLocation,
  savedAccountLocation,
} from "../utils/location";

const Signup = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("client");
  const [locationBias, setLocationBias] = useState(savedAccountLocation);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    apartment: "",
    latitude: null,
    longitude: null,
    place_id: "",
    phone_number: "",

    skill: "",
    bio: "",

    national_id: "",
    id_photo: null,
    profile_photo: null,
    good_conduct_certificate: null,
    professional_certificates: null,
  });

  useEffect(() => {
    if (locationBias) return;

    getBrowserLocation({ timeout: 6000 })
      .then(setLocationBias)
      .catch(() => {
        // Suggestions still work across Kenya when permission is denied.
      });
  }, [locationBias]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      hasGoogleMapsKey() &&
      (!Number.isFinite(formData.latitude) ||
        !Number.isFinite(formData.longitude))
    ) {
      alert("Please choose your address from the Google suggestions.");
      return;
    }

    try {
      let response;

      // ================= CLIENT SIGNUP =================
      if (role === "client") {
        response = await fetch(
          "/api/auth/signup/client",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: formData.password,
              phone_number: formData.phone_number,
              location: formData.location,
              apartment: formData.apartment,
              latitude: formData.latitude,
              longitude: formData.longitude,
              place_id: formData.place_id,
            }),
          }
        );
      }

      // ================= FUNDI SIGNUP =================
      else {
        if (formData.national_id.length < 6) {
          alert("National ID must contain at least 6 digits.");
          return;
        }

        const data = new FormData();

        data.append("name", formData.name);
        data.append("email", formData.email);
        data.append("password", formData.password);
        data.append("location", formData.location);
        data.append("apartment", formData.apartment);
        data.append("latitude", String(formData.latitude ?? ""));
        data.append("longitude", String(formData.longitude ?? ""));
        data.append("place_id", formData.place_id);
        data.append("skill", formData.skill);
        data.append("bio", formData.bio);
        data.append("national_id", formData.national_id);

        data.append("id_photo", formData.id_photo);
        data.append("profile_photo", formData.profile_photo);

        if (formData.good_conduct_certificate) {
          data.append(
            "good_conduct_certificate",
            formData.good_conduct_certificate
          );
        }

        if (formData.professional_certificates) {
          data.append(
            "professional_certificates",
            formData.professional_certificates
          );
        }

        response = await fetch(
          "/api/auth/signup/fundi",
          {
            method: "POST",
            body: data,
          }
        );
      }

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Signup failed.");
        return;
      }

      alert(result.message);
      navigate("/login");

    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  };
    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">

        <h2 className="text-2xl font-bold text-center mb-6">
          Create an Account
        </h2>

        <div className="flex justify-center gap-4 mb-6">

          <button
            type="button"
            onClick={() => setRole("client")}
            className={`px-4 py-2 rounded-full border ${
              role === "client"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Client
          </button>

          <button
            type="button"
            onClick={() => setRole("fundi")}
            className={`px-4 py-2 rounded-full border ${
              role === "fundi"
                ? "bg-green-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Fundi
          </button>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />

          <div>
            <label
              htmlFor="signup-location"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              {role === "client" ? "Your address" : "Where are you based?"}
            </label>
            <LocationAutocomplete
              id="signup-location"
              value={formData.location}
              onTextChange={(location) =>
                setFormData((previous) => ({
                  ...previous,
                  location,
                  latitude: null,
                  longitude: null,
                  place_id: "",
                }))
              }
              onPlaceSelect={(place) =>
                setFormData((previous) => ({
                  ...previous,
                  location: place.address,
                  latitude: place.latitude,
                  longitude: place.longitude,
                  place_id: place.placeId,
                }))
              }
              bias={locationBias}
              placeholder={
                role === "client"
                  ? "Start typing your apartment, building, road or estate"
                  : "Start typing your estate, town or base location"
              }
              className="w-full rounded border bg-white"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {role === "client"
                ? "Start with your apartment, building, estate or road, then select the correct Google suggestion."
                : "Select the Google suggestion for the area where you normally work from."}
            </p>
          </div>

          <div>
            <label
              htmlFor="signup-apartment"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Apartment, house or floor{" "}
              <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="signup-apartment"
              type="text"
              name="apartment"
              placeholder="e.g. Green Court, Apt B12, 3rd floor"
              value={formData.apartment}
              onChange={handleChange}
              autoComplete="address-line2"
              className="w-full p-3 border rounded"
            />
          </div>

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />

          {role === "client" && (
            <input
              type="text"
              name="phone_number"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full p-3 border rounded"
              required
            />
          )}

          {role === "fundi" && (
            <>
              <select
                name="skill"
                value={formData.skill}
                onChange={handleChange}
                className="w-full p-3 border rounded"
                required
              >
                <option value="">Select Your Skill</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Carpentry">Carpentry</option>
              </select>

              <input
                type="number"
                name="national_id"
                placeholder="National ID Number"
                value={formData.national_id}
                onChange={handleChange}
                className="w-full p-3 border rounded"
                min="100000"
                required
              />

              <div>
                <label className="block mb-2 font-medium">
                  Upload National ID Photo
                </label>

                <input
                  type="file"
                  name="id_photo"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Upload Recent Photo
                </label>

                <input
                  type="file"
                  name="profile_photo"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Certificate of Good Conduct (optional)
                </label>

                <input
                  type="file"
                  name="good_conduct_certificate"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Professional Certifications (optional)
                </label>

                <input
                  type="file"
                  name="professional_certificates"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <textarea
                name="bio"
                placeholder="Tell clients about yourself..."
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border rounded"
                required
              />
            </>
          )}
                    <button
            type="submit"
            className={`w-full text-white font-semibold py-3 rounded ${
              role === "client"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Sign Up as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>

        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline font-semibold"
          >
            Login
          </button>
        </p>

      </div>
    </div>
  );
};

export default Signup;
