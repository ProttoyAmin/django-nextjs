"use client";

import { Modal } from "@/src/app/components/organisms/Modal";
import { ModalHeader } from "@/src/app/components/organisms/ModalHeader";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import ListClubs from "@/src/app/(private)/profile/components/ListClubs";
import { checkUser } from "@/src/hooks/checkUser";
import { getUserClubs } from "@/src/libs/auth/actions/user.actions";

function ClubsModal() {
  const params = useParams();
  const username = params.username as string;
  const { user, currentUser } = checkUser(username);
  const router = useRouter();
  const [clubs, setClubs] = React.useState<any>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  console.log("user", user);
  console.log("currentUser", currentUser);

  React.useEffect(() => {
    const fetchClubs = async () => {
      const response = await getUserClubs(user?.id);
      console.log("response", response);
      if (response.success && response.data?.clubs) {
        setClubs(response.data.clubs);
        setLoading(false);
      }
    };
    fetchClubs();
  }, [user]);

  return (
    <>
      <Modal
        isOpen={true}
        onClose={() => {
          router.back();
        }}
        size="sm"
      >
        <ModalHeader
          title="Clubs"
          onClose={() => {
            router.back();
          }}
          className="border-b"
        />
        <React.Suspense fallback={<p>Loading...</p>}>
          <ListClubs clubs={clubs} />
        </React.Suspense>
      </Modal>
    </>
  );
}

export default ClubsModal;
