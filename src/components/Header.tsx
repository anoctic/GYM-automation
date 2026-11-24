"use client";

import React from "react";
import Link from "next/link";
import { Menu, QrCode, Sun, Moon, Sparkles, ShieldCheck, Dumbbell, ExternalLink } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { FitnessPlanetLogo } from "./FitnessPlanetLogo";

interface HeaderProps {
  gymName?: string;
  gymSlug?: string;
  logoUrl?: string | null;
  isDemo?: boolean;
  onOpenSidebar: () => void;
  onToggleDemo?: () => void;
}

export function Header({
  gymName = "Fitness Planet Unisex Gym",
  gymSlug = "fitness-planet-sikandrabad",
  logoUrl,
  isDemo = false,
  onOpenSidebar,
  onToggleDemo,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-sidebar/90 backdrop-blur-md border-b border-theme flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Hamburger & Brand Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-muted-theme hover:text-main hover:bg-surface transition"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden flex items-center space-x-2">
          <FitnessPlanetLogo size="xs" showTagline={false} src={logoUrl} />
          <span className="font-extrabold text-sm text-main truncate max-w-[170px] sm:max-w-xs">
            Fitness Planet
          </span>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className="font-bold text-main">{gymName}</span>
          <span className="text-dim-theme">•</span>
          <span className="text-muted-theme">Sikandrabad, UP</span>
          <span className="text-dim-theme">•</span>
          <span className="text-emerald-400 font-mono text-[11px]">Owner: Kapil Rajput</span>
        </div>
      </div>

      {/* Right: Actions, Demo Badge, Theme Toggle, Kiosk Pill */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {isDemo ? (
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 shrink-0" />
              Demo Mode
            </span>
            {onToggleDemo && (
              <button
                onClick={onToggleDemo}
                className="hidden sm:inline-block text-[11px] text-muted-theme hover:text-main underline"
              >
                Exit
              </button>
            )}
          </div>
        ) : (
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Verified Cloud
          </span>
        )}

        {/* Public Kiosk Shortcut Button */}
        <Link
          href={`/checkin/${gymSlug}`}
          target="_blank"
          className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center shadow-sm shadow-emerald-900/30"
          title="Open Front-Desk Self Check-In Kiosk"
        >
          <QrCode className="w-3.5 h-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Kiosk</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-theme hover:text-main hover:bg-surface border border-subtle-theme transition"
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500" />
          )}
        </button>
      </div>
    </header>
  );
}
