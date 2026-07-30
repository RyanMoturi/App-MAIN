import React, { useEffect, useRef, useState } from "react";
import { hasGoogleMapsKey, loadGoogleMaps } from "../utils/googleMaps";
import { hasCoordinates } from "../utils/location";

const configuredRegions = (
  import.meta.env.VITE_GOOGLE_MAPS_REGION_CODES || "ke"
)
  .split(",")
  .map((code) => code.trim().toLowerCase())
  .filter(Boolean);

const LocationAutocomplete = ({
  value,
  onTextChange,
  onPlaceSelect,
  placeholder = "Start typing your building or address",
  bias,
  disabled = false,
  className = "",
  required = false,
  id,
}) => {
  const hostRef = useRef(null);
  const autocompleteRef = useRef(null);
  const callbacksRef = useRef({ onTextChange, onPlaceSelect });
  const initialOptionsRef = useRef({ bias, disabled, value });
  const [status, setStatus] = useState(
    hasGoogleMapsKey() ? "loading" : "fallback"
  );

  callbacksRef.current = { onTextChange, onPlaceSelect };

  useEffect(() => {
    if (!hasGoogleMapsKey()) return undefined;

    let disposed = false;
    let autocomplete;

    const initialise = async () => {
      try {
        const maps = await loadGoogleMaps();
        const { PlaceAutocompleteElement } =
          await maps.importLibrary("places");

        if (disposed || !hostRef.current) return;

        autocomplete = new PlaceAutocompleteElement();
        autocomplete.id = id || "";
        autocomplete.placeholder = placeholder;
        autocomplete.value = initialOptionsRef.current.value || "";
        autocomplete.disabled = initialOptionsRef.current.disabled;
        autocomplete.className = "google-place-autocomplete";

        if (configuredRegions.length) {
          autocomplete.includedRegionCodes = configuredRegions;
        }

        if (hasCoordinates(initialOptionsRef.current.bias)) {
          autocomplete.locationBias = {
            center: {
              lat: Number(initialOptionsRef.current.bias.latitude),
              lng: Number(initialOptionsRef.current.bias.longitude),
            },
            radius: 5000,
          };
        }

        const handleInput = () => {
          callbacksRef.current.onTextChange?.(autocomplete.value || "");
        };

        const handleSelect = async ({ placePrediction }) => {
          try {
            const place = placePrediction.toPlace();
            await place.fetchFields({
              fields: ["id", "displayName", "formattedAddress", "location"],
            });

            const location = place.location;
            if (!location) return;

            const selected = {
              address:
                place.formattedAddress ||
                place.displayName ||
                autocomplete.value ||
                "",
              latitude: location.lat(),
              longitude: location.lng(),
              placeId: place.id || "",
            };

            autocomplete.value = selected.address;
            callbacksRef.current.onTextChange?.(selected.address);
            callbacksRef.current.onPlaceSelect?.(selected);
          } catch (error) {
            console.error("Could not read the selected address.", error);
          }
        };

        autocomplete.addEventListener("input", handleInput);
        autocomplete.addEventListener("gmp-select", handleSelect);
        hostRef.current.replaceChildren(autocomplete);
        autocompleteRef.current = autocomplete;
        setStatus("ready");
      } catch (error) {
        console.error(error);
        if (!disposed) setStatus("fallback");
      }
    };

    initialise();

    return () => {
      disposed = true;
      autocompleteRef.current = null;
      autocomplete?.remove();
    };
  }, [id, placeholder]);

  useEffect(() => {
    const autocomplete = autocompleteRef.current;
    if (autocomplete && autocomplete.value !== (value || "")) {
      autocomplete.value = value || "";
    }
  }, [value]);

  useEffect(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    autocomplete.disabled = disabled;
    autocomplete.locationBias = hasCoordinates(bias)
      ? {
          center: {
            lat: Number(bias.latitude),
            lng: Number(bias.longitude),
          },
          radius: 5000,
        }
      : null;
  }, [bias, disabled]);

  if (status === "fallback") {
    return (
      <div>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onTextChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="street-address"
          className={className}
        />
        {!hasGoogleMapsKey() && (
          <p className="mt-1 text-xs text-amber-700">
            Address suggestions need the Google Maps key to be configured.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={hostRef}
        className={`location-autocomplete-host ${className}`}
      >
        {status === "loading" && (
          <div className="px-3 py-3 text-sm text-gray-500">
            Loading address suggestions…
          </div>
        )}
      </div>
      {required && <input tabIndex="-1" className="sr-only" value={value} readOnly required />}
    </div>
  );
};

export default LocationAutocomplete;
