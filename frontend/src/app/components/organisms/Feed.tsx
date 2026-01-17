"use client";

import { getFeed } from "@/src/libs/auth/post.actions";
import React from "react";
import FeedPosts from "../molecules/FeedPosts";
import Loader from "../atoms/Loader";
import { useAppDispatch } from "@/src/redux-store";
import { setFeedPosts } from "@/src/redux-store/slices/post";
import { PostType } from "@/src/types/post";
import { getMutualConnections } from "@/src/libs/auth/actions/follow.actions";
import { setMutualConnections } from "@/src/redux-store/slices/follow";

function Feed() {
  const [posts, setPosts] = React.useState<PostType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    setIsLoading(true);
    const fetchPosts = async () => {
      try {
        const response = await getFeed();
        if (response.success && response.data.results) {
          dispatch(setFeedPosts(response.data.results));
          setPosts(response.data.results);
        } else {
          setError(response.errors?.detail || "Failed to fetch posts");
        }
      } catch (error: any) {
        setError(error.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    // const fetchMutualConnections = async () => {
    //   try {
    //     const response = await getMutualConnections();
    //     if (response.success && response.data) {
    //       dispatch(setMutualConnections(response.data.results));
    //     } else {
    //       console.error("Failed to fetch mutual connections:", response.errors);
    //     }
    //   } catch (error: any) {
    //     console.error("Error fetching mutual connections:", error);
    //   }
    // };

    fetchPosts();
    // fetchMutualConnections();
  }, [dispatch]);

  return (
    <>{isLoading ? <Loader /> : <FeedPosts posts={posts} type="user" />}</>
  );
}

export default React.memo(Feed);
