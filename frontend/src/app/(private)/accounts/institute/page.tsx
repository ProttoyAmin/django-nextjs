"use client";

import React, { useEffect, useState, Suspense } from "react";
import { getInstituteCodesOnly } from "@/src/libs/auth/actions/institute.action";
import Form, { FormField } from "../../../components/organisms/Form";
import { RootState, useAppSelector } from "@/src/redux-store";
import InstituteDetails from "../components/InstituteDetails";
import Button from "@/src/app/components/atoms/Button";
import InstituteForm from "../components/InstituteForm";

function ConnectInstitutePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [toggleForm, setToggleForm] = useState(false);
  const user = useAppSelector((state: RootState) => state.user.currentUser);

  useEffect(() => {
    if (user?.institute) {
      setConnected(true);
    }
  }, [user]);

  if (!connected) {
    return (
      <>
        <div className="flex flex-col gap-4 items-center justify-center min-h-full">
          <h1 className="text-2xl font-bold">
            Connect your institute to get the facilitites
          </h1>
          <p>
            By connecting your institute, you will be able to access the
            features of the platform.
          </p>
          <Button
            name={toggleForm ? "Close" : "Connect Institute"}
            onClick={() => setToggleForm(!toggleForm)}
            variant="secondary"
            size="lg"
          />
          <Suspense fallback={<>is loading...</>}>
            {toggleForm && <InstituteForm isConnected={setConnected} />}
          </Suspense>
        </div>
      </>
    );
  } else {
    return (
      <>
        <InstituteDetails />
      </>
    );
  }
}

export default ConnectInstitutePage;
