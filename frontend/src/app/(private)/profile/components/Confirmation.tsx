import Button from "@/src/app/components/atoms/Button";
import { Check, X } from "lucide-react";
import React, { useState } from "react";
import {
  acceptFollowRequest,
  rejectFollowRequest,
} from "@/src/libs/auth/actions/follow.actions";
import { UserType } from "@/types";
import { toast } from "sonner";

function Confirmation({ user }: { user: UserType }) {
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);

  const handleConfirm = async () => {
    setAccepted(true);
    try {
      const response = await acceptFollowRequest(user?.id);
      if (response.success) {
        toast.success("Follow request accepted");
      } else {
        toast.error("Failed to accept follow request");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleReject = async () => {
    setRejected(true);
    try {
      const response = await rejectFollowRequest(user?.id);
      if (response.success) {
        toast.success("Follow request rejected");
      } else {
        toast.error("Failed to reject follow request");
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      {!accepted && !rejected && (
        <div className="">
          <div className="flex items-end justify-end">
            <Button
              name="Confirm"
              variant="default"
              size="squared"
              icon={<Check size={18} color="white" stroke="green" />}
              onClick={handleConfirm}
            />
            <Button
              name="Reject"
              variant="default"
              size="squared"
              icon={<X size={18} color="white" stroke="red" />}
              onClick={handleReject}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Confirmation;
