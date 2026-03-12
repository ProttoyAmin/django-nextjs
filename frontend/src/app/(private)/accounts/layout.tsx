// app/(private)/accounts/layout.tsx
"use client";

import React from "react";
import AuthGuard from "../../components/AuthGuard";
import AccountSidebar from "../../components/organisms/AccountSidebar";
import { EditIcon, LockIcon } from "../../components/atoms/Icons";
import { GraduationCapIcon } from "lucide-react";

const accountNavItems = [
  {
    id: "edit-profile",
    label: "Edit Profile",
    href: "/accounts/edit",
    icon: <EditIcon size={20} />,
  },
  {
    id: "privacy",
    label: "Account Privacy",
    href: "/accounts/privacy",
    icon: <LockIcon size={20} />,
  },
  {
    id: "institute",
    label: "Institute",
    href: "/accounts/institute",
    icon: <GraduationCapIcon size={20} />,
  },
];

export default function AccountsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-64 shrink-0">
              <AccountSidebar items={accountNavItems} />
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <div className="bg-background rounded-lg shadow-md p-4 sm:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
