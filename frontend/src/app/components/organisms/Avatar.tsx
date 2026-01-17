import { UserType } from "@/types";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import { Dot } from "lucide-react";
import { ClubMember } from "@/src/redux-store/slices/club";
import StatusBadge from "@/src/app/components/atoms/StatusBadge";

type StatusType = "online" | "away" | "dnd";

interface AvatarProps {
  user: UserType;
  direction?: "row" | "column";
  spacing?: number;
  size?: number;
  badge?: boolean;
  badgeSize?: string;
  type?: string;
  status?: StatusType;
  className?: string;
  isCurrentUser?: boolean;
}

export default function SizeAvatars({
  user,
  direction = "row",
  spacing = 2,
  size = 100,
  status = "online",
  badgeSize = "1rem",
  type = "status",
  badge = false,
  className,
  isCurrentUser = false,
}: AvatarProps) {
  return (
    <>
      {badge ? (
        <Stack direction={direction} spacing={spacing}>
          {/* <StatusBadge isCurrentUser={isCurrentUser}> */}
          <Avatar
            alt={user.username}
            src={
              user.profile_picture_url ||
              user.avatar ||
              `${process.env.NEXT_PUBLIC_DICEBEAR_API}${user.username}`
            }
            sx={{ width: size, height: size }}
          />
          <StatusBadge
            isCurrentUser={isCurrentUser}
            size={20}
            showBorder={false}
            className="absolute rounded-full bottom-6 right-4"
          />
          {/* </StatusBadge> */}
        </Stack>
      ) : (
        <Stack
          direction={direction}
          spacing={spacing}
          className={`${className}`}
        >
          <Avatar
            alt={user.username}
            src={
              user.profile_picture_url ||
              user.avatar ||
              `${process.env.NEXT_PUBLIC_DICEBEAR_API}${user.username}`
            }
            sx={{ width: size, height: size }}
          />
        </Stack>
      )}
    </>
  );
}
