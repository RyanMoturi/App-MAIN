let googleMapsPromise;

export const hasGoogleMapsKey = () =>
  Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim());

export const loadGoogleMaps = () => {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return Promise.reject(
      new Error("VITE_GOOGLE_MAPS_API_KEY has not been configured.")
    );
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__fundiLinkGoogleMapsReady";
    const existingScript = document.querySelector(
      'script[data-fundi-link-google-maps="true"]'
    );

    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    if (existingScript) {
      existingScript.addEventListener("error", () => {
        reject(new Error("Google Maps could not be loaded."));
      });
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      callback: callbackName,
      loading: "async",
      libraries: "places",
      v: "weekly",
    });
    const script = document.createElement("script");

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.fundiLinkGoogleMaps = "true";
    script.onerror = () => {
      delete window[callbackName];
      googleMapsPromise = undefined;
      reject(new Error("Google Maps could not be loaded."));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const reverseGeocodeCoordinates = async ({ latitude, longitude }) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Valid coordinates are required.");
  }

  const maps = await loadGoogleMaps();
  const { Geocoder } = await maps.importLibrary("geocoding");
  const geocoder = new Geocoder();
  const { results = [] } = await geocoder.geocode({
    location: { lat, lng },
  });

  const result = results[0];
  if (!result) throw new Error("No address was found for this location.");

  return {
    address: result.formatted_address,
    latitude: lat,
    longitude: lng,
    placeId: result.place_id || "",
  };
};
