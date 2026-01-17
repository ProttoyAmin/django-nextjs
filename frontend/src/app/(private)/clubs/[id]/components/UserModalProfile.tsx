"use client";

import { Modal } from "@/src/app/components/organisms/Modal";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/src/app/components/organisms/ProfileHeader";
import { useEffect, useState } from "react";
import {
  getUserByUsername,
  getUserRoles,
} from "@/src/libs/auth/actions/user.actions";
import { UserType } from "@/types";
import { ImageFor } from "@/src/app/components/organisms/ProfileHeader";
import Badge from "@/src/app/components/atoms/Badge";
import { useAppDispatch, useAppSelector } from "@/src/redux-store";
import { fetchUserRolesThunk, RoleType } from "@/src/redux-store/slices/roles";
import Link from "next/link";
import Button from "@/src/app/components/atoms/Button";
import SizeAvatars from "@/src/app/components/organisms/Avatar";
import { Users } from "lucide-react";
import Tabs from "@/src/app/components/atoms/Tabs";
import PostsTab from "../../../profile/components/tabs/PostsTab";
import { checkUser } from "@/src/hooks/checkUser";
import { useUser } from "@/src/hooks/useUser";
import { canViewProfile } from "@/src/utils/permissions";
import PrivateProfile from "../../../profile/components/PrivateProfile";
import ProfileCard from "../../../profile/components/ProfileCard";

interface UserModalProfileProps {
  username: string;
  clubId?: string;
  type?: "club" | "user";
  onClose?: () => void;
}

export default function UserModalProfile({
  username,
  clubId,
  type = "user",
}: UserModalProfileProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const { user: currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  const userRoleStore = useAppSelector((state) => state.roles.userRoles);
  const key = `${clubId}-${user?.id}`;
  const roles = userRoleStore[key] || [];

  const handleModalClose = () => {
    router.back();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await getUserByUsername(username);
        console.log("response", response);
        if (response.success) {
          setUser(response.data);
        } else if (response.status === 403) {
          setUser(response.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username]);

  useEffect(() => {
    if (!user?.id) return;
    dispatch(
      fetchUserRolesThunk({ clubId: clubId as string, userId: user.id })
    );
  }, [user?.id, clubId]);

  if (loading) {
    return (
      <Modal
        isOpen={true}
        onClose={handleModalClose}
        size="md_vertical"
        close={true}
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Modal>
    );
  }

  console.log("user:", user);

  const canView = canViewProfile(currentUser as UserType, user as UserType);
  console.log("canView", canView);

  if (!user) {
    return (
      <Modal
        isOpen={true}
        onClose={handleModalClose}
        size="md_vertical"
        close={true}
      >
        <div className="p-4 text-center">
          <p className="text-red-500">User not found: {username}</p>
        </div>
      </Modal>
    );
  }

  if (user?.is_private && !canView) {
    return (
      <Modal
        isOpen={true}
        onClose={handleModalClose}
        size="md_vertical"
        close={true}
      >
        <div className="p-4 text-center">
          <PrivateProfile user={user} currentUser={currentUser || undefined} />
        </div>
      </Modal>
    );
  }

  const items = [
    {
      id: "posts",
      label: "Posts",
      content: (
        <PostsTab
          userId={user.id}
          username={user.username}
          canViewPosts={true}
          isCurrentUser={user.id === currentUser?.id}
        />
      ),
    },
    {
      id: "reels",
      label: "Reels",
      content: <></>,
    },
    {
      id: "reposts",
      label: "Reposts",
      content: <></>,
    },
  ];

  if (type === "user") {
    return (
      <>
        <Modal
          isOpen={true}
          onClose={handleModalClose}
          size="md_vertical"
          close={true}
        >
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <SizeAvatars user={user} size={100} />
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold">
                    {user.first_name || user.username}
                  </h2>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <Link href={`/${user.username}`} className="hover:underline">
                    <Button name="View Profile" variant="default" />
                  </Link>
                  {user.email && (
                    <p className="text-sm text-gray-400">{user.email}</p>
                  )}
                </div>
                {user.follower_count > 0 && (
                  <p className="mt-3 text-gray-700">
                    {user.follower_count} followers
                  </p>
                )}

                {user.bio && <p className="mt-3 text-gray-700">{user.bio}</p>}
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Joined</p>
                  <p className="font-medium">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Posts</p>
                  <p className="font-medium">{user.user_post_count || 0}</p>
                </div>
                {user.location && (
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{user.location}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Tabs
                items={items}
                defaultActiveTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId)}
                variant="segmented"
                orientation="horizontal"
                size="lg"
                lazyLoad={true}
                keepMounted={false}
              />
            </div>
          </div>
        </Modal>
      </>
    );
  }

  if (type === "club") {
    return (
      <Modal
        isOpen={true}
        onClose={handleModalClose}
        size="md_vertical"
        close={true}
      >
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-start gap-4 mb-6">
            <SizeAvatars user={user} size={100} />
            <div className="flex-1">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">
                  {user.first_name || user.username}
                </h2>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <Link href={`/${user.username}`} className="hover:underline">
                  <Button name="View Profile" variant="default" />
                </Link>
                {/* {user.email && (
                                <p className="text-sm text-gray-400">{user.email}</p>
                            )} */}
              </div>

              {/* Bio */}
              {/* {user.bio && (
                            <p className="mt-3 text-gray-700">{user.bio}</p>
                        )} */}
            </div>
          </div>
          {/* Divider */}
          {/* <div className="border-t my-6"></div> */}
          {/* Roles Section */}
          <div>
            {roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map((role, index) => (
                  <Badge key={index} text={role?.name} color={role?.color} />
                ))}
              </div>
            ) : (
              <Badge text="Member" color="blue" />
            )}
          </div>
          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Member Since</p>
                <p className="font-medium">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Posts</p>
                <p className="font-medium">{user.club_post_count || 0}</p>
              </div>
              {user.location && (
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{user.location}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
