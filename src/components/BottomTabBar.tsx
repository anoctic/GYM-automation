"use client";

import React, { useEffect, useState } from "react";
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const effectivePath = pendingHref ?? pathname;

  const destinations = [
    {
      id: "dashboard",
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      isActive: effectivePath === "/",
    },
    {
      id: "members",
      name: "Members",
      href: "/members",
      icon: Users,
      isActive: effectivePath.startsWith("/members"),
    },
    {
      id: "fees",
      name: "Fees",
      href: "/payments",
      icon: CreditCard,
      isActive: effectivePath.startsWith("/payments"),
    },
    {
      id: "leads",
      name: "Leads",
      href: "/leads",
      icon: Target,
      isActive: effectivePath.startsWith("/leads"),
    },
    {
      id: "more",
      name: "More",
      href: "/more",
      icon: Grid,
      isActive:
        effectivePath.startsWith("/more") ||
        effectivePath.startsWith("/settings") ||
        effectivePath.startsWith("/plans") ||
        effectivePath.startsWith("/outreach") ||
        effectivePath.startsWith("/admissions"),
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main Navigation"
      className="bottom-pill-nav lg:!hidden"
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
            onClick={() => setPendingHref(tab.href)}
            aria-current={active ? "page" : undefined}
            className={`bnav-item select-none transition-all duration-150 ease-out active:scale-95 ${
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
