// app/[username]/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { checkUser } from "@/src/hooks/checkUser";
import Loader from "../../components/atoms/Loader";
import Link from "next/link";
import Button from "../../components/atoms/Button";
import ProfileCard from "../profile/components/ProfileCard";
import ProfileTimeline from "../profile/components/ProfileTimeline";
import { useAppSelector } from "@/src/redux-store/hooks";
import { useAppDispatch } from "@/src/redux-store/hooks";
import { setFollowRelationship, setUser } from "@/src/redux-store";
import { useUser } from "@/src/hooks/useUser";
import { UserX, UserX2Icon, UserRoundX } from "lucide-react";
import ProfileTabs from "../profile/components/ProfileTabs";
import { canViewProfile } from "@/src/utils/permissions";
import { setTargetUser } from "@/src/redux-store/slices/user";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, currentUser, isLoading, errorMessage, isCurrentUser } =
    checkUser(username);
  const [followState, setFollowState] = useState({
    isFollowing: user?.is_following || false,
    followStatus: user?.follow_status || null,
    isLoading: false,
  });
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (currentUser) {
      dispatch(setUser(currentUser));
    }
  }, [currentUser, dispatch]);

  useEffect(() => {
    if (user) {
      setFollowState({
        isFollowing: user.is_following || false,
        followStatus: user.follow_status || null,
        isLoading: false,
      });

      dispatch(
        setFollowRelationship({
          userId: Number(user.id),
          data: {
            isFollowing: user.is_following || false,
            isFollowedBy: user.is_followed_by || false,
            isMutual: user.is_mutual || false,
            followStatus: user.follow_status || null,
          },
        }),
      );
    }
  }, [user, dispatch]);

  const isAuthenticated = !!currentUser;

  useEffect(() => {
    if (user) {
      dispatch(setTargetUser(user));
    }
  }, [user, dispatch]);

  const canView = canViewProfile(currentUser, user);

  const handleProtectedAction = async (
    action: () => Promise<void>,
    actionName: string = "action",
  ) => {
    if (!isAuthenticated) {
      alert("Please log in first");
      return;
    }

    try {
      await action();
    } catch (error) {
      console.error(`Error performing ${actionName}:`, error);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="bg-black/70 fixed inset-0 flex items-center justify-center z-50">
          <Loader />
        </div>
      </>
    );
  }

  if (errorMessage && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-card rounded-lg shadow-md p-12 text-center max-w-md">
          <div className="mb-4 flex items-center justify-center">
            <UserX2Icon size={24} />
          </div>
          <h2 className="text-2xl mb-10">{errorMessage}</h2>
          <Link href="/">
            <Button name="Go Home" variant="secondary" fullWidth />
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <ProfileCard
            user={user}
            isCurrentUser={isCurrentUser}
            isAuthenticated={isAuthenticated}
            canViewPosts={canView}
            onProtectedAction={handleProtectedAction}
          />
          {/* <UserProfile
            user={user}
            errorMessage={errorMessage}
            currentUser={currentUser}
            isCurrentUser={isCurrentUser}
            isFollowing={followState.isFollowing}
            followStatus={followState.followStatus}
            followLoading={followState.isLoading}
            handleFollowToggle={handleFollowToggle}
          /> */}

          {/* <div>
            <h1>for debuggin:</h1>

            <p>current user: {currentUser?.username || 'Anonymous'}</p>
            <p>profile of: {user.username}</p>
            <p>is authenticated: {isAuthenticated.toString()}</p>
          </div> */}

          {/* <ProfileTabs username={username} canView={canViewProfile} /> */}

          <ProfileTimeline
            userId={user.id as string}
            username={user.username}
            canViewPosts={canView}
            isCurrentUser={isCurrentUser}
            isAuthenticated={isAuthenticated}
            onProtectedAction={handleProtectedAction}
          />
        </div>
      </div>
    </>
  );
}
