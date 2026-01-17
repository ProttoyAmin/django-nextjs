// src/app/components/profile/FollowingLists.tsx
"use client";

import { useEffect, useState } from "react";
import { getFollowing } from "@/src/libs/auth/actions/follow.actions";
import Loader from "@/src/app/components/atoms/Loader";
import Image from "next/image";
import Link from "next/link";
import FollowButtons from "./FollowButtons";
import { useAppDispatch } from "@/src/redux-store";
import { setUpFollowings } from "@/src/redux-store/slices/follow";
import { Follower } from "@/types";
import SizeAvatars from "@/src/app/components/organisms/Avatar";

interface FollowingListsProps {
  user: any;
}

export default function FollowingLists({ user }: FollowingListsProps) {
  const [followings, setFollowings] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsVisible, setItemsVisible] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchFollowings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getFollowing(user.id);
        console.log('response ', response)

        if (response.success) {
          const followingsData = response.data?.results || response.data || [];
          dispatch(setUpFollowings(followingsData))
          setFollowings(followingsData);

          setTimeout(() => {
            setItemsVisible(true);
          }, 100);

        } else {
          console.error("Failed to fetch followings:", response.errors);
          setFollowings([]);
        }
      } catch (error) {
        console.error("Error fetching followings:", error);
        setFollowings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowings();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-4">
        <Loader />
      </div>
    );
  }

  if (followings.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 py-4 transition-opacity duration-300">
          No followings yet
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {followings.map((following, index) => (
          <div
            key={following.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 transform ${itemsVisible
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-4"
              }`}
            style={{
              transitionDelay: itemsVisible ? `${index * 50}ms` : "0ms"
            }}
          >
            <Link
              href={`/${following?.username}`}
              className="flex items-center gap-3 flex-1"
            >
              <SizeAvatars user={following} size={40} badgeSize="8px" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{following.username}</p>
                {following.first_name && (
                  <p className="text-xs text-gray-500">{following.first_name + " " + following.last_name}</p>
                )}
              </div>
            </Link>

            <FollowButtons
              follower={following}
              size="default"
              variant="default"
              showConfirmOnUnfollow={true}
              onFollowChange={(isFollowing, status) => {
                setFollowings(prev => prev.map(f =>
                  f.user_id === following.user_id
                    ? {
                      ...f,
                      you_follow_them: isFollowing,
                      your_follow_status: status as "accepted" | "pending" | "blocked" | null
                    }
                    : f
                ));
              }}
            />




            {/* You can add follow/unfollow buttons here */}
            {/* {currentUser && currentUser.id !== following.user_id && (
              <button className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200">
                Follow
              </button>
            )} */}
          </div>
        ))}
      </div>
    </div>
  );
}