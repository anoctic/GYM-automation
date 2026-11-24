"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  MessageCircle,
} from "lucide-react";

interface BottomTabBarProps {
  inboxBadgeCount?: number;
}

export function BottomTabBar({ inboxBadgeCount = 3 }: BottomTabBarProps) {
  const pathname = usePathname();

  // 4 destinations of equal importance
  const destinations = [
    {
      id: "overview",
      name: "Overview",
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
      id: "floor",
      name: "Floor Live",
      href: "/attendance",
      icon: Activity,
      isActive: pathname.startsWith("/attendance"),
    },
    {
      id: "inbox",
      name: "Inbox",
      href: "/outreach",
      icon: MessageCircle,
      isActive: pathname.startsWith("/outreach") || pathname.startsWith("/leads"),
      badgeCount: inboxBadgeCount,
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden ios-tab-bar"
      style={{
        paddingBottom: "max(0.6rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-around w-full max-w-lg mx-auto pt-1.5 px-3">
        {destinations.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={true}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative min-h-[46px] select-none transition-transform duration-100 ease-out active:scale-95 group ${
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[#8E8E93] dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-colors duration-150 ${
                    active
                      ? "stroke-[2.25] text-emerald-600 dark:text-emerald-400"
                      : "stroke-[1.75] group-hover:text-slate-700 dark:group-hover:text-slate-200"
                  }`}
                  aria-hidden="true"
                />

                {/* iOS tabBarBadge (.badge(_:)) on Inbox tab */}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2.5 px-1 min-w-[18px] h-[18px] rounded-full bg-[#FF3B30] text-white text-[10px] font-bold flex items-center justify-center shadow-xs border border-white dark:border-[#0c1017] leading-none pointer-events-none"
                    aria-label={`${tab.badgeCount} alerts`}
                  >
                    {tab.badgeCount > 99 ? "99+" : tab.badgeCount}
                  </span>
                )}
              </div>

              {/* Short Label */}
              <span
                className={`text-[10px] tracking-tight mt-1 leading-none transition-colors duration-150 ${
                  active
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : "font-normal"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
