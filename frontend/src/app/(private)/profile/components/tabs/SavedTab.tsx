// components/profile/tabs/SavedTab.tsx
"use client";
import { Bookmark } from "lucide-react";

interface SavedTabProps {
  userId: number | string;
  username: string;
  canViewPosts: boolean;
  isCurrentUser: boolean;
}

export default function SavedTab({
  userId,
  username,
  canViewPosts,
  isCurrentUser,
}: SavedTabProps) {
  // Saved posts are only visible to the current user
  if (!isCurrentUser) {
    return null;
  }

  return (
    <div className="bg-transparent rounded-lg shadow-md p-12 text-center flex flex-col items-center">
      <div className="mb-4">
        <Bookmark size={100} />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Saved Posts
      </h3>
      <p className="text-muted-foreground">
        Posts you save will appear here
      </p>
    </div>
  );
}

