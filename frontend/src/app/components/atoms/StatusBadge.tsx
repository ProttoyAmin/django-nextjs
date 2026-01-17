// import Badge from "@mui/material/Badge";
// import { styled } from "@mui/material/styles";
// import { useState, MouseEvent, useEffect } from "react";
// import Menu from "@mui/material/Menu";
// import MenuItem from "@mui/material/MenuItem";
// import ListItemIcon from "@mui/material/ListItemIcon";
// import ListItemText from "@mui/material/ListItemText";
// import { Circle } from "lucide-react";
// import { updateUserProfile } from "@/src/libs/auth/actions/user.actions";
// import { UserType } from "@/types";
// import { setUser } from "@/src/redux-store";
// import { useAppDispatch, useAppSelector } from "@/src/redux-store";

// type StatusType = "online" | "away" | "dnd";

// interface StatusBadgeProps {
//   children: React.ReactNode;
//   isCurrentUser?: boolean;
// }

// const getStatusColor = (status: StatusType) => {
//   switch (status) {
//     case "online":
//       return "#44b700";
//     case "away":
//       return "#424242ff";
//     case "dnd":
//       return "#f44336";
//     default:
//       return "#44b700";
//   }
// };

// const getStatusLabel = (status: StatusType) => {
//   switch (status) {
//     case "online":
//       return "Online";
//     case "away":
//       return "Away";
//     case "dnd":
//       return "Do Not Disturb";
//     default:
//       return "Online";
//   }
// };

// const StyledStatusBadge = styled(Badge)<{
//   statuscolor: string;
//   iscurrentuser: string;
// }>(({ theme, statuscolor, iscurrentuser }) => ({
//   "& .MuiBadge-badge": {
//     backgroundColor: statuscolor,
//     color: statuscolor,
//     width: "1rem",
//     height: "1rem",
//     borderRadius: "50%",
//     boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
//     cursor: iscurrentuser === "true" ? "pointer" : "default",
//   },
// }));

// export default function StatusBadge({
//   children,
//   isCurrentUser = false,
// }: StatusBadgeProps) {
//   const dispatch = useAppDispatch();
//   const user = useAppSelector((state) => state.user.targetUser);
//   const currentStatus = user?.status || "online";
//   const statusColor = getStatusColor(currentStatus as StatusType);

//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const open = Boolean(anchorEl);

//   const statusOptions: StatusType[] = ["online", "away", "dnd"];

//   const handleBadgeClick = (event: MouseEvent<HTMLElement>) => {
//     if (!isCurrentUser) return;
//     event.stopPropagation();
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const handleStatusChange = async (newStatus: StatusType) => {
//     try {
//       await updateUserProfile({
//         status: newStatus,
//       } as UserType);

//       dispatch(
//         setUser({
//           status: newStatus,
//           is_status_manual: newStatus !== "online",
//         } as UserType)
//       );
//     } catch (error) {
//       console.warn(error);
//     }
//     handleClose();
//   };

//   return (
//     <>
//       <div onClick={handleBadgeClick}>
//         <StyledStatusBadge
//           overlap="circular"
//           anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//           variant="dot"
//           statuscolor={statusColor}
//           iscurrentuser={isCurrentUser ? "true" : "false"}
//           sx={{ "& .MuiBadge-badge": { width: "1rem", height: "1rem" } }}
//         >
//           {children}
//         </StyledStatusBadge>
//       </div>

//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleClose}
//         onClick={(e) => e.stopPropagation()}
//         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//         transformOrigin={{ vertical: "top", horizontal: "right" }}
//         slotProps={{
//           paper: {
//             sx: { minWidth: 200, mt: 1 },
//           },
//         }}
//       >
//         {statusOptions.map((statusOption) => (
//           <MenuItem
//             key={statusOption}
//             onClick={() => handleStatusChange(statusOption)}
//             selected={currentStatus === statusOption}
//             sx={{ py: 1.5 }}
//           >
//             <ListItemIcon>
//               <Circle
//                 size={16}
//                 fill={getStatusColor(statusOption)}
//                 color={getStatusColor(statusOption)}
//               />
//             </ListItemIcon>
//             <ListItemText>{getStatusLabel(statusOption)}</ListItemText>
//           </MenuItem>
//         ))}
//       </Menu>
//     </>
//   );
// }

import { useAppSelector } from "@/src/redux-store";
import React from "react";

type props = {
  isCurrentUser?: boolean;
  size?: number;
  className?: string;
  showBorder?: boolean;
};

function StatusBadge({
  isCurrentUser,
  size = 12,
  className = "",
  showBorder = false,
}: props) {
  const status = isCurrentUser
    ? useAppSelector((state) => state?.user?.currentUser?.status)
    : useAppSelector((state) => state?.user?.targetUser?.status);

  // Default status if undefined
  const currentStatus = status || "offline";

  // Size-based styles
  const containerSize = size + 4; // Add padding
  const dotSize = size;
  const borderSize = size / 4;

  // Status colors and styles
  const statusStyles = {
    online: {
      dot: "bg-green-500",
      border: "border-green-600",
      symbol: null,
      title: "Online",
    },
    away: {
      dot: "bg-gray-400",
      border: "border-gray-300",
      symbol: null,
      title: "Away",
    },
    dnd: {
      dot: "bg-red-500",
      border: "border-red-900",
      symbol: null,
      title: "Do Not Disturb",
    },
  };

  const style =
    statusStyles[currentStatus.toLowerCase() as keyof typeof statusStyles] ||
    statusStyles.online;

  return (
    <div className={`${className}`} title={style.title}>
      {showBorder && (
        <div
          className={`${style.border}`}
          style={{
            width: containerSize,
            height: containerSize,
          }}
        />
      )}

      {/* Status dot */}
      <div
        className={`rounded-full ${style.dot}`}
        style={{
          width: dotSize,
          height: dotSize,
        }}
      >
        {style.symbol}
      </div>
    </div>
  );
}

export default StatusBadge;
