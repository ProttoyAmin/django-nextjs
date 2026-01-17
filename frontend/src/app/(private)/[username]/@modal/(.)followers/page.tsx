// app/[username]/@modal/(.)followers/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import FollowersList from "../../../profile/components/FollowersList";
import { useProfileUser } from "@/src/hooks/useProfileUser";
import { checkUser } from "@/src/hooks/checkUser";
import Loader from "@/src/app/components/atoms/Loader";
import { ModalHeader } from "@/src/app/components/organisms/ModalHeader";
import { Modal } from "@/src/app/components/organisms/Modal";

export default function FollowersModal() {
  const router = useRouter();
  const params = useParams();
  const modalRef = useRef<HTMLDivElement>(null);
  const username = params.username as string;
  const { user, isLoading } = useProfileUser(username);
  const { currentUser } = checkUser(username);

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       modalRef.current &&
  //       !modalRef.current.contains(event.target as Node)
  //     ) {
  //       router.back();
  //     }
  //   };

  //   const handleEscape = (event: KeyboardEvent) => {
  //     if (event.key === "Escape") {
  //       router.back();
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   document.addEventListener("keydown", handleEscape);
  //   document.body.style.overflow = "hidden";

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //     document.removeEventListener("keydown", handleEscape);
  //     document.body.style.overflow = "unset";
  //   };
  // }, [router]);

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        router.back();
      }}
      page
      size="sm"
      className=""
    >
      <div className="">
        <div ref={modalRef} className="">
          <ModalHeader
            title="Followers"
            onClose={() => {
              router.back();
            }}
            className="border-b"
          />
          <React.Suspense fallback={<p>Loading...</p>}>
            <FollowersList user={user!} currentUser={currentUser} />
          </React.Suspense>
        </div>
      </div>
    </Modal>
  );
}
