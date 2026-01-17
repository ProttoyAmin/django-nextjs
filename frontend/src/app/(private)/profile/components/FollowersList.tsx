// src/app/components/profile/FollowersList.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { getFollowers } from "@/src/libs/auth/actions/follow.actions";
import Loader from "@/src/app/components/atoms/Loader";
import Image from "next/image";
import Link from "next/link";
import FollowButtons from "./FollowButtons";
import { Follower, UserType } from "@/types";
import { useAppDispatch } from "@/src/redux-store";
import { setFollowRelationship } from "@/src/redux-store";
import { setUpFollowers } from "@/src/redux-store/slices/follow";
import SizeAvatars from "@/src/app/components/organisms/Avatar";

interface FollowersListProps {
  user: UserType;
  currentUser?: UserType;
}

function FollowersList({ user, currentUser }: FollowersListProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsVisible, setItemsVisible] = useState(false);
  const hasFetchedRef = useRef(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (hasFetchedRef.current) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getFollowers(user.id);

        if (response.success) {

          const followersData = response.data?.results || response.data || [];

          dispatch(setUpFollowers(followersData))
          setFollowers(followersData);
          hasFetchedRef.current = true;

          setTimeout(() => {
            setItemsVisible(true);
          }, 100);
        } else {
          console.error("Failed to fetch followers:", response.errors);
          setFollowers([]);
        }
      } catch (error) {
        console.error("Error fetching followers:", error);
        setFollowers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-4">
        <Loader />
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 py-4 transition-opacity duration-300">
          No followers yet
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {followers.map((follower, index) => (
          <div
            key={follower.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 transform ${itemsVisible
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-4"
              }`}
            style={{
              transitionDelay: itemsVisible ? `${index * 50}ms` : "0ms"
            }}
          >
            <Link
              href={`/${follower?.username}`}
              className="flex items-center gap-3 flex-1"
            >
              <SizeAvatars user={follower} size={40} badgeSize="8px" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{follower.username}</p>
                {follower.first_name && (
                  <p className="text-xs text-gray-500">{follower.first_name + " " + follower.last_name}</p>
                )}
              </div>
            </Link>

            <FollowButtons
              follower={follower}
              size="default"
              variant="default"
              showConfirmOnUnfollow={true}
              onFollowChange={(isFollowing, status) => {
                setFollowers(prev => prev.map(f =>
                  f.user_id === follower.user_id
                    ? {
                      ...f,
                      you_follow_them: isFollowing,
                      your_follow_status: status as "accepted" | "pending" | "blocked" | null
                    }
                    : f
                ));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(FollowersList);