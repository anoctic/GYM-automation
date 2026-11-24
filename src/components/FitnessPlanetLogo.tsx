import React from "react";

interface FitnessPlanetLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  showTagline?: boolean;
  src?: string | null;
}

export function FitnessPlanetLogo({
  size = "md",
  className = "",
  src,
}: FitnessPlanetLogoProps) {
  let dimension = 72;
  if (typeof size === "number") {
    dimension = size;
  } else {
    switch (size) {
      case "xs":
        dimension = 36;
        break;
      case "sm":
        dimension = 48;
        break;
      case "md":
        dimension = 72;
        break;
      case "lg":
        dimension = 120;
        break;
      case "xl":
        dimension = 200;
        break;
    }
  }

  const logoSrc = src || "/fitness-planet-logo.png";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 group ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label="Fitness Planet Unisex Gym Logo"
    >
      <img
        src={logoSrc}
        alt="Fitness Planet Unisex Gym Logo"
        className="w-full h-full object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
}
