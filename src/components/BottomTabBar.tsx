"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Target,
  Grid,
} from "lucide-react";

export function BottomTabBar() {
  const pathname = usePathname();

  // 5 destinations matching the video/HTML mockup
  const destinations = [
    {
      id: "dashboard",
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      id: "members",
      name: "Members",
      href: "/members",
      icon: Users,
      isActive: pathname.startsWith("/members"),
    },
    {
      id: "fees",
      name: "Fees",
      href: "/payments",
      icon: CreditCard,
      isActive: pathname.startsWith("/payments"),
    },
    {
      id: "leads",
      name: "Leads",
      href: "/leads",
      icon: Target,
      isActive: pathname.startsWith("/leads"),
    },
    {
      id: "more",
      name: "More",
      href: "/more",
      icon: Grid,
      isActive: pathname.startsWith("/more") || pathname.startsWith("/settings"),
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main Navigation"
      className="bottom-pill-nav lg:hidden"
      style={{
        bottom: "max(14px, env(safe-area-inset-bottom))",
      }}
    >
      {destinations.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch={true}
            aria-current={active ? "page" : undefined}
            className={`bnav-item select-none transition-all duration-200 ease-out active:scale-95 ${
              active ? "active" : ""
            }`}
          >
            <Icon className="w-4 h-4 shrink-0 stroke-[2.25]" aria-hidden="true" />
            {active && (
              <span className="leading-none tracking-tight">
                {tab.name}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
