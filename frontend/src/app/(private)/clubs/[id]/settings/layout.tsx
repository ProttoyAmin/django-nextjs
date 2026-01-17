"use client";

import React, { use } from "react";
import SettingsTabsWrapper from "./SettingsTabsWrapper";
import ClubHeader from "../components/ClubHeader";
import Navbar from "@/src/app/components/organisms/Navbar";
import Guard from "../../components/Guard";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <Guard>
        {/* Column 1: Main Navigation */}
        <div className="w-full h-20 ">
          <Navbar type="club" />
        </div>
        <div className="flex h-screen overflow-hidden">
          {/* Column 2: Settings Sidebar */}
          <div className="min-w-[300px] border-r border-gray-800 flex flex-col shrink-0 bg-black overflow-y-auto">
            <div className="p-6 pb-2">
              <div className="flex flex-col items-center justify-center rounded-lg p-4 mb-6">
                <ClubHeader />
              </div>
            </div>

            <div className="flex-1 relative">
              <SettingsTabsWrapper clubId={id} />
            </div>
          </div>

          {/* Column 3: Main Content */}
          <main className="flex-1 overflow-y-auto bg-black p-8 md:p-14">
            <div className="max-w-2xl mx-auto">{children}</div>
          </main>

          {/* Column 4: Modal */}
          <div className="w-[250px] border-l border-gray-800 flex flex-col shrink-0 bg-black overflow-y-auto">
            rightbar section
          </div>
        </div>
      </Guard>
    </>
  );
}
