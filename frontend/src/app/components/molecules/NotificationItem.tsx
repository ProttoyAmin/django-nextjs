"use client";

import React from "react";
import { Notification } from "@/src/types/notification";
import getTimeAgo from "@/src/libs/utils/helpers";
import {
  BellIcon,
  Check,
  CheckCheck,
  Dot,
  HeartIcon,
  MessageCircleIcon,
  UserCheckIcon,
  UserPlusIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import SizeAvatars from "../organisms/Avatar";
import { UserType } from "@/types";
import Link from "next/link";
import ShowFollowButtons from "../organisms/ShowFollowButtons";
import Button from "../atoms/Button";

interface NotificationItemProps {
  notification: Notification;
}

const getNotificationIcon = (verb: string) => {
  switch (verb) {
    case "like":
      return <HeartIcon size={10} />;
    case "comment":
      return <MessageCircleIcon size={10} />;
    case "follow_request":
      return <UserPlusIcon size={10} />;
    case "follow_accept":
      return <UserCheckIcon size={10} />;
    default:
      return <BellIcon size={10} />;
  }
};

function NotificationItem({ notification }: NotificationItemProps) {
  const [isAccepted, setIsAccepted] = React.useState(false);
  const [isRejected, setIsRejected] = React.useState(false);
  const actor = notification?.primary_actor;
  const time = getTimeAgo(notification?.created_at);

  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0">
        {notification?.is_read ? (
          <CheckCheck size={10} color="white" />
        ) : (
          <Dot size={10} color="white" />
        )}
      </div>
      <div
        className={`p-4 hover:bg-[#28292a] w-full transition-colors border-b border-gray-800 flex items-center gap-4 rounded-xl ${
          !notification?.is_read ? "bg-gray-900/20" : ""
        }`}
      >
        <Link href={`/${actor?.username}`}>
          <div className="shrink-0">
            <SizeAvatars size={40} user={actor as UserType} />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200">
            {/* <span className="font-semibold text-white">
              {actor?.username || "Someone"}
            </span>{" "} */}
            {notification?.description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {getNotificationIcon(notification?.verb)}
            </span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        </div>

        {notification?.verb === "follow_request" && (
          <>
            {!isAccepted && !isRejected && (
              <>
                <div className="shrink-0">
                  <Button
                    variant="default"
                    size="default"
                    icon={<Check size={18} color="white" stroke="green" />}
                    onClick={() => setIsAccepted(true)}
                  />
                </div>
                <div className="shrink-0">
                  <Button
                    variant="ghostDanger"
                    size="default"
                    icon={<X size={18} color="white" stroke="red" />}
                    onClick={() => setIsRejected(true)}
                  />
                </div>
              </>
            )}
          </>
        )}

        {isAccepted && (
          <div className="shrink-0">
            <p className="text-sm text-gray-200">Accepted</p>
          </div>
        )}

        {isRejected && (
          <div className="shrink-0">
            <p className="text-sm text-gray-200">Rejected</p>
          </div>
        )}

        {notification?.target_preview && (
          <div className="shrink-0 w-10 h-10 rounded overflow-hidden">
            <img
              src={notification?.target_preview}
              alt="Preview"
              className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(NotificationItem);
