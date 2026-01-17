// components/profile/ProfileTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface ProfileTabsProps {
  username: string;
  canView: boolean;
}

export default function ProfileTabs({ username, canView }: ProfileTabsProps) {
  const pathname = usePathname();

  const tabs = useMemo(
    () => [
      { name: "Posts", href: `/${username}`, exact: true },
      { name: "Clubs", href: `/${username}/clubs` },
      { name: "Activity", href: `/${username}/activity` },
    ],
    [username]
  );

  const isActive = useMemo(
    () => (href: string, exact?: boolean) => {
      if (exact) {
        return pathname === href;
      }
      return pathname.startsWith(href);
    },
    [pathname]
  );

  if (!canView) {
    return null;
  }

  return (
    <div className="rounded-lg shadow-md mb-6">
      <nav className="flex border-gray-200">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={(e) => {
                if (active) {
                  e.preventDefault();
                }
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
                active
                  ? "border-b-2 border-white text-white-600"
                  : "text-gray-600 hover:text-white-600 hover:border-b-2 hover:border-gray-300"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}