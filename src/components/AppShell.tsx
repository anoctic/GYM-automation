"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  isRouteStale,
  markDbMutated,
  recordRouteSynced,
  shouldSkipRecentLocalEcho,
} from "@/lib/realtime/syncStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { signOut } from "@/actions/auth";

interface AppShellProps {
  children: React.ReactNode;
  gymId?: string;
  gymName?: string;
  gymSlug?: string;
  logoUrl?: string | null;
  userEmail?: string | null;
}

const DEFAULT_GYM_ID = "00000000-0000-0000-0000-000000000001";
const PREFETCH_BATCH_1 = ["/", "/members", "/payments", "/leads", "/more"];
const PREFETCH_BATCH_2 = [
  "/attendance",
  "/plans",
  "/outreach",
  "/settings",
  "/notifications",
  "/admissions",
];

export function AppShell({
  children,
  gymId = DEFAULT_GYM_ID,
  gymName = "Fitness Planet Unisex Gym",
  gymSlug = "fitness-planet-sikandrabad",
  logoUrl = "/fitness-planet-logo.png",
  userEmail = null,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const isPublicRoute =
    pathname.startsWith("/checkin") ||
    pathname.startsWith("/join") ||
    pathname === "/login";

  // 1. Proactively warm admin routes in the Router Cache + immediately sync any route
  //    if a DB write occurred on another tab or via Supabase Realtime since last visit.
  useEffect(() => {
    if (isPublicRoute) return;

    if (isRouteStale(pathname)) {
      recordRouteSynced(pathname);
      router.refresh();
    } else {
      recordRouteSynced(pathname);
    }

    const timer1 = window.setTimeout(() => {
      PREFETCH_BATCH_1.forEach((route) => {
        if (route !== pathname) router.prefetch(route);
      });
    }, 80);

    const timer2 = window.setTimeout(() => {
      PREFETCH_BATCH_2.forEach((route) => {
        if (route !== pathname) router.prefetch(route);
      });
    }, 350);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
    };
  }, [isPublicRoute, pathname, router]);

  // 2. Real-time WebSocket sync across all tables via Supabase Realtime + tab focus sync
  useEffect(() => {
    if (isPublicRoute || !gymId) return;

    const supabase = createClient();
    let refreshTimer: number | null = null;
    let lastFocusRefreshAt = Date.now();

    const scheduleRealtimeRefresh = () => {
      markDbMutated();
      if (shouldSkipRecentLocalEcho()) return;

      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        recordRouteSynced(pathnameRef.current);
        router.refresh();
      }, 150);
    };

    const channel = supabase
      .channel(`gymos-realtime-${gymId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `gym_id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `gym_id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs", filter: `gym_id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads", filter: `gym_id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admissions", filter: `gym_id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "membership_plans", filter: `gym_id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gym_staff", filter: `gym_id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gyms", filter: `id=eq.${gymId}` },
        scheduleRealtimeRefresh
      )
      .subscribe();

    const handleResumeSync = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastFocusRefreshAt < 2500) return;
      lastFocusRefreshAt = now;
      recordRouteSynced(pathnameRef.current);
      router.refresh();
    };

    window.addEventListener("focus", handleResumeSync);
    document.addEventListener("visibilitychange", handleResumeSync);

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", handleResumeSync);
      document.removeEventListener("visibilitychange", handleResumeSync);
      supabase.removeChannel(channel);
    };
  }, [gymId, isPublicRoute, router]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPublicRoute) {
    return (
      <main className="min-h-screen bg-app text-main flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-app text-main flex">
      {/* 260px Left Fixed Sidebar */}
      <Sidebar
        gymName={gymName}
        gymSlug={gymSlug}
        logoUrl={logoUrl}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area (Offset by 260px on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        <Header
          gymName={gymName}
          gymSlug={gymSlug}
          logoUrl={logoUrl}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation Bar (Mobile / Tablet) */}
      <BottomTabBar />
    </div>
  );
}
