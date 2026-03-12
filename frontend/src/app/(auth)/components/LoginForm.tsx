"use client";
import {
  LoginUser,
  getUserDetails,
} from "@/src/libs/auth/actions/user.actions";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/src/redux-store/hooks";
import { LForm } from "@/types";
import { login } from "@/src/redux-store/slices/auth";
import React, { useState } from "react";
import { handleUserLogin } from "@/src/redux-store";
import Form, { FormField } from "../../components/organisms/Form";
import { Spinner } from "@material-tailwind/react";

function LoginForm() {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<any>(null);
  const {
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LForm>();
  const router = useRouter();

  const onSubmit = async (data: LForm) => {
    setIsLoading(true);
    const response = await LoginUser(data);
    if (response.success) {
      if (formErrors) {
        formErrors.reset();
      }
      dispatch(login());

      const userResponse = await getUserDetails();
      if (userResponse.success) {
        handleUserLogin(dispatch, userResponse.data);
      }

      reset();
      router.push("/");
    } else {
      Object.keys(response.errors).forEach((key) => {
        if (formErrors) {
          formErrors.setError(key, {
            type: "server",
            message: response.errors[key],
          });
        }
      });
    }
  };

  const fields: FormField[] = [
    {
      name: "username_or_email",
      type: "text",
      label: "Username or Email",
      placeholder: "Enter username or email",
      required: true,
      className: "inputField",
      floatingLabel: true,
    },
    {
      name: "password",
      type: "password",
      label: "Password",
      placeholder: "Enter password",
      required: true,
      className: "inputField",
      floatingLabel: true,
    },
  ];

  return (
    <>
      <div className="min-h-full w-full max-w-md mx-auto">
        <Form
          fields={fields}
          onSubmit={onSubmit}
          onFormMount={setFormErrors}
          resetOnSubmit={false}
          submitButton={{
            text: "Login",
            type: "submit",
            variant: "primary",
            size: "squared",
            fullWidth: true,
          }}
        />
      </div>
    </>
  );
}

export default React.memo(LoginForm);
