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
    { name: "Fees & Dues", href: "/payments", icon: CreditCard },
    { name: "CRM Leads", href: "/leads", icon: Target },
    { name: "Floor Attendance", href: "/attendance", icon: Activity, badge: "LIVE" },
    { name: "Plans", href: "/plans", icon: Dumbbell },
    { name: "WhatsApp Outreach", href: "/outreach", icon: MessageCircle },
    { name: "More & Settings", href: "/more", icon: Settings },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-white dark:bg-[#14161A] border-r border-[#E5E7EB] dark:border-[#262932] shadow-[0_4px_16px_rgba(17,18,20,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#262932] flex items-center justify-between">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center space-x-3 group"
          >
            <FitnessPlanetLogo size="sm" showTagline={false} src={logoUrl} />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-[#111214] dark:text-white text-[15px] tracking-tight truncate leading-tight group-hover:text-emerald-500 transition-colors font-display">
                Fitness Planet
              </span>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase font-display">
                Unisex Gym • Sikandrabad
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-[#111214] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Status Pill */}
        <div className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#1E2128]/50 border-b border-[#E5E7EB] dark:border-[#262932] flex items-center justify-between text-xs">
          {isDemo ? (
            <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Demo Mode Active
            </span>
          ) : (
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Live Gym Cloud
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-[#111214] dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${
                  isActive
                    ? "bg-[#111214] text-white dark:bg-[#C6F459] dark:text-[#111214] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#111214] dark:hover:text-white hover:bg-[#F3F3F5] dark:hover:bg-[#1E2128]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-white dark:text-[#111214]"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-[#111214] dark:group-hover:text-white"
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
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
              Public Touchpoints
            </span>
          </div>

          {/* Public Kiosk Link */}
          <Link
            href={`/checkin/${gymSlug}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/15 border border-amber-200 dark:border-amber-500/20 transition group"
          >
            <div className="flex items-center space-x-3">
              <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Kiosk Self Check-In</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </Link>

          {/* Public Self-Admission Link */}
          <Link
            href={`/join/${gymSlug}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E5E7EB] dark:border-[#262932] transition group"
          >
            <div className="flex items-center space-x-3">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Public Admission Form</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E5E7EB] dark:border-[#262932] bg-[#F8FAFC]/90 dark:bg-[#14161A] space-y-2">
          {/* Owner Identity */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#111214] dark:text-white truncate">
                Kapil Rajput
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {userEmail || "+91 9149183060"}
              </span>
            </div>

            {/* Logout / Exit Demo */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-white/10 transition"
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
