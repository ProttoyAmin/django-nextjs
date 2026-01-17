"use client";

import React, { useState } from "react";
import {
  ClubMembersResults,
  ClubMember,
  removeMemberFromClubThunk,
} from "@/src/redux-store/slices/club";
import Button from "@/src/app/components/atoms/Button";
import SizeAvatars from "@/src/app/components/organisms/Avatar";
import { UserType } from "@/types";
import Link from "next/link";
import { Modal } from "@/src/app/components/organisms/Modal";
import RoleSelect from "./RoleSelect";
import { useAppDispatch, useAppSelector } from "@/src/redux-store";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import UserModalProfile from "./UserModalProfile";
import { useSearchParams } from "next/navigation";

interface ListMembersProps {
  membersData: ClubMembersResults;
  type?: "assign" | "display";
}

function ListMembers({ membersData, type = "display" }: ListMembersProps) {
  const [method, setMethod] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const roles = useAppSelector((state) => state.roles.clubRoles);
  const members = membersData?.members;
  const params = useParams();
  const clubId = params.id as string;
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const modalUsername = searchParams.get("username");

  if (!members || !members.length) {
    return (
      <div className="text-center py-6 text-gray-500">No members found.</div>
    );
  }

  const formatRoles = (member: ClubMember): string => {
    const totalRoles = member.roles.length;
    const primaryRole = member.primary_role || "Member";
    const primaryRoleDetails = member.primary_role_details;

    if (totalRoles <= 1) {
      return primaryRoleDetails.name;
    }

    return `${primaryRoleDetails.name} +${totalRoles}`;
  };

  const handleAssignClick = (userId: string | number) => {
    setShowForm(true);
    setSelectedMember(userId.toString());
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setSelectedMember(null);
  };

  const handleRemoveMember = async (userId: string | number) => {
    setSelectedMember(userId.toString());
    if (window.confirm(`Are you sure you want to delete "${userId}"?`)) {
      const result = await dispatch(
        removeMemberFromClubThunk({ clubId, memberId: String(userId) })
      );

      if (removeMemberFromClubThunk.fulfilled.match(result)) {
        toast.success("Member deleted successfully");
      } else if (removeMemberFromClubThunk.rejected.match(result)) {
        const error = result.payload;

        let message = "Failed to delete member";

        if (typeof error === "string") {
          message = error;
        } else if (error && typeof error === "object") {
          const firstValue = Object.values(error)[0];
          message =
            typeof firstValue === "string" ? firstValue : JSON.stringify(error);
        }

        toast.error(message);
      }
    }
  };

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-start gap-4 p-4 justify-between rounded-lg transition-colors"
        >
          <Link
            href={`?profile=user&username=${member.username}`}
            scroll={false}
            className="flex items-center gap-2 flex-1 cursor-pointer'"
          >
            <SizeAvatars user={member as UserType} size={40} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{member.username}</h3>
              <p className="text-sm mt-1">{formatRoles(member)}</p>
            </div>
          </Link>

          {/* Optional: Add action icons (e.g., message, more options) here if needed */}
          {type === "assign" && (
            <>
              <Button
                name="Assign"
                variant="outline"
                onClick={() => {
                  handleAssignClick(member.user_id);
                  setMethod("assign");
                }}
              />
              <Button
                name="Remove Role"
                variant="outline"
                onClick={() => {
                  handleAssignClick(member.user_id);
                  setMethod("remove");
                }}
              />
            </>
          )}
          {type === "display" && (
            <Button
              name="Remove"
              variant="outline"
              onClick={() => handleRemoveMember(member.user_id)}
            />
          )}
        </div>
      ))}

      {/* Modal for the selected member */}
      {showForm && (
        <Modal isOpen={showForm} onClose={handleCloseModal} size="sm">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              Assign Role to User #{selectedMember}
            </h3>
            <RoleSelect
              roles={roles}
              userId={selectedMember!}
              onClose={handleCloseModal}
              method={method}
            />
          </div>
        </Modal>
      )}

      {modalUsername && (
        <UserModalProfile
          username={modalUsername}
          clubId={clubId as string}
          type="club"
        />
      )}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}

export default ListMembers;
