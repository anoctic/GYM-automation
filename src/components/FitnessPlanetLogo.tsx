import React from "react";

interface FitnessPlanetLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  showTagline?: boolean;
}

export function FitnessPlanetLogo({
  size = "md",
  className = "",
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

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 rounded-full overflow-hidden border border-amber-500/30 bg-[#080d16] shadow-md shadow-amber-950/30 group ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label="Fitness Planet Unisex Gym Logo"
    >
      <img
        src="/fitness-planet-logo.jpg"
        alt="Fitness Planet Unisex Gym Logo"
        className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
}
