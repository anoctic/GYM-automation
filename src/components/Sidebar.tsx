"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FitnessPlanetLogo } from "./FitnessPlanetLogo";
import { useTheme } from "./ThemeProvider";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Dumbbell,
  UserCheck,
  Target,
  MessageCircle,
  Settings,
  QrCode,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  LogOut,
  X,
  Phone,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  gymName?: string;
  gymSlug?: string;
  logoUrl?: string | null;
  isDemo?: boolean;
  userEmail?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleDemo?: () => void;
  onSignOut?: () => void;
}

export function Sidebar({
  gymName = "Fitness Planet Unisex Gym",
  gymSlug = "fitness-planet-sikandrabad",
  logoUrl,
  isDemo = false,
  userEmail = "owner@fitnessplanet.in",
  isOpen,
  onClose,
  onToggleDemo,
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Members", href: "/members", icon: Users },
    { name: "Payments & Dues", href: "/payments", icon: CreditCard },
    { name: "Floor Attendance", href: "/attendance", icon: Activity, badge: "LIVE" },
    { name: "Membership Plans", href: "/plans", icon: Dumbbell },
    { name: "Admissions", href: "/admissions", icon: UserCheck },
    { name: "CRM Leads", href: "/leads", icon: Target },
    { name: "WhatsApp Outreach", href: "/outreach", icon: MessageCircle },
    { name: "Settings & Admin", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-white/85 dark:bg-[#0b0f17]/95 backdrop-blur-2xl border-r border-slate-200/70 dark:border-white/10 shadow-sm flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center space-x-3 group"
          >
            <FitnessPlanetLogo size="sm" showTagline={false} src={logoUrl} />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-main text-sm tracking-tight truncate leading-tight group-hover:text-emerald-500 transition-colors">
                Fitness Planet
              </span>
              <span className="text-[11px] font-semibold text-amber-500 tracking-wider uppercase">
                Unisex Gym • Sikandrabad
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-muted-theme hover:text-main hover:bg-surface transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Status Pill */}
        <div className="px-4 py-2 bg-surface/50 border-b border-subtle-theme flex items-center justify-between text-xs">
          {isDemo ? (
            <span className="inline-flex items-center text-amber-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Demo Mode Active
            </span>
          ) : (
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Live Gym Cloud
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1 rounded-md text-muted-theme hover:text-main hover:bg-surface transition"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-500" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href)) ||
              (item.href === "/attendance" && pathname.startsWith("/floor"));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30"
                    : "text-muted-theme hover:text-main hover:bg-surface"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-emerald-400"
                        : "text-muted-theme group-hover:text-main"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 pb-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-dim-theme">
              Public Touchpoints
            </span>
          </div>

          {/* Public Kiosk Link */}
          <Link
            href={`/checkin/${gymSlug}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition group"
          >
            <div className="flex items-center space-x-3">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Kiosk Self Check-In</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </Link>

          {/* Public Self-Admission Link */}
          <Link
            href={`/join/${gymSlug}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-theme hover:text-main hover:bg-surface transition group"
          >
            <div className="flex items-center space-x-3">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Public Admission Form</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-theme bg-surface/40 space-y-2">
          {/* Owner Identity */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-main truncate">
                Kapil Rajput
              </span>
              <span className="text-[10px] text-dim-theme truncate">
                {userEmail || "+91 9149183060"}
              </span>
            </div>

            {/* Logout / Exit Demo */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-muted-theme hover:text-red-400 hover:bg-surface transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
