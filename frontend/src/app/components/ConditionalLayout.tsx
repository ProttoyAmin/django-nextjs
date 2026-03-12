"use client";

import { usePathname } from "next/navigation";
import Navbar from "./organisms/Navbar";
import LeftBar from "./organisms/LeftBar";
import RightBar from "./organisms/RightBar";
import BottomBar from "./organisms/BottomBar";
import { PUBLIC_ROUTES } from "@/src/libs/constants";

import { useActivityTracker } from "@/src/hooks/useActivityTracker";
import InstituteBar from "../(private)/profile/components/InstituteBar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  useActivityTracker();
  const pathname = usePathname();
  const authRoutes = PUBLIC_ROUTES;
  const isAuthPage = authRoutes.some((route) => pathname?.startsWith(route));
  const isSettingsPage = pathname?.includes("/settings");

  if (isAuthPage) {
    return <div className="h-screen overflow-auto bg-black">{children}</div>;
  }

  if (isSettingsPage) {
    return (
      <div className="h-screen overflow-hidden bg-black text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-rows-[auto_1fr] overflow-hidden">
      <div className="w-full">{/* <Navbar /> */}</div>
      <div className="grid md:grid-cols-[94px_1fr_250px] grid-cols-1 overflow-hidden">
        <div className="overflow-y-auto border-r hidden md:block">
          <LeftBar />
        </div>
        <main className="overflow-y-auto bg-black pb-20 md:pb-0">
          <div className="">{children}</div>
        </main>
        <div className="overflow-y-auto hidden md:block">
          <RightBar />
        </div>
      </div>
      <InstituteBar />
      <div className="md:hidden">
        <BottomBar />
      </div>
    </div>
  );
}
