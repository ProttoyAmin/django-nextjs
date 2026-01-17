'use client'

import getTimeAgo from "@/src/libs/utils/helpers";
import { PostType } from "@/src/types/post";
import Image from "next/image";
import Link from "next/link";
import Button from "../atoms/Button";
import { Edit2, Edit, Edit3, Trash2, X } from "lucide-react";
import { Comment, UserType } from "@/types";
import ShowComment from "../molecules/ShowComment";
import React from "react";
import { useAppSelector } from "@/src/redux-store";
import Badge from "../atoms/Badge";
import { cn } from "@/lib/utils";
import SizeAvatars from "./Avatar";

// interface roleProps {
//   name: string,
//   permissions: {
//     can_manage_events: boolean,
//     can_manage_members: boolean,
//     can_manage_posts: boolean,
//     can_manage_settings: boolean
//   }
// }

function capitalizeFirstLetter(str: string) {
  if (!str) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export interface ImageFor {
  username: string;
  profile_picture_url?: string;
}

interface headerProps {
  imageFor?: ImageFor;
  post?: PostType;
  comment?: Comment;
  for?: 'post' | 'comment' | 'reply' | 'profile' | 'event' | 'club';
  clubId?: string;
  reply?: Comment;
  showActions?: boolean;
  onDelete?: () => void;
  onClose?: () => void;
  disabled?: boolean;
  onReplyClick?: () => void;
  postId?: string | number;
  size?: 'default' | 'sm' | 'md' | 'lg';
}

function ProfileHeader({
  imageFor,
  post,
  comment,
  showActions,
  onDelete,
  onClose,
  disabled,
  onReplyClick,
  postId,
  for: type = 'profile',
  clubId,
  reply,
  size = 'default'
}: headerProps) {

  if (imageFor && !post && !comment && !clubId) {
    return (
      <div className={`relative flex items-center gap-2 ${size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-12 h-12' : size === 'lg' ? 'w-40 h-40' : 'w-8 h-8'}`}>
        <Image
          src={
            imageFor?.profile_picture_url
              ? imageFor.profile_picture_url
              : `https://api.dicebear.com/7.x/initials/svg?seed=${imageFor?.username}`
          }
          alt={`${imageFor?.username}`}
          width={30}
          height={30}
          className={cn('rounded-full object-cover', size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-12 h-12' : size === 'lg' ? 'w-40 h-40' : 'w-8 h-8')}
        />
        {/* <span className="text-xs font-semibold absolute top-0 left-10">{imageFor?.username}</span> */}
      </div>
    );
  }

  if (type === 'reply') {
    return (
      <div className="w-10 h-10 rounded-full">
        <SizeAvatars user={{
          username: reply?.author_username,
          profile_picture_url: reply?.author_avatar
        } as UserType} size={40} badgeSize='8px' />
      </div>
    );
  }

  if (type === 'club') {
    let displayUser = imageFor;

    if (post) {

      displayUser = {
        username: post.author_username,
        profile_picture_url: post.author_avatar
      };
    }

    return (
      <>
        <div className="flex items-center gap-2">
          <SizeAvatars user={displayUser as UserType} size={40} badgeSize='8px' />
          {/* <Image
            src={
              displayUser?.profile_picture_url
                ? displayUser.profile_picture_url
                : `https://api.dicebear.com/7.x/initials/svg?seed=${displayUser?.username}`
            }
            alt={`${displayUser?.username}`}
            width={30}
            height={30}
            className="rounded-full object-cover w-8 h-8"
          /> */}
          <span className="font-semibold text-sm">{displayUser?.username}</span>
          {post?.is_owner && (
            <Badge
              text="Owner"
              color="white"
              size="sm"
            />
          )}
        </div>
      </>
    )
  }



  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        {post && (
          <div className="flex items-center gap-3">
            <SizeAvatars user={{
              username: post?.author_username,
              profile_picture_url: post?.author_avatar
            } as UserType} size={40} badgeSize='8px' />
            <div className="flex flex-col">
              <p className="text-md font-semibold">
                {capitalizeFirstLetter(post?.author_username || "")}
              </p>
              <p className="text-xs text-gray-400">
                {getTimeAgo(post?.created_at?.toString() || "")}
              </p>
            </div>
          </div>
        )}

        {comment && (
          <div className="flex items-start gap-3 w-full">

            <SizeAvatars user={{
              username: comment?.author_username,
              profile_picture_url: comment?.author_avatar
            } as UserType} size={40} badgeSize='8px' />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/${comment?.author_username}`}>
                  <p className="text-xs font-bold text-gray-200 hover:text-white">
                    {capitalizeFirstLetter(comment?.author_username || "")}
                  </p>
                </Link>
              </div>
              <ShowComment comment={comment} onReplyClick={onReplyClick} postId={postId!} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          {showActions && (
            <>
              <Button
                icon={<Trash2 size={16} />}
                variant="ghostDanger"
                size="md"
                onClick={onDelete}
                disabled={disabled}
              />
              <Button
                icon={<Edit3 size={16} />}
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={disabled}
              />
            </>
          )}
          {onClose && (
            <Button
              name=""
              icon={<X size={16} />}
              onClick={onClose}
              variant="ghost"
              size="md"
            />
          )}
        </div>
      </div>
    </>
  );
}

export default React.memo(ProfileHeader);
