"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Button from "@/src/app/components/atoms/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfilePictureForm from "@/src/app/components/molecules/ProfilePictureForm";
import {
  Settings,
  Plus,
  GraduationCapIcon,
  MapPinIcon,
  CalendarIcon,
} from "lucide-react";
import ShowFollowButtons from "@/src/app/components/organisms/ShowFollowButtons";
import FollowButtons from "./FollowButtons";
import SizeAvatars from "@/src/app/components/organisms/Avatar";
import { UserType } from "@/types";
import { LockIcon } from "@/src/app/components/atoms/Icons";

interface ProfileCardProps {
  user: UserType;
  isCurrentUser: boolean;
  isAuthenticated?: boolean;
  onProtectedAction?: (
    action: () => Promise<void>,
    actionName?: string
  ) => void;
  type?: "card" | "main";
}

export default function ProfileCard({
  user,
  isCurrentUser,
  isAuthenticated = false,
  onProtectedAction,
  type = "main",
}: ProfileCardProps) {
  const router = useRouter();
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const pfpSettings = () => {
    if (isCurrentUser) {
      setShowProfilePictureModal(true);
    }
  };

  const closeProfilePictureModal = () => {
    setShowProfilePictureModal(false);
  };

  if (type === "main") {
    return (
      <>
        <div className="rounded-lg mb-6">
          <div className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative shrink-0">
              {user && (
                <button
                  className={`cursor-pointer ${
                    isCurrentUser ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() => {
                    if (isCurrentUser) {
                      pfpSettings();
                    } else if (!isAuthenticated) {
                      onProtectedAction?.(async () => {},
                      "view profile picture");
                    }
                  }}
                >
                  <SizeAvatars
                    user={user}
                    size={200}
                    badge
                    status={
                      (user?.status as "online" | "away" | "dnd") || "online"
                    }
                    isCurrentUser={isCurrentUser}
                  />
                </button>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold mb-2.5">
                    {user?.first_name && user?.last_name
                      ? `${user?.first_name} ${user?.last_name}`
                      : user?.username}
                  </h1>
                  {user?.is_private && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <LockIcon size={16} />
                      Private Account
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {isCurrentUser ? (
                    <>
                      <Link href="/clubs/create" className="w-full sm:w-auto">
                        <Button
                          name="Create Club"
                          variant="primary"
                          fullWidth={true}
                          size="squared"
                          icon={<Plus />}
                        />
                      </Link>
                      <Link href="/accounts/edit/" className="w-full sm:w-auto">
                        <Button
                          name="Edit Profile"
                          variant="primary"
                          fullWidth={true}
                          size="squared"
                          icon={<Settings />}
                        />
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="w-full sm:w-auto">
                        {/* <FollowButtons
                        targetUser={user}
                        isAuthenticated={isAuthenticated}
                        onProtectedAction={onProtectedAction}
                        fullWidth={true}
                        size="default"
                        showConfirmOnUnfollow={true}
                      /> */}
                        <ShowFollowButtons
                          targetId={user?.id}
                          variant="secondary"
                          size="default"
                        />
                      </div>
                      {user?.is_following && (
                        <div className="w-full sm:w-auto">
                          <Button
                            name="Message"
                            variant="secondary"
                            size="default"
                            onClick={() => {
                              if (!isAuthenticated) {
                                onProtectedAction?.(async () => {}, "message");
                                return;
                              }
                              router.push(`/messages/${user?.username}`);
                            }}
                            fullWidth={true}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 mb-4 text-sm sm:text-base">
                <div>
                  <span className="font-bold">
                    {user?.user_post_count || 0}
                  </span>
                  <span className="ml-1">Posts</span>
                </div>
                {user?.is_following || !user?.is_private || isCurrentUser ? (
                  <Link
                    href={`/${user?.username}/followers`}
                    className="transition-all"
                    scroll={false}
                    onClick={() => {
                      if (
                        !isAuthenticated &&
                        !user?.is_following &&
                        user?.is_private &&
                        !isCurrentUser
                      ) {
                        onProtectedAction?.(async () => {}, "view followers");
                        return;
                      }
                    }}
                  >
                    <span className="font-bold">
                      {user?.follower_count || 0}
                    </span>
                    <span className="ml-1">Followers</span>
                  </Link>
                ) : (
                  <span className="text-gray-400 cursor-default">
                    <span className="font-bold">
                      {user?.follower_count || 0}
                    </span>
                    <span className="ml-1">Followers</span>
                  </span>
                )}

                {user?.is_following || !user?.is_private || isCurrentUser ? (
                  <Link
                    href={`/${user?.username}/following`}
                    className="transition-all"
                    scroll={false}
                    onClick={() => {
                      if (
                        !isAuthenticated &&
                        !user?.is_following &&
                        user?.is_private &&
                        !isCurrentUser
                      ) {
                        onProtectedAction?.(async () => {}, "view following");
                        return;
                      }
                    }}
                  >
                    <span className="font-bold">
                      {user?.following_count || 0}
                    </span>
                    <span className="ml-1">Following</span>
                  </Link>
                ) : (
                  <span className="text-gray-400 cursor-default">
                    <span className="font-bold">
                      {user?.following_count || 0}
                    </span>
                    <span className="ml-1">Following</span>
                  </span>
                )}

                {!user?.is_private || user?.is_following || isCurrentUser ? (
                  <Link
                    href={`/${user?.username}/clubs`}
                    className="transition-all"
                    onClick={(e) => {
                      if (
                        !isAuthenticated &&
                        !user?.is_following &&
                        user?.is_private &&
                        !isCurrentUser
                      ) {
                        e.preventDefault();
                        onProtectedAction?.(async () => {}, "view clubs");
                      }
                    }}
                  >
                    <span className="font-bold">{user?.club_count || 0}</span>
                    <span className="ml-1">Clubs</span>
                  </Link>
                ) : (
                  <span className="text-gray-400 cursor-default">
                    <span className="font-bold">{user?.club_count || 0}</span>
                    <span className="ml-1">Clubs</span>
                  </span>
                )}
              </div>

              {user?.bio && (
                <p className="text-sm sm:text-base text-gray-700 mb-3 leading-relaxed text-center sm:text-left">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                {user?.department && (
                  <span className="flex items-center gap-1">
                    <GraduationCapIcon className="w-4 h-4 text-gray-400" />{" "}
                    {user.department}
                    {user.year && ` • Year ${user.year}`}
                  </span>
                )}
                {user?.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />{" "}
                    {user.location}
                  </span>
                )}

                {user?.created_at && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4 text-gray-400" /> Joined{" "}
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isCurrentUser && (
            <>
              <div className="bodrer border-amber-400">
                <ProfilePictureForm
                  isOpen={showProfilePictureModal}
                  onClose={closeProfilePictureModal}
                  currentPicture={user?.profile_picture_url}
                />
              </div>
            </>
          )}
        </div>
      </>
    );
  }
}
