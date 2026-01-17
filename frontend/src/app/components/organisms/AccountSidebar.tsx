// components/organisms/AccountSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface AccountSidebarProps {
  items: NavItem[];
}

export default function AccountSidebar({ items }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-64 shrink-0 border-border bg-card rounded-lg lg:rounded-none shadow-md lg:shadow-none mb-4 lg:mb-0">
      <nav className="p-2 sm:p-4 space-y-1 sm:space-y-2">
        <h2 className="px-4 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider hidden lg:block">
          Settings
        </h2>
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all text-sm sm:text-base
                ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <span className={isActive ? "text-primary-foreground" : ""}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

