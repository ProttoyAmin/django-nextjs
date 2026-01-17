"use client";

import Loader from "@/src/app/components/atoms/Loader";
import FeedPosts from "@/src/app/components/molecules/FeedPosts";
import { getClubPosts } from "@/src/libs/auth/actions/clubPost.acions";
import { PostType } from "@/src/types/post";
import React, { useEffect, useState } from "react";
import ClubFeed from "./ClubFeed";
import { useAppDispatch, useAppSelector } from "@/src/redux-store";
import { setClubPosts } from "@/src/redux-store/slices/post";

interface ListClubPostsProps {
  clubId: string | number;
}

function ListClubPosts({ clubId }: ListClubPostsProps) {
  const dispatch = useAppDispatch();
  const { clubEntities, clubIds, currentClubId } = useAppSelector(
    (state) => state.post
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const posts = clubIds.map((id) => clubEntities[id]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (currentClubId === clubId && posts.length > 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getClubPosts(clubId, 1);
        if (response.success) {
          dispatch(setClubPosts({ posts: response.data.results, clubId }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [clubId, dispatch, currentClubId]);

  return (
    <div>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="my-20">
          <FeedPosts posts={posts} type="club" clubId={clubId} />
          {/* <ClubFeed posts={posts} clubId={clubId} /> */}
        </div>
      )}
    </div>
  );
}

export default ListClubPosts;
