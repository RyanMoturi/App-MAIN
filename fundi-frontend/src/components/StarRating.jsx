import React, { useState } from "react";

const StarRating = ({
  value = 0,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = false,
}) => {
  const [hovered, setHovered] = useState(0);
  const displayedValue = hovered || Number(value) || 0;
  const sizeClass =
    size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-2xl";
  const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`flex gap-1 ${sizeClass}`}
        role={readOnly ? "img" : "radiogroup"}
        aria-label={readOnly ? `${value} out of 5 stars` : "Choose a rating"}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            role={readOnly ? undefined : "radio"}
            aria-checked={readOnly ? undefined : Number(value) === star}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onFocus={() => !readOnly && setHovered(star)}
            onBlur={() => setHovered(0)}
            onClick={() => !readOnly && onChange?.(star)}
            className={`leading-none ${
              readOnly
                ? "cursor-default"
                : "cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-amber-400 hover:scale-110"
            } transition ${
              star <= displayedValue
                ? "text-amber-400 drop-shadow-sm"
                : "text-gray-300"
            }`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ))}
      </div>
      {showLabel && !readOnly && (
        <span className="text-sm font-medium text-gray-600">
          {displayedValue
            ? `${displayedValue} out of 5 — ${labels[displayedValue]}`
            : "Select a rating"}
        </span>
      )}
    </div>
  );
};

export default StarRating;
