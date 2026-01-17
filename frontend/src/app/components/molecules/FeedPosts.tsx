"use client";

import React from "react";
import { PostType } from "@/src/types/post";
import Loader from "../atoms/Loader";
import ShowPost from "../organisms/ShowPost";
import ProfileHeader from "../organisms/ProfileHeader";
import ShowFollowButtons from "../organisms/ShowFollowButtons";
import Button from "../atoms/Button";
import { Ellipsis } from "lucide-react";
import ActivityButtons from "../../(private)/profile/components/ActivityButtons";
import Link from "next/link";
import Options from "../organisms/Options";
import { Modal } from "../organisms/Modal";
import { ModalHeader } from "../organisms/ModalHeader";
import { useAppSelector } from "@/src/redux-store";
import ShowActions from "./ShowActions";
import SizeAvatars from "../organisms/Avatar";
import { UserType } from "@/types";
import getTimeAgo from "@/src/libs/utils/helpers";
import { useRouter, useSearchParams } from "next/navigation";
import UserModalProfile from "../../(private)/clubs/[id]/components/UserModalProfile";

interface FeedPostsProps {
  posts: PostType[];
  type: "club" | "user";
  clubId?: string | number;
}

function FeedPosts({ posts, type, clubId }: FeedPostsProps) {
  const [showModal, setShowModal] = React.useState(false);
  const relationships = useAppSelector((state) => state.follow.relationships);
  const searchParams = useSearchParams();
  const modalUsername = searchParams.get("username");
  const router = useRouter();

  const feedOptions = [
    {
      name: "Report",
      onClick: () => setShowModal(true),
      variant: "ghostDanger",
    },
    {
      name: "Close",
      onClick: () => setShowModal(false),
      variant: "secondary",
    },
  ];

  // Handle loading (if needed — but you don't have actual loading state)
  // If `posts` is still being fetched upstream, parent should handle loading
  // But if you want to show loader when posts is undefined or null:
  if (!Array.isArray(posts)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">No posts yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[600px] mx-auto space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 w-full">
              <Link
                href={`?username=${post.author_username}`}
                as={`?username=${post.author_username}`}
                scroll={false}
                className="w-full"
              >
                <div className="relative flex items-center gap-2 w-full">
                  <SizeAvatars
                    user={
                      {
                        username: post.author_username,
                        profile_picture_url: post.author_avatar,
                      } as UserType
                    }
                    size={40}
                  />
                  <div className="absolute top-0 left-12 w-1/2 flex flex-col gap-1">
                    <p className="font-semibold">{post.author_username}</p>
                    {/* <Link href={`/p/${post.id}`} scroll={false}> */}
                    <p className="text-xs text-gray-500">
                      {getTimeAgo(post.created_at)}
                    </p>
                    {/* </Link> */}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <ShowFollowButtons
                  targetId={post.author_id}
                  variant="default"
                  size="default"
                />
                <Button
                  name=""
                  icon={<Ellipsis size={16} />}
                  variant="default"
                  size="md"
                  onClick={() => setShowModal(true)}
                />
              </div>
              {showModal && (
                <Modal
                  isOpen={showModal}
                  onClose={() => setShowModal(false)}
                  size="auto"
                >
                  <div className="p-2 w-[400px] flex flex-col gap-4 items-center justify-center">
                    <Options
                      items={[
                        {
                          name: "Report",
                          onClick: () => setShowModal(true),
                          variant: "ghostDanger",
                        },
                        {
                          name: "Go to post",
                          onClick: () => router.push(`/p/${post.id}`),
                          variant: "secondary",
                        },
                        {
                          name: "Close",
                          onClick: () => setShowModal(false),
                          variant: "secondary",
                        },
                      ]}
                      setAction={setShowModal}
                    />
                  </div>
                </Modal>
              )}
            </div>
            <ShowPost post={post} type="feed" />
            <ShowActions postId={post.id} showCounts />
          </div>
        ))}
      </div>

      {type === "club" && modalUsername && (
        <UserModalProfile
          username={modalUsername}
          type="club"
          clubId={clubId as string}
        />
      )}

      {type === "user" && modalUsername && (
        <UserModalProfile username={modalUsername} type="user" />
      )}
    </>
  );
}

export default React.memo(FeedPosts);
