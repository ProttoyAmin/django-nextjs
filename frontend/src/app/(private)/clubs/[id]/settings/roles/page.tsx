"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector, RootState } from "@/src/redux-store";
import { useParams } from "next/navigation";
import {
  createRoleThunk,
  fetchRolesThunk,
  ClubRoleType,
  RoleType,
} from "@/src/redux-store/slices/roles";
import { Loader, Plus } from "lucide-react";
import ListRoles from "../../components/ListRoles";
import CreateRoles from "../../components/CreateRoles";
import Tabs from "@/src/app/components/atoms/Tabs";
import Form from "@/src/app/components/organisms/Form";
import Button from "@/src/app/components/atoms/Button";
import { Modal } from "@/src/app/components/organisms/Modal";
import ListMembers from "../../components/ListMembers";
import toast, { Toaster } from "react-hot-toast";

function Roles() {
  const [activeTab, setActiveTab] = React.useState("display");
  const [createModal, setCreateModal] = React.useState(false);
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const clubId = id as string;

  const clubRolesData = useAppSelector(
    (state: RootState) => state.roles.clubRoles
  );
  const members = useAppSelector(
    (state: RootState) => state.club.members[clubId]
  );

  const isLoading = useAppSelector((state: RootState) => state.roles.loading);
  const error = useAppSelector((state: RootState) => state.roles.error);

  const roles = clubRolesData || [];

  useEffect(() => {
    dispatch(fetchRolesThunk({ clubId }));
  }, [clubId, dispatch]);

  const handleSubmit = async (data: any) => {
    const result = await dispatch(createRoleThunk({ clubId, data }));

    if (createRoleThunk.fulfilled.match(result)) {
      setCreateModal(false);
      toast.success("Role created successfully");
      dispatch(fetchRolesThunk({ clubId }));
    }

    if (createRoleThunk.rejected.match(result)) {
      const errors = result.payload as any;
      if (errors) {
        Object.keys(errors).forEach((key) => {
          const errorMessages = errors[key];
          if (Array.isArray(errorMessages)) {
            errorMessages.forEach((msg: string) => {
              toast.error(msg);
            });
          } else if (typeof errorMessages === "string") {
            toast.error(errorMessages);
          } else {
            toast.error("Role creation failed");
          }
        });
      } else {
        toast.error("Role creation failed");
      }
    }
  };

  if (error) {
    console.error("Roles error:", error);
  }

  const tabItems = [
    {
      id: "display",
      label: "Display",
      content: (
        <>
          {createModal && (
            <Modal
              isOpen={createModal}
              onClose={() => setCreateModal(false)}
              size="sm_vertical"
            >
              <div className="px-6 py-8">
                <CreateRoles
                  onSubmit={handleSubmit}
                  formMount={setCreateModal}
                />
              </div>
            </Modal>
          )}

          <div className="flex items-center justify-center gap-2 mb-6">
            <Form
              fields={[
                {
                  name: "search",
                  label: "Search",
                  type: "search",
                  floatingLabel: true,
                  required: true,
                },
              ]}
              onSubmit={() => setCreateModal(false)}
              customSubmitButton
            />
            <Button
              name="Create Role"
              variant="ghost"
              icon={<Plus size={16} />}
              onClick={() => setCreateModal(true)}
              className="w-40"
            />
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center">
                <Loader className="animate-spin" />
              </div>
            ) : (
              <ListRoles roles={roles!}/>
            )}
          </div>
        </>
      ),
    },
    {
      id: "assign",
      label: "Assign",
      content: <ListMembers membersData={members} type="assign" />,
    },
  ];

  return (
    <div>
      <Tabs
        items={tabItems}
        defaultActiveTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        variant="underline"
        orientation="horizontal"
        size="lg"
        lazyLoad={true}
        keepMounted={false}
      />

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

export default Roles;
