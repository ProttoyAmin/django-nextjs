"use client";

import { useState } from "react";
import Feed from "@/src/app/components/organisms/Feed";
import { Home, Users, Globe } from "lucide-react";

/**
 * TabbedFeed Component
 *
 * Note: This component is currently a placeholder for future feed filtering.
 * The Feed component now shows all posts by default.
 *
 * To implement different feed types in the future:
 * 1. Add feedType prop back to Feed component
 * 2. Create separate API endpoints for each feed type
 * 3. Update the Feed component to handle different feed types
 */

type FeedTab = "all" | "following" | "public";

export default function TabbedFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("all");

  const tabs = [
    { id: "all" as FeedTab, label: "All Posts", icon: <Home size={20} /> },
    {
      id: "following" as FeedTab,
      label: "Following",
      icon: <Users size={20} />,
    },
    { id: "public" as FeedTab, label: "Public", icon: <Globe size={20} /> },
  ];

  return (
    <>
      <section className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="flex">
            {tabs.map((tab) => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center border-b-2 border-transparent justify-center gap-2 px-6 py-4 font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "text-blue-500 border-b-2 border-blue-500 bg-blue-500/10"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed Content */}
        <div className="p-4">
          {/* Future implementation note */}
          {activeTab !== "all" && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>Note:</strong> Feed filtering by "
                {tabs.find((t) => t.id === activeTab)?.label}" will be
                implemented in a future update. Currently showing all posts.
              </p>
            </div>
          )}
          {/* Currently showing all posts regardless of tab */}
          {/* TODO: Implement feed filtering based on activeTab */}
          <Feed key={activeTab} />
        </div>
      </section>
    </>
  );
}
