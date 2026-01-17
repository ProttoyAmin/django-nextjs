// Fixed Navbar component
"use client";

import React, { useState, useCallback } from "react";
import { ProfileIcon } from "../atoms/Icons";
import {
  LogoutUser,
  updateUserProfile,
} from "@/src/libs/auth/actions/user.actions";
import { useAppDispatch } from "@/src/redux-store/hooks";
import Button from "../atoms/Button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Loader from "../atoms/Loader";
import { useUser } from "@/src/hooks/useUser";
import CreatePostForm from "../molecules/CreatePostForm";
import { Modal } from "./Modal";
import { PostFormType } from "@/src/types/post";
import {
  LogOut,
  House,
  Plus,
  Club,
  Bell,
  MoreHorizontal,
  Heart,
} from "lucide-react";
import { handleUserLogout, setUser } from "@/src/redux-store";
import { TabItem } from "../atoms/Tabs";
import SizeAvatars from "./Avatar";
import NotificationDrawer from "../molecules/NotificationDrawer";
import { UserType } from "@/types";

interface LeftBarProps {
  items?: {
    label: string;
    path: string;
    icon?: React.ReactNode;
  }[];
  type?: "settings" | "default";
}

type StatusType = "online" | "away" | "dnd";

function LeftBar({ items, type }: LeftBarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useUser();
  const [showPostModal, setShowPostModal] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  const logUserOut = useCallback(async () => {
    await LogoutUser();
    handleUserLogout(dispatch);
    router.push("/login");
  }, [dispatch, router]);

  const openPostModal = useCallback(() => {
    setShowPostModal(true);
  }, []);

  const closePostModal = useCallback(() => {
    setShowPostModal(false);
  }, []);

  const handlePostSubmit = useCallback(() => {
    closePostModal();
  }, [closePostModal]);

  const pathname = usePathname();

  if (isLoading) {
    return <Loader />;
  }

  const handleNotificationClick = () => {
    return <NotificationDrawer />;
  };

  const isActive = (path: string, reject?: boolean) => {
    if (reject) {
      return;
    }
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const statuses = ["Online", "Away", "DND"];

  if (type === "settings") {
    return (
      <>
        <div className="top-0 left-0 p-5 flex flex-col gap-2.5">
          {items &&
            items.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-2 hover:bg-[#28292a] h-15 px-5 rounded-2xl ${
                    isActive(item.path) ? "bg-[#28292a] " : ""
                  }`}
                >
                  {item.icon}
                  <p className="font-semibold">{item.label}</p>
                </div>
              </Link>
            ))}
        </div>
      </>
    );
  }

  const handleClose = () => {
    setShowStatus(false);
    setShowMore(false);
  };

  const handleStatusChange = async (newStatus: StatusType) => {
    try {
      if (newStatus === user?.status) {
        handleClose();
        return;
      }
      await updateUserProfile({
        status: newStatus,
      } as UserType);

      dispatch(
        setUser({
          status: newStatus,
          is_status_manual: newStatus !== "online",
        } as UserType)
      );
    } catch (error) {
      console.warn(error);
    }
    handleClose();
  };

  return (
    <>
      <aside className="h-full bg-black p-4 flex flex-col gap-5">
        {user ? (
          <>
            {items ? (
              items.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-2 hover:bg-[#28292a] h-15 px-5 rounded-2xl ${
                      isActive(item.path) ? "bg-[#28292a] " : ""
                    }`}
                  >
                    {item.icon}
                    {/* <p className="font-semibold">{item.label}</p> */}
                  </div>
                </Link>
              ))
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
                  <Link href={"/"}>
                    {/* <Button
                    name="Home"
                    type="button"
                    variant={pathname === "/" ? "light" : "secondary"}
                    size="squared"
                    icon={<House />}
                    fullWidth
                    className={pathname === "/" ? "bg-blue-600 text-white" : ""}
                  /> */}

                    <div
                      className={`flex items-center gap-2 hover:bg-[#28292a] h-15 px-5 rounded-2xl ${
                        isActive(`/`) ? "bg-[#28292a] " : ""
                      }`}
                    >
                      <House className={`w-5 h-5`} />
                      {/* <p className="font-semibold">Home</p> */}
                    </div>
                  </Link>

                  <Link href={`/clubs`}>
                    <div
                      className={`flex items-center gap-2 hover:bg-[#28292a] h-15 px-5 rounded-2xl ${
                        isActive(`/clubs`) ? "bg-[#28292a] " : ""
                      }`}
                    >
                      <Club className={`w-5 h-5`} />
                      {/* <p className="font-semibold">Clubs</p> */}
                    </div>
                  </Link>

                  <Link href={`/activities`}>
                    <div
                      className={`flex items-center gap-2 hover:bg-[#28292a] h-15 px-5 rounded-2xl ${
                        isActive(`/activities`) ? "bg-[#28292a] " : ""
                      }`}
                    >
                      <Heart className={`w-5 h-5`} />
                      {/* <p className="font-semibold">Activities</p> */}
                    </div>
                  </Link>

                  <Link href={`/${user?.username}/`}>
                    <div
                      className={`flex items-center gap-2 hover:bg-[#28292a] h-15 px-5 rounded-2xl ${
                        isActive(`/${user?.username}`) ? "bg-[#28292a] " : ""
                      }`}
                    >
                      <SizeAvatars
                        user={user}
                        size={20}
                        className={`border-2 rounded-full p-0.5 ${
                          isActive(`/${user?.username}`)
                            ? "border-white "
                            : "border-transparent"
                        }`}
                      />
                      {/* <p className="font-semibold">Profile</p> */}
                    </div>
                  </Link>

                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-[#28292a] h-15 px-5 rounded-2xl"
                    onClick={openPostModal}
                  >
                    <Plus />
                    {/* <p className="font-semibold">Create Post</p> */}
                  </div>

                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-[#28292a] h-15 px-5 rounded-2xl"
                    onClick={logUserOut}
                  >
                    <LogOut stroke="red" />
                    {/* <p className="font-semibold text-red-500">Logout</p> */}
                  </div>
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-[#28292a] h-15 px-5 rounded-2xl"
                    onClick={() => setShowMore(!showMore)}
                  >
                    <MoreHorizontal />
                  </div>
                </div>

                <Modal isOpen={showPostModal} onClose={closePostModal}>
                  <CreatePostForm
                    onClose={closePostModal}
                    onSubmit={handlePostSubmit}
                  />
                </Modal>

                <Modal
                  isOpen={showMore}
                  onClose={() => setShowMore(false)}
                  size="sm"
                >
                  <div className="flex justify-between p-5 items-center">
                    <p>Status</p>
                    <Button
                      name="Change status"
                      type="button"
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setShowStatus(!showStatus);
                      }}
                      className="px-5 py-2 rounded-2xl"
                    />
                  </div>

                  <Modal
                    isOpen={showStatus}
                    onClose={() => setShowStatus(false)}
                    size="sm"
                  >
                    {statuses.map((status) => (
                      <div
                        key={status}
                        className="flex items-center gap-2 cursor-pointer hover:bg-[#28292a] h-15 px-5 rounded-2xl"
                        onClick={() => {
                          handleStatusChange(
                            status.toLowerCase() as StatusType
                          );
                        }}
                      >
                        <p className="font-semibold">{status}</p>
                      </div>
                    ))}
                  </Modal>
                </Modal>
              </>
            )}
          </>
        ) : (
          <p></p>
        )}
      </aside>
    </>
  );
}

export default LeftBar;
