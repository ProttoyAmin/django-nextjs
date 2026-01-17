"use client";

import React from "react";

interface LoaderProps {
  loading?: boolean;
  skeleton?: boolean;
  type?:
    | "full"
    | "profile"
    | "post"
    | "minimal"
    | "home"
    | "settings"
    | "text"
    | "card"
    | "list"
    | "notification"
    | "message"
    | "sidebar"
    | "form";
  count?: number; // Number of skeleton items to show
  className?: string; // Additional className
}

const Loader: React.FC<LoaderProps> = ({
  loading = true,
  skeleton = false,
  type = "minimal",
  count = 3,
  className = "",
}) => {
  if (!loading) return null;

  // Progress bar (always shown when loading) - theme aware
  const ProgressBar = () => (
    <div className="fixed top-0 left-0 w-full h-[3px] z-50 bg-gray-200/50 dark:bg-gray-800/50 overflow-hidden">
      <div className="h-full bg-foreground animate-progress"></div>
      <style jsx global>{`
        @keyframes progress {
          0% {
            width: 0%;
            left: 0%;
          }
          50% {
            width: 60%;
            left: 20%;
          }
          100% {
            width: 0%;
            left: 100%;
          }
        }
        .animate-progress {
          position: absolute;
          top: 0;
          left: 0;
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  // Skeleton components - theme aware
  const SkeletonBox = ({ className = "" }: { className?: string }) => (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    ></div>
  );

  const SkeletonCircle = ({ size = "w-12 h-12" }: { size?: string }) => (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full ${size}`}
    ></div>
  );

  // Home Feed Skeleton
  if (skeleton && type === "home") {
    return (
      <>
        {/* <ProgressBar /> */}
        <div className={`space-y-6 ${className}`}>
          {/* Stories/Header Section */}
          <div className="flex gap-4 overflow-hidden pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 min-w-16"
              >
                <SkeletonCircle size="w-16 h-16" />
                <SkeletonBox className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Feed Posts */}
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-lg shadow-md p-6 bg-card">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <SkeletonCircle size="w-12 h-12" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="h-3 w-20" />
                  </div>
                  <SkeletonBox className="h-3 w-24" />
                </div>
                <SkeletonBox className="h-6 w-6" />
              </div>

              {/* Post Content */}
              <div className="space-y-3 mb-4">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-5/6" />
                <SkeletonBox className="h-4 w-4/6" />
              </div>

              {/* Post Media */}
              <SkeletonBox className="h-80 w-full mb-4" />

              {/* Post Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <SkeletonBox className="h-6 w-16" />
                  <SkeletonBox className="h-6 w-16" />
                  <SkeletonBox className="h-6 w-16" />
                </div>
                <SkeletonBox className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Profile Skeleton
  if (skeleton && type === "profile") {
    return (
      <>
        {/* <ProgressBar /> */}
        <div className={`min-h-screen bg-background ${className}`}>
          <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Profile Header */}
            <div className="p-6 rounded-lg shadow-md mb-6 bg-card">
              <div className="flex items-start gap-6">
                <SkeletonCircle size="w-32 h-32" />
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <SkeletonBox className="h-8 w-48" />
                      <SkeletonBox className="h-4 w-32" />
                    </div>
                    <div className="flex gap-2">
                      <SkeletonBox className="h-10 w-24" />
                      <SkeletonBox className="h-10 w-24" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="text-center">
                        <SkeletonBox className="h-6 w-16 mb-1" />
                        <SkeletonBox className="h-4 w-12" />
                      </div>
                    ))}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-3/4" />
                  </div>

                  {/* Details */}
                  <div className="flex gap-4 flex-wrap">
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="h-4 w-24" />
                    <SkeletonBox className="h-4 w-28" />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-border mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBox
                  key={i}
                  className="h-12 flex-1 mx-2 first:ml-0 last:mr-0"
                />
              ))}
            </div>

            {/* Profile Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: count }).map((_, i) => (
                <SkeletonBox key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Settings Skeleton
  if (skeleton && type === "settings") {
    return (
      <>
        {/* <ProgressBar /> */}
        <div className={`max-w-4xl mx-auto p-6 space-y-8 ${className}`}>
          {/* Header */}
          <div className="space-y-2">
            <SkeletonBox className="h-8 w-48" />
            <SkeletonBox className="h-4 w-64" />
          </div>

          {/* Settings Sections */}
          {Array.from({ length: count }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              {/* Section Header */}
              <SkeletonBox className="h-6 w-32" />

              {/* Settings Items */}
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between p-4 rounded-lg bg-card"
                  >
                    <div className="space-y-2 flex-1">
                      <SkeletonBox className="h-5 w-40" />
                      <SkeletonBox className="h-4 w-64" />
                    </div>
                    <SkeletonBox className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Text Skeleton
  if (skeleton && type === "text") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-5/6" />
            <SkeletonBox className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    );
  }

  // Card Skeleton
  if (skeleton && type === "card") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-lg shadow-md p-6 bg-card">
            <div className="flex items-center gap-4 mb-4">
              <SkeletonCircle size="w-12 h-12" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-5 w-32" />
                <SkeletonBox className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-3">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-5/6" />
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <SkeletonBox className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List Skeleton
  if (skeleton && type === "list") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg bg-card"
          >
            <SkeletonCircle size="w-12 h-12" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-5 w-40" />
              <SkeletonBox className="h-3 w-24" />
            </div>
            <SkeletonBox className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Notification Skeleton
  if (skeleton && type === "notification") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-lg bg-card"
          >
            <SkeletonCircle size="w-10 h-10" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-3 w-32" />
            </div>
            <SkeletonBox className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Message Skeleton
  if (skeleton && type === "message") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => {
          const isOwn = i % 2 === 0;
          return (
            <div
              key={i}
              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {!isOwn && <SkeletonCircle size="w-8 h-8" />}
              <div className={`space-y-2 max-w-xs ${isOwn ? "ml-auto" : ""}`}>
                <SkeletonBox
                  className={`h-20 rounded-2xl ${
                    isOwn ? "rounded-br-md" : "rounded-bl-md"
                  }`}
                />
                <SkeletonBox className={`h-3 w-16 ${isOwn ? "ml-auto" : ""}`} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Sidebar Skeleton
  if (skeleton && type === "sidebar") {
    return (
      <div className={`space-y-6 p-4 bg-card rounded-lg ${className}`}>
        {/* User Profile */}
        <div className="flex items-center gap-3 p-2">
          <SkeletonCircle size="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-3 w-16" />
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded">
              <SkeletonBox className="h-5 w-5" />
              <SkeletonBox className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Groups/Communities */}
        <div className="pt-4 border-t border-border">
          <SkeletonBox className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <SkeletonCircle size="w-8 h-8" />
                <SkeletonBox className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Form Skeleton
  if (skeleton && type === "form") {
    return (
      <div className={`space-y-6 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="h-12 w-full rounded-lg" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <SkeletonBox className="h-10 w-24 rounded-lg" />
          <SkeletonBox className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    );
  }

  // Post Skeleton (existing)
  if (skeleton && type === "post") {
    return (
      <>
        {/* <ProgressBar /> */}
        <div className={`space-y-4 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-lg shadow-md p-6 bg-card">
              <div className="flex items-center gap-4 mb-4">
                <SkeletonCircle size="w-12 h-12" />
                <div className="flex-1 space-y-2">
                  <SkeletonBox className="h-4 w-32" />
                  <SkeletonBox className="h-3 w-24" />
                </div>
              </div>
              <SkeletonBox className="h-48 w-full mb-4" />
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Full page skeleton (existing)
  if (skeleton && type === "full") {
    return (
      <>
        {/* <ProgressBar /> */}
        <div className={`min-h-screen bg-background p-8 ${className}`}>
          <div className="max-w-4xl mx-auto space-y-6">
            <SkeletonBox className="h-12 w-64" />
            <div className="space-y-4">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <SkeletonBox className="h-6 w-full" />
                  <SkeletonBox className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Minimal loader (just progress bar) - default
  return;
};

export default React.memo(Loader);
