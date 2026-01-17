"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/src/redux-store";
import {
  selectPostCommentById,
  updatePostCommentLike,
  selectClubCommentById,
  updateClubPostCommentLike,
} from "@/src/redux-store/slices/comment";
import Button from "../atoms/Button";
import {
  Heart,
  MessageCircle,
  Repeat,
  Repeat1,
  Repeat2,
  RepeatIcon,
  Send,
} from "lucide-react";
import {
  togglePostLike,
  toggleCommentLike,
} from "@/src/libs/auth/post.actions";
import {
  updatePostLike,
  updateClubPostLike,
} from "@/src/redux-store/slices/post";
import Link from "next/link";

interface ShowActionsProps {
  postId?: string | number;
  commentId?: string | number;
  size?: number;
  showCounts?: boolean;
  club?: boolean;
}

function ShowActions({
  postId,
  commentId,
  size,
  showCounts = false,
  club,
}: ShowActionsProps) {
  const dispatch = useAppDispatch();
  const currentClubId = useAppSelector((state) => state.post.currentClubId);

  const targetPostById = useAppSelector((state) => {
    if (!postId) return undefined;
    return club ? state.post.clubEntities[postId] : state.post.entities[postId];
  });

  const targetCommentById = useAppSelector((state) => {
    if (!commentId) return undefined;
    if (club && currentClubId) {
      return selectClubCommentById(state, currentClubId, commentId);
    }
    if (postId) {
      return selectPostCommentById(state, postId, commentId);
    }
    return undefined;
  });

  const handleAction = async (actionType: string) => {
    if (actionType === "post_like") {
      console.log(`toggled like for this post ${postId}`);
      try {
        const response = await togglePostLike(postId!);
        if (response.success) {
          console.log("response success");
          if (club) {
            dispatch(updateClubPostLike({ postId: postId! }));
          } else {
            dispatch(updatePostLike({ postId: postId! }));
          }
        }
      } catch (error) {
        if (club) {
          dispatch(updateClubPostLike({ postId: postId! }));
        } else {
          dispatch(updatePostLike({ postId: postId! }));
        }
        console.error("Error toggling like:", error);
      }
    }

    if (actionType === "comment_like") {
      try {
        const response = await toggleCommentLike(postId!, commentId as number);
        console.log("Comment like response:", response);
        if (response.success) {
          console.log("response success");
          if (club && currentClubId) {
            dispatch(
              updateClubPostCommentLike({
                clubId: currentClubId,
                commentId: commentId!,
              })
            );
          } else {
            dispatch(
              updatePostCommentLike({ postId: postId!, commentId: commentId! })
            );
          }
        }
      } catch (error) {
        console.error("Error toggling comment like:", error);
      }
    }

    if (actionType === "repost") {
      console.log("repost");
    }
  };

  if (postId && !commentId) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            name=""
            onClick={() => handleAction("post_like")}
            icon={
              <Heart
                size={size}
                className={`${
                  targetPostById?.is_liked ? "fill-red-500 text-red-500" : ""
                } hover:scale-110 transition-all`}
                fill={targetPostById?.is_liked ? "currentColor" : "none"}
                stroke={targetPostById?.is_liked ? "currentColor" : "white"}
              />
            }
            variant="default"
            size="sm"
            className="min-h-0 p-0 hover:bg-transparent w-10 h-10"
          />
          {showCounts && <span>{targetPostById?.like_count}</span>}
        </div>
        <Link href={`/p/${postId}`} className="flex items-center gap-1">
          <Button
            name=""
            onClick={() => handleAction("comment_like")}
            icon={
              <MessageCircle
                size={size}
                stroke="white"
                className="hover:scale-110 transition-all"
              />
            }
            variant="default"
            size="sm"
            className="min-h-0 p-0 hover:bg-transparent w-10 h-10"
          />
          {showCounts && <span>{targetPostById?.comment_count}</span>}
        </Link>
        <div className="flex items-center gap-1">
          <Button
            name=""
            onClick={() => handleAction("repost")}
            icon={
              <Repeat2
                size={size}
                stroke="white"
                className="hover:scale-110 transition-all"
              />
            }
            variant="default"
            size="sm"
            className="min-h-0 p-0 hover:bg-transparent w-10 h-10"
          />
          {showCounts && <span>{targetPostById?.repost_count}</span>}
        </div>
        <Button
          name=""
          onClick={() => handleAction("share")}
          icon={
            <Send
              size={size}
              stroke="white"
              className="hover:scale-110 transition-all"
            />
          }
          variant="default"
          size="sm"
          className="min-h-0 p-0 hover:bg-transparent w-10 h-10"
        />
      </div>
    );
  }

  if (commentId) {
    return (
      <div className="flex items-center gap-2">
        <Button
          name=""
          onClick={() => handleAction("comment_like")}
          icon={
            <Heart
              size={size}
              className={`${
                targetCommentById?.is_liked ? "fill-red-500 text-red-500" : ""
              } hover:scale-110 transition-all`}
              fill={targetCommentById?.is_liked ? "currentColor" : "none"}
              stroke={targetCommentById?.is_liked ? "currentColor" : "white"}
            />
          }
          variant="default"
          size="sm"
          className="min-h-0 p-0 hover:bg-transparent"
        />
        {showCounts && <span>{targetCommentById?.like_count}</span>}
      </div>
    );
  }
}

export default ShowActions;
