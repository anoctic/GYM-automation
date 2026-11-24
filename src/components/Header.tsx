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
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#14161A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Circle Menu & Brand Title (Matching Video) */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden circle-icon-btn"
          aria-label="Open Navigation Menu"
          title="Menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        <div className="min-w-0 flex flex-col justify-center">
          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mb-0.5">
            Welcome back, Kapil
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[170px] sm:max-w-xs leading-tight">
              Fitness Planet Unisex Gym
            </span>
            <span className="owner-pill shrink-0">Owner</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, Kiosk Pill, Lime Bell */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {isDemo && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3 h-3 mr-1 shrink-0" />
            Demo Mode
          </span>
        )}

        {/* Public Kiosk Shortcut Button */}
        <Link
          href={`/checkin/${gymSlug}`}
          target="_blank"
          className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 hover:opacity-90 transition items-center shadow-xs"
          title="Open Front-Desk Self Check-In Kiosk"
        >
          <QrCode className="w-3.5 h-3.5 sm:mr-1.5 text-[var(--lime)]" />
          <span>Kiosk</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Electric Lime Bell Button with Red Unread Dot */}
        <Link
          href="/notifications"
          className="lime-bell-btn"
          title="Notifications & Alerts"
        >
          <span>🔔</span>
          <span className="bell-dot"></span>
        </Link>
      </div>
    </header>
  );
}
