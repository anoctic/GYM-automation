import React from "react";

interface FitnessPlanetLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  showTagline?: boolean;
}

export function FitnessPlanetLogo({
  size = "md",
  className = "",
  showTagline = true,
}: FitnessPlanetLogoProps) {
  let dimension = 120;
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
        dimension = 110;
        break;
      case "xl":
        dimension = 160;
        break;
    }
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label="Fitness Planet Unisex Gym Logo"
    >
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="fpGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="fpOrangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="fpPlanetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="40%" stopColor="#047857" />
            <stop offset="80%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          <linearGradient id="fpBarbellGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="fpPlateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="fpRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <filter id="fpGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Aura */}
        <circle
          cx="150"
          cy="150"
          r="140"
          fill="#06101e"
          stroke="url(#fpGoldGrad)"
          strokeWidth="3.5"
        />
        <circle
          cx="150"
          cy="150"
          r="133"
          fill="none"
          stroke="#ea580c"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
        />

        {/* Industrial Gear Teeth on Top Arch */}
        <g opacity="0.35" stroke="url(#fpGoldGrad)" strokeWidth="2" fill="none">
          <circle cx="150" cy="150" r="126" strokeDasharray="3 9" strokeWidth="6" />
        </g>

        {/* Laurel Wreaths (Left & Right) */}
        <g stroke="url(#fpGoldGrad)" strokeWidth="1.8" fill="none" opacity="0.85">
          {/* Left Laurel Leaves */}
          <path d="M 45 155 Q 38 120 62 85" />
          <path d="M 48 140 Q 35 132 44 125" fill="#f59e0b" fillOpacity="0.4" />
          <path d="M 52 120 Q 38 112 49 105" fill="#f59e0b" fillOpacity="0.4" />
          <path d="M 58 100 Q 46 92 58 87" fill="#f59e0b" fillOpacity="0.4" />
          <path d="M 68 82 Q 58 75 70 72" fill="#f59e0b" fillOpacity="0.4" />

          {/* Right Laurel Leaves */}
          <path d="M 255 155 Q 262 120 238 85" />
          <path d="M 252 140 Q 265 132 256 125" fill="#f59e0b" fillOpacity="0.4" />
          <path d="M 248 120 Q 262 112 251 105" fill="#f59e0b" fillOpacity="0.4" />
          <path d="M 242 100 Q 254 92 242 87" fill="#f59e0b" fillOpacity="0.4" />
          <path d="M 232 82 Q 242 75 230 72" fill="#f59e0b" fillOpacity="0.4" />
        </g>

        {/* Arched Top Header: FITNESS */}
        <path id="fpFitnessArc" d="M 55 105 A 110 110 0 0 1 245 105" fill="none" />
        <text
          fill="url(#fpOrangeGrad)"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="28"
          letterSpacing="4"
          filter="url(#fpGlow)"
        >
          <textPath href="#fpFitnessArc" startOffset="50%" textAnchor="middle">
            FITNESS
          </textPath>
        </text>

        {/* Central Planet Sphere */}
        <circle
          cx="150"
          cy="150"
          r="48"
          fill="url(#fpPlanetGrad)"
          stroke="url(#fpGoldGrad)"
          strokeWidth="2"
        />

        {/* Planet Surface Continents / Grid */}
        <ellipse cx="150" cy="150" rx="48" ry="18" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <line x1="150" y1="102" x2="150" y2="198" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

        {/* 3-Plate Barbell Shaft Through the Planet */}
        {/* Left Shaft */}
        <rect x="36" y="147.5" width="70" height="5" fill="url(#fpBarbellGrad)" rx="1.5" />
        {/* Right Shaft */}
        <rect x="194" y="147.5" width="70" height="5" fill="url(#fpBarbellGrad)" rx="1.5" />

        {/* Left Weight Plates (3 Plates) */}
        <rect x="52" y="125" width="8" height="50" fill="url(#fpPlateGrad)" stroke="url(#fpGoldGrad)" strokeWidth="1.2" rx="2" />
        <rect x="63" y="128" width="7" height="44" fill="url(#fpPlateGrad)" stroke="url(#fpGoldGrad)" strokeWidth="1" rx="1.5" />
        <rect x="73" y="132" width="6" height="36" fill="url(#fpPlateGrad)" stroke="url(#fpGoldGrad)" strokeWidth="1" rx="1.5" />
        {/* Left Collar */}
        <rect x="82" y="145" width="4" height="10" fill="#f59e0b" rx="1" />

        {/* Right Weight Plates (3 Plates) */}
        {/* Right Collar */}
        <rect x="214" y="145" width="4" height="10" fill="#f59e0b" rx="1" />
        <rect x="221" y="132" width="6" height="36" fill="url(#fpPlateGrad)" stroke="url(#fpGoldGrad)" strokeWidth="1" rx="1.5" />
        <rect x="230" y="128" width="7" height="44" fill="url(#fpPlateGrad)" stroke="url(#fpGoldGrad)" strokeWidth="1" rx="1.5" />
        <rect x="240" y="125" width="8" height="50" fill="url(#fpPlateGrad)" stroke="url(#fpGoldGrad)" strokeWidth="1.2" rx="2" />

        {/* Planet Orbital Rings (Tilted) */}
        <ellipse
          cx="150"
          cy="150"
          rx="76"
          ry="20"
          fill="none"
          stroke="url(#fpGoldGrad)"
          strokeWidth="3.5"
          transform="rotate(-20 150 150)"
          strokeDasharray="280 20"
        />

        {/* Male & Female Flexing Muscular Silhouettes */}
        {/* Male Silhouette (Left) */}
        <g fill="url(#fpOrangeGrad)" opacity="0.95">
          {/* Head */}
          <circle cx="118" cy="115" r="5" />
          {/* Neck & Torso */}
          <path d="M 115 121 Q 120 120 123 121 L 126 136 Q 118 138 112 136 Z" />
          {/* Left Flexed Bicep */}
          <path d="M 113 123 Q 104 117 101 123 Q 100 131 106 130 Q 111 128 114 125 Z" />
          {/* Forearm & Fist Upward */}
          <path d="M 101 123 Q 97 114 99 108 Q 104 108 104 114 Q 103 120 101 123 Z" />
        </g>

        {/* Female Silhouette (Right) */}
        <g fill="url(#fpGoldGrad)" opacity="0.95">
          {/* Head */}
          <circle cx="182" cy="115" r="4.8" />
          {/* Torso & Athletic Waist */}
          <path d="M 178 121 Q 182 120 185 121 L 187 136 Q 182 137 175 136 Z" />
          {/* Right Flexed Arm */}
          <path d="M 186 123 Q 195 117 198 123 Q 199 130 193 130 Q 188 128 186 125 Z" />
          {/* Forearm & Fist */}
          <path d="M 198 123 Q 202 114 200 108 Q 195 108 196 114 Q 197 120 198 123 Z" />
        </g>

        {/* Center Banner: PLANET */}
        <g filter="url(#fpGlow)">
          <rect
            x="70"
            y="172"
            width="160"
            height="26"
            rx="6"
            fill="url(#fpRibbonGrad)"
            stroke="url(#fpGoldGrad)"
            strokeWidth="1.5"
          />
          <text
            x="150"
            y="190"
            textAnchor="middle"
            fill="url(#fpGoldGrad)"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="15"
            letterSpacing="3"
          >
            PLANET
          </text>
        </g>

        {/* Subtitle: GYM & HEALTH CLUB */}
        <text
          x="150"
          y="207"
          textAnchor="middle"
          fill="#cbd5e1"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="7.5"
          letterSpacing="1.8"
        >
          GYM &amp; HEALTH CLUB • SIKANDRABAD
        </text>

        {/* Bottom Curved Ribbon: STRONG IS UNIVERSAL */}
        {showTagline && (
          <g>
            <path
              d="M 60 230 Q 150 258 240 230 L 235 250 Q 150 274 65 250 Z"
              fill="url(#fpOrangeGrad)"
              stroke="url(#fpGoldGrad)"
              strokeWidth="1.2"
            />
            <path id="fpTaglineArc" d="M 68 243 Q 150 266 232 243" fill="none" />
            <text
              fill="#070a0f"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="9"
              letterSpacing="2.2"
            >
              <textPath href="#fpTaglineArc" startOffset="50%" textAnchor="middle">
                ★ STRONG IS UNIVERSAL ★
              </textPath>
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
