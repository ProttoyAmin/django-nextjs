"use client";

import React from "react";
import { Notification } from "@/src/types/notification";

interface NotificationItemProps {
  notification: Notification;
}

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getNotificationIcon = (verb: string) => {
  switch (verb) {
    case "like":
      return "❤️";
    case "comment":
      return "💬";
    case "follow_request":
      return "👋";
    case "follow_accept":
      return "✅";
    default:
      return "🔔";
  }
};

function NotificationItem({ notification }: NotificationItemProps) {
  const actor = notification.primary_actor;
  const time = timeAgo(notification.created_at);

  return (
    <div
      className={`p-4 hover:bg-[#28292a] transition-colors border-b border-gray-800 flex items-center gap-4 rounded-xl ${
        !notification.is_read ? "bg-gray-900/20" : ""
      }`}
    >
      <div className="shrink-0">
        {actor?.avatar ? (
          <img
            src={actor.avatar}
            alt={actor.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
            {actor?.username?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200">
          <span className="font-semibold text-white">
            {actor?.username || "Someone"}
          </span>{" "}
          {notification.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">
            {getNotificationIcon(notification.verb)}
          </span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
      </div>

      {notification.target_preview && (
        <div className="shrink-0 w-10 h-10 rounded overflow-hidden">
          <img
            src={notification.target_preview}
            alt="Preview"
            className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(NotificationItem);
