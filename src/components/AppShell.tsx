"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { signOut } from "@/actions/auth";

interface AppShellProps {
  children: React.ReactNode;
  gymName?: string;
  gymSlug?: string;
  logoUrl?: string | null;
  userEmail?: string | null;
}

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
  gymName = "Fitness Planet Unisex Gym",
  gymSlug = "fitness-planet-sikandrabad",
  logoUrl = "/fitness-planet-logo.png",
  userEmail = null,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Public/standalone routes that should NOT render the main admin shell
  const isPublicRoute =
    pathname.startsWith("/checkin") ||
    pathname.startsWith("/join") ||
    pathname === "/login";

  // Proactively warm all admin routes in the Router Cache after initial paint
  // so tapping any tab, drawer link, or Quick Action opens instantaneously.
  useEffect(() => {
    if (isPublicRoute) return;

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
