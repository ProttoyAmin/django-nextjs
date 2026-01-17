'use client'

import { togglePostLike, sharePost, repost, toggleCommentLike } from '@/src/libs/auth/post.actions';
import Link from 'next/link'
import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  ShareIcon,
  Trash2
} from 'lucide-react';
import Button from '@/src/app/components/atoms/Button';
import { PostType } from '@/src/types/post';
import { Comment } from '@/types';

interface ActivityProps {
  post?: PostType;
  comment?: Comment;
  postId?: number | string;
  className?: string;
  size?: number;
  showDeleteButton?: boolean;
  onCommentLikeToggle?: (commentId: number | string, isLiked: boolean, likeCount: number) => void;
  showCounts?: boolean;
  onDelete?: (postId: number | string, commentId?: number | string) => void;
}

function ActivityButtons({ post, comment, postId, className, size = 10, onCommentLikeToggle, showCounts, showDeleteButton, onDelete }: ActivityProps) {
  const [postLikeState, setPostLikeState] = useState({
    isLiked: post?.is_liked || false,
    likeCount: post?.like_count || 0,
    isLoading: false,
  });
  const [commentLikeState, setCommentLikeState] = useState({
    isLiked: comment?.is_liked || false,
    likeCount: comment?.like_count || 0,
    isLoading: false,
  });
  const [respostState, setRespostState] = useState({

  })

  const handleAction = async (actionType: string = 'like') => {
    setPostLikeState((prev) => ({ ...prev, isLoading: true }));

    if (actionType === 'like') {
      try {
        const result = await togglePostLike(post!.id);
        if (result.success) {
          setPostLikeState({
            isLiked: result.data.is_liked,
            likeCount: result.data.like_count,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error toggling like:", error);
        setPostLikeState((prev) => ({ ...prev, isLoading: false }));
      }
    } else if (actionType === 'repost') {
      try {
        // const result = await repost(post.id);
        // if (result.success) {
        //   setRespostState({
        //     repostCount: result.data.repost_count,
        //     isLoading: false,
        //   });
        // }
      } catch (error) {
        console.error('Error toggling repost:', error)
      }
    } else if (actionType === 'comment_like') {
      try {
        const actualPostId = postId || post?.id;
        if (!actualPostId || !comment?.id) {
          console.error('Missing postId or commentId');
          return;
        }

        const result = await toggleCommentLike(actualPostId, comment.id as number);
        if (result.success) {
          const newIsLiked = result.data.is_liked;
          const newLikeCount = result.data.like_count;

          setCommentLikeState({
            isLiked: newIsLiked,
            likeCount: newLikeCount,
            isLoading: false,
          });

          if (onCommentLikeToggle) {
            onCommentLikeToggle(comment.id, newIsLiked, newLikeCount);
          }
        }
      } catch (error) {
        console.error("Error toggling comment like:", error);
        setCommentLikeState((prev) => ({ ...prev, isLoading: false }));
      }
    }
  };

  return (
    <>
      {post && (
        <div className="flex flex-col">
          <div className="flex items-center gap-6 pt-4 border-gray-200">
            <button
              onClick={() => { handleAction('like') }}
              disabled={postLikeState.isLoading}
              className="flex items-center gap-2 hover:scale-110 transition-all cursor-pointer"
            >
              <Heart
                size={size}
                className={`${postLikeState.isLiked ? "fill-red-500 text-red-500" : ""}`}
                fill={postLikeState.isLiked ? "currentColor" : "none"}
              />
              <span>{postLikeState.likeCount}</span>
            </button>

            <Link
              href={`/p/${post?.id}`}
              className="flex items-center gap-2 hover:scale-110 transition-all"
            >
              <MessageCircle size={size} />
              <span>{post?.comment_count || 0}</span>
            </Link>

            <button onClick={() => { handleAction('repost') }} className="flex items-center gap-2 hover:scale-110 transition-all cursor-pointer">
              <ShareIcon size={size} />
              <span>{post?.share_count || 0}</span>
            </button>

            <div className="">
              <Button
                name=""
                icon={<Bookmark size={size} />}
                variant="ghost"
                size="sm"
                className="min-h-0 p-0 hover:bg-transparent"
              />
            </div>
          </div>
          {showCounts && (
            <div className='pb-2'>
              <p className='text-sm font-semibold'>{postLikeState.likeCount} {postLikeState.likeCount < 2 ? 'like' : 'likes'}</p>
            </div>
          )}
        </div>
      )}

      {comment && (
        <div className="flex items-center gap-2">
          {showDeleteButton && (
            <Button
              name=""
              disabled={commentLikeState.isLoading}
              icon={<Trash2 size={size} />}
              onClick={() => onDelete?.(postId!, comment.id)}
              variant="ghostDanger"
              size="sm"
              className="min-h-0 p-0 hover:bg-transparent"
            />
          )}
          <Button
            name=""
            onClick={() => { handleAction('comment_like') }}
            disabled={commentLikeState.isLoading}
            icon={<Heart size={size} className={`${className} ${commentLikeState.isLiked ? "fill-red-500 text-red-500" : ""}`} fill={commentLikeState.isLiked ? "currentColor" : "none"} />}
            variant="ghost"
            size="sm"
            className="min-h-0 p-0 hover:bg-transparent"
          />
        </div>
      )}
    </>
  )
}

export default React.memo(ActivityButtons)