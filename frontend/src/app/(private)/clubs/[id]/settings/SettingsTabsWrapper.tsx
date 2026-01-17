"use client";

import React from "react";
import LeftBar from "@/src/app/components/organisms/LeftBar";
import { Users, Shield, Edit, Info } from "lucide-react";
import { useAppSelector } from "@/src/redux-store";
import {
  canManageSettings,
  canManageMembers,
  canManageRoles,
  canManagePosts,
} from "@/src/utils/permissions";

interface SettingsTabsWrapperProps {
  clubId: string;
}

export default function SettingsTabsWrapper({
  clubId,
}: SettingsTabsWrapperProps) {
  const user = useAppSelector((state) =>
    state.user.currentUser?.clubs.find((club) => club.club_id === clubId)
  );
  let tabs;
  console.log(user?.role_permissions);
  console.log(canManageMembers(user?.role_permissions));
  console.log(canManageSettings(user?.role_permissions));

  if (canManageSettings(user?.role_permissions)) {
    tabs = [
      {
        label: "Info",
        path: `/clubs/${clubId}/settings/info`,
        icon: <Info size={20} />,
      },
      {
        label: "Edit",
        path: `/clubs/${clubId}/settings/edit`,
        icon: <Edit size={20} />,
      },
      {
        label: "Members",
        path: `/clubs/${clubId}/settings/members`,
        icon: <Users size={20} />,
      },
      {
        label: "Roles",
        path: `/clubs/${clubId}/settings/roles`,
        icon: <Shield size={20} />,
      },
    ];
  } else if (canManageMembers(user?.role_permissions)) {
    tabs = [
      {
        label: "Info",
        path: `/clubs/${clubId}/settings/info`,
        icon: <Info size={20} />,
      },
      {
        label: "Members",
        path: `/clubs/${clubId}/settings/members`,
        icon: <Users size={20} />,
      },
    ];
  } else if (canManageRoles(user?.role_permissions)) {
    tabs = [
      {
        label: "Info",
        path: `/clubs/${clubId}/settings/info`,
        icon: <Info size={20} />,
      },
      {
        label: "Roles",
        path: `/clubs/${clubId}/settings/roles`,
        icon: <Shield size={20} />,
      },
    ];
  }

  return <LeftBar items={tabs} type={"settings"} />;
}
