"use client";

import { deleteRoleThunk, RoleType } from "@/src/redux-store/slices/roles";
import React, { useState } from "react";
import Badge from "@/src/app/components/atoms/Badge";

import {
  Edit,
  Trash2,
  Copy,
  Eye,
  Users,
  Shield,
  MoreVertical,
  User,
} from "lucide-react";
import DropdownMenu from "@/src/app/components/molecules/DropDownMenu";
import { useAppDispatch } from "@/src/redux-store/hooks";
import { useParams } from "next/navigation";
import { toast } from "sonner";

function ListRoles({ roles }: { roles: RoleType[] }) {
  const [selected, setSelected] = useState<string>();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const clubId = id as string;

  if (!roles || roles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No roles found. Create your first role!</p>
      </div>
    );
  }

  // Menu items for each role
  const getRoleMenuItems = (role: RoleType) => [
    {
      id: "view",
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: () => console.log("View role:", role.id),
    },
    {
      id: "edit",
      label: "Edit Role",
      icon: <Edit size={16} />,
      onClick: () => console.log("Edit role:", role.id),
    },
    {
      id: "assign",
      label: "Assign Members",
      icon: <Users size={16} />,
      onClick: () => console.log("Assign members to role:", role.id),
    },
    {
      id: "permissions",
      label: "Manage Permissions",
      icon: <Shield size={16} />,
      onClick: () => console.log("Manage permissions for role:", role.id),
    },
    { id: "divider-1", label: "", divider: true },
    {
      id: "delete",
      label: "Delete Role",
      icon: <Trash2 size={16} />,
      destructive: true,
      onClick: async () => {
        if (window.confirm(`Are you sure you want to delete "${role.name}"?`)) {
          const result = await dispatch(
            deleteRoleThunk({ clubId, roleId: String(role.id) }),
          );

          if (deleteRoleThunk.fulfilled.match(result)) {
            toast.success("Role deleted successfully");
          } else if (deleteRoleThunk.rejected.match(result)) {
            const error = result.payload;

            let message = "Failed to delete role";

            if (typeof error === "string") {
              message = error;
            } else if (error && typeof error === "object") {
              const firstValue = Object.values(error)[0];
              message =
                typeof firstValue === "string"
                  ? firstValue
                  : JSON.stringify(error);
            }

            toast.error(message);
          }
        }
      },
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles?.map((role, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: role?.color || "#3b82f6" }}
                    />
                    <h3 className="font-semibold text-lg">{role?.name}</h3>
                    {role?.is_default && (
                      <Badge
                        text="Default"
                        color="#10b981"
                        className="text-xs"
                      />
                    )}
                  </div>

                  {/* Permissions List */}
                  <div className="space-y-2 mb-4">
                    {Object.entries.length > 1 &&
                      Object?.entries(role?.permissions)?.map(
                        ([permission, value]: any, index: number) => (
                          <p
                            key={index}
                            className="text-sm text-gray-600 flex items-center gap-1"
                          >
                            <span className="w-2 h-2 bg-[#879b8c]"></span>
                            {permission.split("_").join(" ")}
                          </p>
                        ),
                      )}
                  </div>

                  {/* Member Count */}
                  {/* <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users size={14} />
                                    <span>{role?.?.length || 0} member{role?.members?.length !== 1 ? 's' : ''}</span>
                                </div> */}
                </div>

                {/* Three-dot menu button */}
                <div className="relative">
                  <DropdownMenu
                    items={getRoleMenuItems(role)}
                    onItemClick={(item: any) => {
                      console.log(
                        "Clicked menu item:",
                        item.id,
                        "for role:",
                        role.id,
                      );
                    }}
                    position="bottom"
                    alignment="end"
                    buttonClassName="p-1 hover:bg-gray-100 rounded"
                    menuClassName="min-w-[180px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ListRoles;
