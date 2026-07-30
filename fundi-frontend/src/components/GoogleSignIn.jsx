import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardForRole, saveAuthSession } from "../utils/authSession";

let googleScriptPromise;

const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Could not load Google sign-in"));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
};

const GoogleSignIn = ({ role = "client", label = "continue_with" }) => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

  useEffect(() => {
    if (!clientId || role === "admin") return undefined;
    let active = true;

    loadGoogleIdentity()
      .then((google) => {
        if (!active || !buttonRef.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setError("");
            try {
              const response = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential, role }),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "Google sign-in failed");
              saveAuthSession(data, role);
              navigate(dashboardForRole(role));
            } catch (err) {
              setError(err.message);
            }
          },
        });
        buttonRef.current.innerHTML = "";
        google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: label,
          width: Math.min(buttonRef.current.offsetWidth || 360, 400),
          logo_alignment: "left",
        });
      })
      .catch((err) => active && setError(err.message));

    return () => {
      active = false;
    };
  }, [clientId, label, navigate, role]);

  if (role === "admin") return null;
  if (!clientId) {
    return (
      <p className="rounded-xl bg-amber-50 p-3 text-center text-xs font-semibold text-amber-800">
        Google sign-in will appear when the Google web client ID is configured.
      </p>
    );
  }

  return (
    <div>
      <div ref={buttonRef} className="flex min-h-11 w-full justify-center" />
      {error && <p className="mt-2 text-center text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
};

export default GoogleSignIn;
