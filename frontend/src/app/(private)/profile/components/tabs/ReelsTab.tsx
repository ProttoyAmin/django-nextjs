// components/profile/tabs/ReelsTab.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getUserPosts } from "@/src/libs/auth/actions/user.actions";
import Loader from "@/src/app/components/atoms/Loader";
import PostCard from "../PostCard";
import { PostType } from "@/src/types/post";
import { Video } from 'lucide-react'

interface ReelsTabProps {
  userId: number | string;
  username: string;
  canViewPosts: boolean;
  isCurrentUser: boolean;
}

export default function ReelsTab({
  userId,
  username,
  canViewPosts,
  isCurrentUser,
}: ReelsTabProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!canViewPosts && !isCurrentUser) {
      setIsLoading(false);
      setError("You must follow this user to view their reels.");
      setPosts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("userId: ", userId)
      const result = await getUserPosts(userId, "VIDEO", "user", page);
      console.log("reel data: ", result.data)
      if (result.success) {
        if (page === 1) {
          setPosts(result.data.results || []);
        } else {
          setPosts((prev) => [...prev, ...(result.data.results || [])]);
        }
        setHasMore(!!result.data.next);
      } else {
        setError("Failed to load reels.");
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
      setError("An error occurred while loading reels.");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, page, canViewPosts, isCurrentUser]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const prevCanViewPostsRef = useRef(canViewPosts);
  useEffect(() => {
    const prevCanView = prevCanViewPostsRef.current;
    if (!prevCanView && canViewPosts && !isCurrentUser) {
      setPage(1);
      setPosts([]);
      setError(null);
    }
    prevCanViewPostsRef.current = canViewPosts;
  }, [canViewPosts, isCurrentUser]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

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
        <h3 className="text-xl font-semibold mb-2">
          This Account is Private
        </h3>
        <p className="mb-4">
          Follow @{username} to see their reels
        </p>
      </div>
    );
  }

  if (isLoading && page === 1) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="bg-transparent rounded-lg shadow-md p-12 text-center">
        <p className="text-foreground">Please login to unlock their full potential</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg shadow-md p-12 text-center flex flex-col items-center">
        <div className="mb-4">
          <Video size={100} />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Reels Yet
        </h3>
        <p className="text-muted-foreground">
          {isCurrentUser
            ? "Start creating reels to share your moments!"
            : `@${username} hasn't created any reels yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showActions={isCurrentUser} />
      ))}

      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}