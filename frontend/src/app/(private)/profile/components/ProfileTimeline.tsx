// components/profile/ProfileTimeline.tsx
"use client";

import { useState, useMemo } from "react";
import PostsTab from "./tabs/PostsTab";
import ReelsTab from "./tabs/ReelsTab";
import SavedTab from "./tabs/SavedTab";

interface ProfileTimelineProps {
  userId: number | string;
  username: string;
  canViewPosts: boolean;
  isCurrentUser: boolean;
  isAuthenticated?: boolean;
  onProtectedAction?: (
    action: () => Promise<void>,
    actionName?: string,
  ) => void;
}

type TabType = "posts" | "reels" | "saved";

export default function ProfileTimeline({
  userId,
  username,
  canViewPosts,
  isCurrentUser,
  isAuthenticated = false,
  onProtectedAction,
}: ProfileTimelineProps) {
  const [activeTab, setActiveTab] = useState<TabType>("posts");

  const tabs = useMemo(() => {
    const tabList: { id: TabType; label: string }[] = [
      { id: "posts", label: "Posts" },
      { id: "reels", label: "Reels" },
    ];

    if (isCurrentUser) {
      tabList.push({ id: "saved", label: "Saved" });
    }

    return tabList;
  }, [isCurrentUser]);

  const renderTabContent = () => {
    const commonProps = {
      userId,
      username,
      canViewPosts,
      isCurrentUser,
      isAuthenticated,
      onProtectedAction,
    };

    switch (activeTab) {
      case "posts":
        return <PostsTab {...commonProps} />;
      case "reels":
        return <ReelsTab {...commonProps} />;
      case "saved":
        return <SavedTab {...commonProps} />;
      default:
        return <PostsTab {...commonProps} />;
    }
  };

  console.log(canViewPosts, isCurrentUser);

  if (!canViewPosts && !isCurrentUser) {
    return (
      <div className="rounded-lg shadow-md p-12 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">This Account is Private</h3>
        <p className="mb-4">Follow @{username} to see their content</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg shadow-md mb-4 p-2 flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "saved" && !isCurrentUser) return;

              if (!isAuthenticated && tab.id !== "posts") {
                onProtectedAction?.(
                  async () => setActiveTab(tab.id),
                  "switch tab",
                );
                return;
              }

              setActiveTab(tab.id);
            }}
            className={`flex-1 py-2 px-4 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-grey hover:bg-white hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{renderTabContent()}</div>
    </div>
  );
}
