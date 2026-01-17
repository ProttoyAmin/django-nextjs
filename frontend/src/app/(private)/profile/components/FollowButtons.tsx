"use client";

import React, { useCallback, useEffect } from "react";
import Button from "@/src/app/components/atoms/Button";
import { Follower, UserType } from "@/types";
import { toggleFollow } from "@/src/libs/auth/actions/follow.actions";
import { useUser } from "@/src/hooks/useUser";
import {
  useAppDispatch,
  useAppSelector,
  setFollowRelationship,
  updateFollowStatus,
  setFollowLoading,
  selectFollowRelationshipByUserId,
  selectFollowLoadingByUserId,
  setUpFollowers,
  setUpFollowings,
} from "@/src/redux-store";

interface FollowButtonsProps {
  targetUser?: UserType;
  follower?: Follower;
  onFollowChange?: (isFollowing: boolean, status: string | null) => void;
  onProtectedAction?: (
    action: () => Promise<void>,
    actionName?: string
  ) => void;
  fullWidth?: boolean;
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "ghost"
    | "outline"
    | "ghostDanger"
    | "warning"
    | "info"
    | "light"
    | "dark"
    | "default";
  size?: "sm" | "md" | "lg" | "squared" | "default";
  className?: string;
  showConfirmOnUnfollow?: boolean;
  isAuthenticated?: boolean;
}

function FollowButtons({
  targetUser,
  follower,
  onFollowChange,
  onProtectedAction,
  fullWidth = false,
  variant = "primary",
  size = "md",
  className = "",
  showConfirmOnUnfollow = true,
  isAuthenticated = true,
}: FollowButtonsProps) {
  const { user: currentUser } = useUser();
  const dispatch = useAppDispatch();
  const targetUserId = follower?.user_id || targetUser?.id;
  const targetUsername = follower?.username || targetUser?.username;
  const isPrivate = follower?.is_private || targetUser?.is_private || false;
  const relationship = useAppSelector(
    selectFollowRelationshipByUserId(targetUserId! as number)
  );
  const isLoading = useAppSelector(
    selectFollowLoadingByUserId(targetUserId! as number)
  );

  useEffect(() => {
    if (targetUserId && !relationship) {
      const initialIsFollowing =
        targetUser?.is_following || follower?.you_follow_them || false;
      const initialStatus =
        targetUser?.follow_status || follower?.your_follow_status || null;

      dispatch(
        setFollowRelationship({
          userId: targetUserId as number,
          data: {
            isFollowing: initialIsFollowing,
            isFollowedBy:
              targetUser?.is_followed_by ||
              follower?.is_following_back ||
              false,
            isMutual: targetUser?.is_mutual || false,
            followStatus: initialStatus,
          },
        })
      );
    }
  }, [targetUserId, targetUser, follower, relationship, dispatch]);

  useEffect(() => {
    if (targetUserId && relationship) {
      const newIsFollowing =
        targetUser?.is_following || follower?.you_follow_them || false;
      const newStatus =
        targetUser?.follow_status || follower?.your_follow_status || null;

      if (
        relationship.isFollowing !== newIsFollowing ||
        relationship.followStatus !== newStatus
      ) {
        dispatch(
          setFollowRelationship({
            userId: targetUserId as number,
            data: {
              isFollowing: newIsFollowing,
              followStatus: newStatus,
            },
          })
        );
      }
    }
  }, [
    targetUser?.is_following,
    targetUser?.follow_status,
    follower?.you_follow_them,
    follower?.your_follow_status,
    targetUserId,
    relationship,
    dispatch,
  ]);

  const getFollowButtonText = () => {
    if (isLoading) return "Loading...";

    if (relationship?.isFollowing) {
      if (relationship.followStatus === "pending") {
        return "Requested";
      }
      return "Following";
    }

    return isPrivate && relationship?.followStatus === "pending"
      ? "Requested"
      : "Follow";
  };

  const handleFollowToggle = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      onProtectedAction?.(async () => {}, "follow");
      return;
    }

    if (!targetUserId || isLoading) return;

    if (relationship?.isFollowing && showConfirmOnUnfollow) {
      const action =
        relationship.followStatus === "pending"
          ? "cancel this request to"
          : "unfollow";
      const confirmMessage = `Are you sure you want to ${action} ${
        targetUsername || "this user"
      }?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    const previousState = { ...relationship };
    const newIsFollowing = !relationship?.isFollowing;

    dispatch(
      updateFollowStatus({
        userId: targetUserId as number,
        isFollowing: newIsFollowing,
        followStatus: newIsFollowing
          ? isPrivate
            ? "pending"
            : "accepted"
          : null,
      })
    );

    dispatch(
      setFollowLoading({ userId: targetUserId as number, isLoading: true })
    );

    try {
      const result = await toggleFollow(targetUserId);

      if (result.success && result.data) {
        if (result.data.followers) {
          dispatch(setUpFollowers(result.data.followers));
        }
        if (result.data.followings) {
          dispatch(setUpFollowings(result.data.followings));
        }

        dispatch(
          setFollowRelationship({
            userId: targetUserId as number,
            data: {
              isFollowing: result.data.is_following,
              followStatus: result.data.status,
            },
          })
        );

        dispatch(
          setFollowLoading({ userId: targetUserId as number, isLoading: false })
        );
        if (onFollowChange) {
          onFollowChange(result.data.is_following, result.data.status);
        }
      } else {
        if (previousState) {
          dispatch(
            setFollowRelationship({
              userId: targetUserId as number,
              data: previousState,
            })
          );
        }
        dispatch(
          setFollowLoading({ userId: targetUserId as number, isLoading: false })
        );
        console.error("Follow toggle failed:", result.errors);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      if (previousState) {
        dispatch(
          setFollowRelationship({
            userId: targetUserId as number,
            data: previousState,
          })
        );
      }
      dispatch(
        setFollowLoading({ userId: targetUserId as number, isLoading: false })
      );
    }
  }, [
    targetUserId,
    targetUsername,
    isPrivate,
    relationship,
    isLoading,
    isAuthenticated,
    currentUser,
    onProtectedAction,
    onFollowChange,
    showConfirmOnUnfollow,
    dispatch,
  ]);

  if (currentUser?.id === targetUserId) {
    return null;
  }

  return (
    <Button
      name={getFollowButtonText()}
      onClick={handleFollowToggle}
      variant={variant}
      disabled={isLoading}
      fullWidth={fullWidth}
      size={size}
      className={className}
    />
  );
}

export default FollowButtons;
