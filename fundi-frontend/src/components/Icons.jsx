import React from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

export const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const ToolIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m14.7 6.3 3 3" />
    <path d="m4 20 6.2-6.2" />
    <path d="M15 4a5 5 0 0 0 5 5l-8.8 8.8a3 3 0 1 1-4.2-4.2L15 4Z" />
  </svg>
);

export const ShieldIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-5" />
  </svg>
);

export const MessageIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.5-5A8 8 0 1 1 21 12Z" />
  </svg>
);

export const StarIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
  </svg>
);

export const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
