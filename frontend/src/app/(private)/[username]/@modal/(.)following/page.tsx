// app/[username]/@modal/(.)followers/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import FollowingLists from "../../../profile/components/FollowingsList";
import { useUser } from "@/src/hooks/useUser";
import Loader from "@/src/app/components/atoms/Loader";
import { useProfileUser } from "@/src/hooks/useProfileUser";
import { ModalHeader } from "@/src/app/components/organisms/ModalHeader";
import { Modal } from "@/src/app/components/organisms/Modal";


export default function FollowersModal() {
  const router = useRouter();
  const params = useParams()
  const modalRef = useRef<HTMLDivElement>(null);
  const username = params.username as string;
  const { user, isLoading } = useProfileUser(username);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        router.back();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.back();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [router]);

  if (isLoading) {
    return (
      <Loader />
    );
  }

  return (
    <Modal isOpen={true} onClose={() => { router.back() }} page size='sm' className="">
      <div className="">
        <div
          ref={modalRef}
          className=""
        >
          <ModalHeader
            title="Following"
            onClose={() => {
              router.back();
            }}
            className="border-b"
          />
          <FollowingLists user={user} />
        </div>
      </div>
    </Modal>
  );
}