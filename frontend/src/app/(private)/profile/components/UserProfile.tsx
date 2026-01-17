"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Button from "@/src/app/components/atoms/Button";
import { PlusIcon, SettingsIcon } from "@/src/app/components/atoms/Icons";
import { Settings, Plus } from "lucide-react";

interface UserProfileProps {
  user: any;
  errorMessage: any;
  currentUser: any;
  isCurrentUser: boolean;
  isFollowing: boolean;
  followStatus: string | null;
  followLoading: boolean;
  handleFollowToggle: () => void;
}

function UserProfile({
  user,
  errorMessage,
  currentUser,
  isCurrentUser,
  isFollowing,
  followStatus,
  followLoading,
  handleFollowToggle,
}: UserProfileProps) {
  const router = useRouter();
  const { username } = user;

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{errorMessage}</p>
        {user && (
          <div className="text-center">
            {user.profile_picture_url ? (
              <Image
                src={user.profile_picture_url}
                alt={user.username || "avatar"}
                width={80}
                height={80}
                className="rounded-full mx-auto mb-2 h-20"
              />
            ) : (
              <Image
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
                alt={user.username}
                width={120}
                height={120}
                className="rounded-full h-30"
              />
            )}
            <p className="text-xl font-semibold">@{user.username}</p>
            {user.follower_count !== undefined && (
              <p className="text-gray-600">Followers: {user.follower_count}</p>
            )}
            {!isCurrentUser && (
              <div className="mt-4">
                {isFollowing ? (
                  <Button
                    name="Following"
                    variant="secondary"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  />
                ) : followStatus === "pending" ? (
                  <Button name="Requested" variant="secondary" disabled />
                ) : (
                  <Button
                    name="Follow"
                    variant="primary"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  />
                )}
              </div>
            )}
          </div>
        )}
        <Link href="/" className="mt-4">
          <Button name="Go Home" variant="secondary" />
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start gap-6 mb-6">
        {user.profile_picture_url ? (
          <Image
            src={user.profile_picture_url}
            alt={user.username}
            width={120}
            height={120}
            className="rounded-full h-30 object-cover"
          />
        ) : (
          <Image
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
            alt={user.username}
            width={120}
            height={120}
            className="rounded-full h-30 object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-semibold">@{user.username}</h1>
            {isCurrentUser ? (
              <>
                <Link href="/club/create/">
                  <div className="flex items-center">
                    <Button
                      name="Create Club"
                      type="button"
                      variant="secondary"
                      size="squared"
                      icon={<Plus />}
                    />
                  </div>
                </Link>
                <Link href="/profile/edit/">
                  <Button
                    name="Edit Profile"
                    type="button"
                    variant="secondary"
                    size="squared"
                    icon={<Settings />}
                  />
                </Link>
              </>
            ) : (
              <div className="flex gap-2">
                {isFollowing ? (
                  <Button
                    name="Following"
                    variant="secondary"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  />
                ) : followStatus === "pending" ? (
                  <Button name="Requested" variant="secondary" disabled />
                ) : (
                  <Button
                    name="Follow"
                    variant="primary"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  />
                )}
                {/* Message button */}
                <Button
                  name="Message"
                  variant="secondary"
                  onClick={() => router.push(`/messages/${user.username}`)}
                />
              </div>
            )}
          </div>
          <div className="flex gap-6 mb-4">
            <Link href={`/${username}/posts`} className="hover:underline">
              <span className="font-semibold">{user.total_posts_count}</span>{" "}
              Posts
            </Link>
            <Link href={`/${username}/followers`} className="hover:underline">
              <span className="font-semibold">{user.follower_count}</span>{" "}
              Followers
            </Link>
            <Link href={`/${username}/following`} className="hover:underline">
              <span className="font-semibold">{user.following_count}</span>{" "}
              Following
            </Link>
            <Link href={`/${username}/clubs`} className="hover:underline">
              <span className="font-semibold">{user.club_count}</span> Clubs
            </Link>
          </div>

          {user.bio && <p className="text-gray-700 mb-2">{user.bio}</p>}

          {user.location && (
            <p className="text-sm text-gray-600">📍 {user.location}</p>
          )}
          {user.website && (
            <Link
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              🔗 {user.website}
            </Link>
          )}
        </div>
      </div>

      <div className="border-b border-gray-300 mb-6">
        <nav className="flex gap-8">
          <Link
            href={`/${username}`}
            className="pb-2 border-b-2 border-blue-500"
          >
            Posts
          </Link>
          <Link
            href={`/${username}/clubs`}
            className="pb-2 hover:border-b-2 hover:border-gray-300"
          >
            Clubs
          </Link>
          <Link
            href={`/${username}/activity`}
            className="pb-2 hover:border-b-2 hover:border-gray-300"
          >
            Activity
          </Link>
        </nav>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <p className="col-span-3 text-center text-gray-500">
          Posts will appear here
        </p>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-black-100 rounded text-xs">
          <p>
            <strong>Current User:</strong>{" "}
            {currentUser?.username || "Not logged in"}
          </p>
          <p>
            <strong>Profile User:</strong> {user.username}
          </p>
          <p>
            <strong>Is Current User:</strong> {isCurrentUser ? "Yes" : "No"}
          </p>
          <p>
            <strong>Is Following:</strong> {isFollowing ? "Yes" : "No"}
          </p>
          <p>
            <strong>Is Followed by:</strong>{" "}
            {user.is_followed_by ? "Yes" : "No"}
          </p>
          <p>
            <strong>Follow Status:</strong> {followStatus || "None"}
          </p>
        </div>
      )}
    </div>
  );
}

export default React.memo(UserProfile);
