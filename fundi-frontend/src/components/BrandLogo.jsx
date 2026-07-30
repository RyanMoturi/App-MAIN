import React from "react";

const BrandLogo = ({ className = "h-11 w-11", showWordmark = true }) => (
  <span className="inline-flex items-center gap-3">
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="FundiLink"
    >
      <defs>
        <linearGradient id="fundiLinkGradient" x1="8" y1="8" x2="56" y2="58">
          <stop stopColor="#16a34a" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <path
        fill="url(#fundiLinkGradient)"
        d="M32 3C18.2 3 7 14.2 7 28c0 17.7 22.1 31.1 23 31.7a3.5 3.5 0 0 0 4 0c.9-.6 23-14 23-31.7C57 14.2 45.8 3 32 3Z"
      />
      <circle cx="32" cy="27" r="16" fill="#fff" opacity=".96" />
      <path
        d="m23 37 8.2-8.2m2.2-8.8a7 7 0 0 0 8.6 8.6l-9.8 9.8a4 4 0 1 1-5.6-5.6l9.8-9.8A7 7 0 0 0 33.4 20Z"
        fill="none"
        stroke="#14532d"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    {showWordmark && (
      <span className="leading-none">
        <span className="block text-xl font-extrabold tracking-tight text-gray-950">
          Fundi<span className="text-green-600">Link</span>
        </span>
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Skills close to home
        </span>
      </span>
    )}
  </span>
);

export default BrandLogo;
