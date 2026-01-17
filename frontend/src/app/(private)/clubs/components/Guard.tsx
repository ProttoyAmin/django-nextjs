"use client";

import { useAppSelector } from "@/src/redux-store";
import { usePathname } from "next/navigation";
import {
  canManageSettings,
  canManageMembers,
  canManageRoles,
  canViewSettings,
} from "@/src/utils/permissions";
import { useRouter } from "next/navigation";
import React from "react";

export default function Guard({ children }: { children: React.ReactNode }) {
  const pathName = usePathname();
  const router = useRouter();
  const clubId = pathName.split("/")[2];
  const user = useAppSelector((state) =>
    state.user?.currentUser?.clubs.find((club) => club.club_id === clubId)
  );
  const isSettings = pathName.includes("settings");
  const isMembers = pathName.includes("members");
  const isRoles = pathName.includes("roles");
  const isPosts = pathName.includes("posts");
  console.log("Path: ", pathName);
  console.log("User: ", user);
  console.log("canViewSettings: ", canViewSettings(user?.role_permissions));
  console.log("canManageMembers: ", canManageMembers(user?.role_permissions));
  console.log("canManageRoles: ", canManageRoles(user?.role_permissions));
  console.log("isSettings: ", isSettings);
  console.log("isMembers: ", isMembers);
  console.log("isRoles: ", isRoles);
  console.log("isPosts: ", isPosts);
  let defaultPermission = isSettings && canViewSettings(user?.role_permissions);
  let permission =
    (defaultPermission &&
      isSettings &&
      canManageSettings(user?.role_permissions)) ||
    (defaultPermission &&
      isMembers &&
      canManageMembers(user?.role_permissions)) ||
    (defaultPermission && isRoles && canManageRoles(user?.role_permissions));

  React.useEffect(() => {
    if (!user) return;

    if (!defaultPermission) {
      router.replace(`/clubs/${clubId}`); // Redirect to club main page
    }

    if (defaultPermission && !permission) {
      router.replace(`/clubs/${clubId}/settings/info`); // Redirect to club main page
    }
  }, [isSettings, isMembers, isRoles, user, router, clubId]);

  return <>{children}</>;
}
