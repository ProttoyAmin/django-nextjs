// components/ClubCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
// import { formatDistanceToNow } from 'date-fns';
import getTimeAgo from "@/src/libs/utils/helpers";
import { Users, Calendar, Shield } from "lucide-react";

export interface ClubCardProps {
  club: {
    club_id: string | number;
    club_avatar: string;
    club_banner: string;
    club_name: string;
    club_slug: string;
    club_url: string;
    role_name: string;
    role_permissions: {
      can_manage_members: boolean;
      can_manage_posts: boolean;
      can_manage_events: boolean;
      can_manage_settings: boolean;
    };
    joined_at: string;
    is_public?: boolean;
    is_active?: boolean;
  };
}

function ClubCard({ club }: ClubCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return getTimeAgo(dateString);
    } catch (error) {
      return "Unknown date";
    }
  };

  console.log("club card", club);
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-800 border-purple-200",
      admin: "bg-red-100 text-red-800 border-red-200",
      moderator: "bg-blue-100 text-blue-800 border-blue-200",
      member: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      colors[role.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
      {/* Club Banner/Header */}
      <div className="relative h-32 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-linear-to-br from-blue-400/10 to-purple-400/10">
          <Image
            src={
              club?.club_banner ||
              `${process.env.NEXT_PUBLIC_DICEBEAR_API}${club?.club_slug}`
            }
            alt={club?.club_name}
            fill
            className="object-cover"
            sizes="(max-width: 64px) 100vw"
          />
        </div>

        {/* Club Avatar */}
        <div className="absolute -bottom-8 left-6">
          <div className="relative w-16 h-16 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-white">
            <Image
              src={
                club?.club_avatar ||
                `${process.env.NEXT_PUBLIC_DICEBEAR_API}${club?.club_slug}`
              }
              alt={club?.club_name}
              fill
              className="object-cover"
              sizes="(max-width: 64px) 100vw"
            />
          </div>
        </div>
      </div>

      {/* Club Content */}
      <div className="pt-10 pb-6 px-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {club.club_name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">@{club.club_slug}</p>
          </div>

          {/* Role Badge */}
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${getRoleColor(
              club.role_name
            )}`}
          >
            {club.role_name.charAt(0).toUpperCase() + club.role_name.slice(1)}
          </span>
        </div>

        {/* Club Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatDate(club.joined_at)}</span>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2">
            {club.is_public ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                <Users className="w-3 h-3" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                <Shield className="w-3 h-3" />
                Private
              </span>
            )}

            {club.is_active === false && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Your Permissions:
          </p>
          <div className="flex flex-wrap gap-2">
            {club.role_permissions.can_manage_posts && (
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                Posts
              </span>
            )}
            {club.role_permissions.can_manage_members && (
              <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md">
                Members
              </span>
            )}
            {club.role_permissions.can_manage_events && (
              <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                Events
              </span>
            )}
            {club.role_permissions.can_manage_settings && (
              <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-md">
                Settings
              </span>
            )}
            {!Object.values(club.role_permissions).some((v) => v) && (
              <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-md">
                Basic Access
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <Link
            href={`/clubs/${club.club_id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg text-center transition-colors"
          >
            Visit Club
          </Link>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClubCard;
