"use client";
import React, { useEffect, useState } from "react";
import { updateUserProfile } from "@/src/libs/auth/actions/user.actions";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { EditProfileType } from "@/types";
import Form from "@/src/app/components/organisms/Form";

function EditProfileForm() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<EditProfileType>();
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data: EditProfileType) => {
    setIsLoading(true)
    console.log("Form Data", data);

    try {
      const response = await updateUserProfile(data as any)
      console.log("response: ",response)
    } catch (error: any) {
      console.warn(error)
    }
  };

  const formFields = [
    {
      name: "first_name",
      label: "First Name",
      required: false,
      validation: {
        minLength: { value: 2, message: "Minimum 2 characters" },
        maxLength: { value: 50, message: "Maximum 50 characters" },
      },
      floatingLabel: true,
    },
    {
      name: "last_name",
      label: "Last Name",
      required: false,
      validation: {
        minLength: { value: 2, message: "Minimum 2 characters" },
        maxLength: { value: 50, message: "Maximum 50 characters" },
      },
      floatingLabel: true,
    },
    {
      name: "bio",
      label: "Bio",
      type: "textarea",
      required: false,
      floatingLabel: true
    },
  ];

  return (
    <>
      <Form
        fields={formFields as any}
        onSubmit={onSubmit}
        submitButton={{
          text: "Update Profile",
          loading: isLoading,
        }}
        className="max-w-md"
      />
    </>
  );
}

export default EditProfileForm;
