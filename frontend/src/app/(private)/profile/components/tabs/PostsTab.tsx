// components/profile/tabs/PostsTab.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getUserPosts } from "@/src/libs/auth/actions/user.actions";
import Loader from "@/src/app/components/atoms/Loader";
import PostCard from "../PostCard";
import { PostType } from "@/src/types/post";
import ShowPost from "@/src/app/components/organisms/ShowPost";
import { setUser, useAppDispatch, useAppSelector } from "@/src/redux-store";
import { addPost, setFeedPosts, setUserPosts } from "@/src/redux-store/slices/post";
import Link from "next/link";
import { Folder, Lock, UserLock, UserRoundX } from "lucide-react";


interface PostsTabProps {
  userId: number | string;
  username: string;
  canViewPosts: boolean;
  isCurrentUser: boolean;
}

export default function PostsTab({
  userId,
  username,
  canViewPosts,
  isCurrentUser,
}: PostsTabProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingPosts, setDeletingPosts] = useState<Set<number | string>>(new Set());
  const dispatch = useAppDispatch();
  const fetchPosts = useCallback(async () => {
    if (!canViewPosts && !isCurrentUser) {
      setIsLoading(false);
      setError("You must follow this user to view their posts.");
      setPosts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserPosts(userId, undefined, "user", page);

      if (result.success && result.data.results) {
        dispatch(setUserPosts(result.data.results))
        if (page === 1) {
          setPosts(result.data.results || []);
        } else {
          setPosts((prev) => [...prev, ...(result.data.results || [])]);
        }
        setHasMore(!!result.data.next);
      } else {
        setError("Failed to load posts.");
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("An error occurred while loading posts.");
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

  const handlePostDelete = useCallback((postId: number | string) => {
    setDeletingPosts(prev => new Set(prev).add(postId));

    setPosts(prev => prev.filter(post => post.id !== postId));

    setTimeout(() => {
      setDeletingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }, 1000);
  }, []);

  const visiblePosts = posts.filter(post => !deletingPosts.has(post.id));
  const storePosts = useAppSelector((state) => state.post.userIds.map(id => state.post.entities[id]));

  if (!canViewPosts && !isCurrentUser) {
    return (
      <div className="rounded-lg shadow-md p-12 text-center">
        <div className="mb-4">
          <UserLock size={24} />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          This Account is Private
        </h3>
        <p className="mb-4">
          Follow @{username} to see their posts
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
        <p className="text-foreground">Please login to unlock their full potential {error}</p>
      </div>
    );
  }

  if (visiblePosts.length === 0 && !isLoading) {
    return (
      <div className="rounded-lg shadow-md p-12 text-center flex flex-col items-center">
        <div className="mb-4">
          <Folder size={100} />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Posts Yet
        </h3>
        <p className="text-muted-foreground">
          {isCurrentUser
            ? "Start sharing your thoughts with the world!"
            : `@${username} hasn't posted anything yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(deletingPosts).map(postId => (
        <div key={postId} className="bg-black-950 rounded-lg shadow-md p-6 opacity-50 transition-opacity duration-300">
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <span className="text-gray-400">Deleting post...</span>
          </div>
        </div>
      ))}

      {/* {visiblePosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          showActions={isCurrentUser}
          showActivity={false}
          onDelete={handlePostDelete}
        />
      ))} */}
      <div className="grid grid-cols-3 gap-1">
        {storePosts && storePosts.map((post) => (
          <Link href={`/p/${post.id}`} key={post.id} as={`/p/${post.id}`}>
            <ShowPost
              post={post}
              type="profile"
            />
          </Link>
        ))}
      </div>

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