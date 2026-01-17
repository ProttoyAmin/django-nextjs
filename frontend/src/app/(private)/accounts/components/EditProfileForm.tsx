"use client";

import React, { useEffect, useState } from "react";
import { updateUserProfile, getUserDetails } from "@/src/libs/auth/actions/user.actions";
import { useRouter } from "next/navigation";
import Form, { FormField } from "@/src/app/components/organisms/Form";
import { getChangedFields, hasChanges } from "@/src/libs/utils/helpers";
import { UserType } from "@/types";
import Loader from "@/src/app/components/atoms/Loader";
import { setUser, useAppDispatch } from "@/src/redux-store";

function EditProfileForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<UserType | null>(null);
  const dispatch = useAppDispatch()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserDetails();
        if (userData) {
          setInitialData(userData.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    // Only send changed fields
    const changedData = getChangedFields<UserType>(data, initialData);

    if (!hasChanges<UserType>(data, initialData)) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await updateUserProfile(changedData as UserType);
      if (response) {
        dispatch(setUser(response.data))
        router.refresh();
      }
    } catch (error: any) {
      console.warn("Update error:", error);
      if (error.response?.data) {
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formFields: FormField[] = [
    {
      name: "first_name",
      label: "First Name",
      type: "text",
      default: initialData?.first_name || "",
      required: false,
      validation: {
        minLength: { value: 2, message: "Minimum 2 characters" },
        maxLength: { value: 50, message: "Maximum 50 characters" },
      },
      floatingLabel: true,
      layout: {
        colSpan: 6,
        className: "md:col-span-6"
      }
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      default: initialData?.last_name || "",
      required: false,
      validation: {
        minLength: { value: 2, message: "Minimum 2 characters" },
        maxLength: { value: 50, message: "Maximum 50 characters" },
      },
      floatingLabel: true,
      layout: {
        colSpan: 6,
        className: "md:col-span-6"
      }
    },
    {
      name: "department",
      label: "Department",
      type: "text",
      default: initialData?.department || "",
      validation: {
        maxLength: { value: 100, message: "Maximum 100 characters" },
      },
      floatingLabel: true,
      layout: {
        colSpan: 12,
        className: "md:col-span-12"
      }
    },
    {
      name: "year",
      label: "Year",
      type: "number",
      default: initialData?.year || 0,
      validation: {
        min: { value: 0, message: "Year must be a positive number" },
        max: { value: 10, message: "Year must be less than 10" },
      },
      floatingLabel: true,
      layout: {
        colSpan: 6,
        className: "md:col-span-6"
      }
    },
    {
      name: "student_id",
      label: "Student ID",
      type: "text",
      default: initialData?.student_id || "",
      validation: {
        minLength: { value: 1, message: "Minimum 1 character" },
        maxLength: { value: 20, message: "Maximum 20 characters" },
      },
      floatingLabel: true,
      layout: {
        colSpan: 6,
        className: "md:col-span-6"
      }
    },
    {
      name: "bio",
      label: "Bio",
      type: "textarea",
      default: initialData?.bio || "",
      floatingLabel: true,
      layout: {
        colSpan: 12,
        className: "md:col-span-12"
      },
      className: ""
    }
  ];

  if (!initialData) {
    return (
      <Loader />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Edit Profile</h1>
        <p className="text-gray-600">
          Update your profile information and preferences.
        </p>
      </div>

      <Form
        fields={formFields}
        onSubmit={onSubmit}
        submitButton={{
          text: "Update Profile",
          loading: isLoading,
          fullWidth: true,
          variant: "primary",
          size: "lg"
        }}
        defaultValues={initialData}
      />
    </div>
  );
}

export default EditProfileForm;