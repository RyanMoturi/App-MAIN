import React, { useEffect, useRef, useState } from "react";
import { hasGoogleMapsKey, loadGoogleMaps } from "../utils/googleMaps";
import { hasCoordinates } from "../utils/location";

const configuredRegions = (
  import.meta.env.VITE_GOOGLE_MAPS_REGION_CODES || "ke"
)
  .split(",")
  .map((code) => code.trim().toLowerCase())
  .filter(Boolean);

const predictionText = (text) => {
  if (!text) return "";
  if (typeof text === "string") return text;
  if (typeof text.text === "string") return text.text;

  const converted = text.toString?.();
  return converted && converted !== "[object Object]" ? converted : "";
};

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
  const containerRef = useRef(null);
  const requestRef = useRef(0);
  const placesRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const selectedValueRef = useRef("");
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState(
    hasGoogleMapsKey() ? "loading" : "fallback"
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!hasGoogleMapsKey()) return undefined;

    let disposed = false;

    loadGoogleMaps()
      .then(async (maps) => {
        const places = await maps.importLibrary("places");
        if (disposed) return;

        placesRef.current = places;
        sessionTokenRef.current = new places.AutocompleteSessionToken();
        setErrorMessage("");
        setStatus("ready");
      })
      .catch((error) => {
        console.error(error);
        if (!disposed) {
          setStatus("fallback");
          setErrorMessage(
            "Address suggestions could not load. Check the Google Maps key and allowed website domains."
          );
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (selectedValueRef.current && value === selectedValueRef.current) {
      selectedValueRef.current = "";
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return undefined;
    }

    if (status !== "ready" || value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return undefined;
    }

    const requestId = ++requestRef.current;
    const timeout = window.setTimeout(async () => {
      try {
        const request = {
          input: value.trim(),
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: configuredRegions,
        };

        if (hasCoordinates(bias)) {
          request.locationBias = {
            center: {
              lat: Number(bias.latitude),
              lng: Number(bias.longitude),
            },
            radius: 50000,
          };
          request.origin = {
            lat: Number(bias.latitude),
            lng: Number(bias.longitude),
          };
        }

        const { suggestions: matches = [] } =
          await placesRef.current.AutocompleteSuggestion
            .fetchAutocompleteSuggestions(request);

        if (requestId !== requestRef.current) return;

        const predictions = matches
          .map((suggestion) => suggestion.placePrediction)
          .filter(Boolean)
          .slice(0, 8);

        setSuggestions(predictions);
        setOpen(predictions.length > 0);
        setActiveIndex(-1);
        setErrorMessage(
          predictions.length === 0
            ? "No matching places found. Add a building, estate, road or town name."
            : ""
        );
      } catch (error) {
        if (requestId !== requestRef.current) return;
        console.error("Could not load address suggestions.", error);
        setSuggestions([]);
        setOpen(false);
        setErrorMessage(
          "Address suggestions are unavailable. Please try again in a moment."
        );
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [bias, status, value]);

  const selectPrediction = async (prediction) => {
    try {
      setOpen(false);
      setActiveIndex(-1);

      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "displayName", "formattedAddress", "location"],
      });

      if (!place.location) return;

      const selected = {
        address:
          place.formattedAddress ||
          place.displayName ||
          predictionText(prediction.text),
        latitude: place.location.lat(),
        longitude: place.location.lng(),
        placeId: place.id || "",
      };

      requestRef.current += 1;
      setSuggestions([]);
      sessionTokenRef.current =
        new placesRef.current.AutocompleteSessionToken();
      selectedValueRef.current = selected.address;
      onTextChange?.(selected.address);
      onPlaceSelect?.(selected);
    } catch (error) {
      console.error("Could not read the selected address.", error);
    }
  };

  const handleKeyDown = (event) => {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current <= 0 ? suggestions.length - 1 : current - 1)
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectPrediction(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-800"
        >
          ●
        </span>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => {
            selectedValueRef.current = "";
            onTextChange?.(event.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            status === "loading" ? "Loading address search…" : placeholder
          }
          disabled={disabled}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={id ? `${id}-suggestions` : undefined}
          aria-activedescendant={
            activeIndex >= 0 && id
              ? `${id}-suggestion-${activeIndex}`
              : undefined
          }
          className={`${className} min-h-12 pl-14 pr-12`}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              requestRef.current += 1;
              setSuggestions([]);
              setOpen(false);
              onTextChange?.("");
            }}
            aria-label="Clear address"
            className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-xl font-semibold text-gray-600 hover:bg-gray-100 hover:text-black"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div
          id={id ? `${id}-suggestions` : undefined}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          {suggestions.map((prediction, index) => {
            const mainText =
              predictionText(prediction.mainText) ||
              predictionText(prediction.text);
            const secondaryText = predictionText(prediction.secondaryText);

            return (
              <button
                id={id ? `${id}-suggestion-${index}` : undefined}
                key={`${prediction.placeId}-${index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => selectPrediction(prediction)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-start gap-4 border-b border-gray-100 px-5 py-4 text-left last:border-0 ${
                  activeIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-100 text-lg"
                >
                  ●
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-gray-950">
                    {mainText}
                  </span>
                  {secondaryText && (
                    <span className="mt-0.5 block truncate text-sm text-gray-600">
                      {secondaryText}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          <div className="border-t border-gray-100 px-5 py-2 text-right text-[10px] font-semibold tracking-wide text-gray-500">
            Powered by Google
          </div>
        </div>
      )}

      {(errorMessage || (status === "fallback" && !hasGoogleMapsKey())) && (
        <p className="mt-1 text-xs text-amber-700">
          {errorMessage || "Address suggestions are temporarily unavailable."}
        </p>
      )}
    </div>
  );
};

export default LocationAutocomplete;
