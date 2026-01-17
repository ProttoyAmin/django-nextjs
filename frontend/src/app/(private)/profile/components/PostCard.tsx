"use client";

import Link from "next/link";
import ActivityButtons from "./ActivityButtons";
import { DiscardConfirmation } from "@/src/app/components/organisms/DiscardConfirmation";
import { useDiscardConfirmation } from "@/src/hooks/useDiscardConfirmation";
import { deletePost } from "@/src/libs/auth/post.actions";
import { useState } from "react";
import ProfileHeader from "@/src/app/components/organisms/ProfileHeader";
import MediaCarousel from "@/src/app/components/molecules/MediaCarousel";
import TextPost from "@/src/app/components/molecules/TextPost";

interface PostCardProps {
  post: any;
  showActions?: boolean;
  showActivity?: boolean;
  onDelete?: (postId: number) => void;
  isFeed?: boolean;
}

export default function PostCard({ post, showActions = false, showActivity = false, onDelete, isFeed = false }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [medias, setMedias] = useState(post.media_files ?? [])

  const handleDelete = async () => {
    setIsDeleting(true);

    if (onDelete) {
      onDelete(post.id);
    }

    try {
      const response = await deletePost(post.id);

      if (response.success) {
        console.log("Post deleted successfully");
      } else {
        console.error("Failed to delete post");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const {
    showDiscardConfirm,
    handleCloseAttempt: handleDeleteAttempt,
    handleConfirmDiscard: handleConfirmDelete,
    handleCancelDiscard
  } = useDiscardConfirmation(true, handleDelete);


  if (isDeleting) {
    return (
      <div className="bg-black-950 rounded-lg shadow-md p-6 opacity-50 transition-opacity duration-300">
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          <span className="text-gray-400 text-sm">Deleting post...</span>
        </div>
      </div>
    );
  }

  const PostWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isFeed) {
      return <Link scroll={false} href={`/p/${post.id}`} className="block">{children}</Link>;
    }
    return <Link scroll={false} href={`/p/${post.id}`} className="block">{children}</Link>;
  };

  // Text-only posts
  if (post.content && post.content.length > 0 && medias.length === 0) {
    return (
      <>
        <div className="flex justify-between items-center bg-black-950 rounded-lg hover:shadow-lg transition-shadow">
          <ProfileHeader post={post} showActions={showActions} onDelete={handleDeleteAttempt} disabled={isDeleting} />
        </div>
        <PostWrapper>
          <TextPost content={post.content} />
        </PostWrapper>
        <div className="flex justify-between items-center bg-black-950 rounded-lg hover:shadow-lg transition-shadow">
          {showActivity && <ActivityButtons post={post} size={20} />}
        </div>
        <DiscardConfirmation
          isOpen={showDiscardConfirm}
          onCancel={handleCancelDiscard}
          onConfirm={handleConfirmDelete}
        />
      </>
    )
  }

  // Media posts (with or without content)
  return (
    <>
      <div className="flex justify-between items-center bg-black-950 rounded-lg hover:shadow-lg transition-shadow">
        <ProfileHeader post={post} showActions={showActions} onDelete={handleDeleteAttempt} disabled={isDeleting} />
      </div>
      <PostWrapper>
        <MediaCarousel medias={medias} content={post.content} />
      </PostWrapper>
      <div className="flex justify-between items-center bg-black-950 rounded-lg hover:shadow-lg transition-shadow">
        {showActivity && <ActivityButtons post={post} size={20} />}
      </div>
      <DiscardConfirmation
        isOpen={showDiscardConfirm}
        onCancel={handleCancelDiscard}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}