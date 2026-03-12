"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/redux-store";
import { selectClubById } from "@/src/redux-store/slices/club/selectors";
import {
  fetchClub,
  fetchClubMembersThunk,
  joinClubThunk,
  leaveClubThunk,
} from "@/src/redux-store/slices/club";
import Image from "next/image";
import Button from "@/src/app/components/atoms/Button";
import Loader from "@/src/app/components/atoms/Loader";
import { Globe, Lock, MoreHorizontal, Share2 } from "lucide-react";
import { Club } from "@/src/types/club";
import { Modal } from "@/src/app/components/organisms/Modal";
import ListClubPosts from "../components/ListClubPosts";
import Options from "@/src/app/components/organisms/Options";
import { canManagePosts, canViewSettings } from "@/src/utils/permissions";
import { useUser } from "@/src/hooks/useUser";
import { LockIcon } from "@/src/app/components/atoms/Icons";

function ClubPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const dispatch = useAppDispatch();
  const club = useAppSelector((state) => selectClubById(state, id));
  const userClub = useAppSelector((state) =>
    state.user.currentUser?.clubs.find((club) => club.club_id === id),
  );
  const [loading, setLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchClub({ clubId: id }));
    dispatch(fetchClubMembersThunk({ clubId: id }));
  }, [id, dispatch]);

  useEffect(() => {
    setLoading(false);
  }, [club]);

  // const handleCloseUserModal = () => {
  //   const params = new URLSearchParams(searchParams.toString());
  //   params.delete("modal");
  //   params.delete("username");
  //   router.replace(`?${params.toString()}`, { scroll: false });
  // };
  console.log("club", club);

  if (loading) return <Loader />;
  if (!club) return null;

  const getButtonName = (club: Club) => {
    if (club.is_member) return "Joined";
    return "Join Club";
  };

  const getAction = (club: Club) => {
    if (club.is_member) return "Leave Club";
    return "Join Club";
  };

  const handleAction = async () => {
    if (getAction(club) === "Join Club") {
      if (!club.is_public) {
        setShowJoinModal(true);
      } else {
        await confirmJoin();
      }
    } else if (getAction(club) === "Leave Club") {
      setShowLeaveModal(true);
    }
  };

  const confirmJoin = async () => {
    try {
      await dispatch(joinClubThunk({ clubId: club.id })).unwrap();
    } catch (error: any) {
      console.error(error);
    } finally {
      setShowJoinModal(false);
    }
  };

  const confirmLeave = async () => {
    try {
      await dispatch(leaveClubThunk({ clubId: club.id })).unwrap();
    } catch (error: any) {
      console.error(error);
    } finally {
      setShowLeaveModal(false);
    }
  };

  let hasPerm = false;
  if (club?.is_owner) {
    hasPerm = true;
  } else {
    hasPerm = canViewSettings(userClub?.role_permissions);
  }

  let options;

  if (hasPerm) {
    options = [
      {
        name: "Settings",
        onClick: () => router.push(`/clubs/${club.id}/settings/info`),
      },
      {
        name: "Cancel",
        onClick: () => setShowSettingsModal(false),
      },
    ];
  } else {
    options = [
      {
        name: "Share",
        onClick: () => console.log("Share"),
      },
      {
        name: "Cancel",
        onClick: () => setShowSettingsModal(false),
      },
    ];
  }

  return (
    <>
      <div className="w-full">
        <div className="relative h-48 md:h-80 w-full bg-gray-800">
          {club.banner ? (
            <Image
              src={club?.banner}
              alt={club?.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-blue-900 to-purple-900" />
          )}
        </div>

        <div className="px-4 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 -mt-10 md:-mt-10 mb-6 relative z-10">
            {/* Avatar */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-black overflow-hidden bg-gray-800 shrink-0">
              <Image
                src={
                  club?.avatar ||
                  `${process.env.NEXT_PUBLIC_DICEBEAR_API}${club?.slug}`
                }
                alt={`${club?.name}`}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 md:pt-0 md:pb-2">
              <div className="mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {club?.name}
                </h1>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  {club?.is_public ? (
                    <Globe size={16} />
                  ) : (
                    <LockIcon size={16} />
                  )}
                  <span>
                    {club?.is_public ? "Public group" : "Private group"}
                  </span>
                  <span>•</span>
                  <span>{club?.member_count} members</span>
                  <span>•</span>
                  <span>{club?.origin || "Global"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Button
                  name={getButtonName(club)}
                  variant={club?.is_member ? "secondary" : "secondary"}
                  size="sm"
                  onClick={handleAction}
                  className={""}
                />
                <Button
                  name="Invite"
                  variant="secondary"
                  size="sm"
                  className="bg-gray-800 text-white hover:bg-gray-700"
                />
                <Button
                  icon={<Share2 size={18} />}
                  variant="secondary"
                  size="sm"
                  className="bg-gray-800 text-white hover:bg-gray-700 px-3"
                />

                <Button
                  icon={<MoreHorizontal size={18} />}
                  onClick={() => setShowSettingsModal(true)}
                  variant="secondary"
                  size="sm"
                  className="bg-gray-800 text-white hover:bg-gray-700 px-3"
                />
              </div>
            </div>
          </div>

          {showSettingsModal && (
            <Modal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              size="sm"
            >
              <Options items={options} setAction={setShowSettingsModal} />
            </Modal>
          )}

          {/* Tabs */}
          {/* <div className="border-t border-gray-800">
            <div className="flex items-center gap-6 overflow-x-auto py-3 text-sm font-medium text-gray-400 scrollbar-hide">
              {[
                "Discussion",
                "Featured",
                "People",
                "Events",
                "Media",
                "Files",
              ].map((tab) => (
                <button
                  key={tab}
                  className={`whitespace-nowrap hover:text-white transition-colors ${
                    tab === "Discussion"
                      ? "text-blue-500 border-b-2 border-blue-500 -mb-[13px] pb-3"
                      : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div> */}
        </div>
      </div>

      {/* Club Posts */}
      {club?.is_member || club?.is_public ? (
        <ListClubPosts clubId={id} />
      ) : (
        <p className="text-center text-gray-400 mt-10">
          You must be a member of this club to view its posts.
        </p>
      )}

      {/* Modals */}
      {showJoinModal && (
        <Modal
          size="md"
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          close
        >
          <p>Join this club?</p>
          <div className="flex items-center gap-2">
            <Button
              name="Join"
              variant="ghost"
              size="squared"
              onClick={confirmJoin}
            />
            <Button
              name="Cancel"
              variant="secondary"
              size="squared"
              onClick={() => setShowJoinModal(false)}
            />
          </div>
        </Modal>
      )}

      {showLeaveModal && (
        <Modal
          size="md"
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          close
        >
          <p>Leave this club?</p>
          <div className="flex items-center gap-2">
            <Button
              name="Leave"
              variant="ghost"
              size="squared"
              onClick={confirmLeave}
            />
            <Button
              name="Cancel"
              variant="secondary"
              size="squared"
              onClick={() => setShowLeaveModal(false)}
            />
          </div>
        </Modal>
      )}

      {/* User Profile Modal - Triggered by query params */}
    </>
  );
}

export default ClubPage;
