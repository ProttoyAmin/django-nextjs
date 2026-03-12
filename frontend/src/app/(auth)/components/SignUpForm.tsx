"use client";
import React, { useState, useEffect } from "react";
import {
  RegisterUser,
  registerUser,
} from "@/src/libs/auth/actions/user.actions";
import { useRouter } from "next/navigation";
import { RForm } from "@/types";
import Form, { FormField } from "../../components/organisms/Form";
import { signupSchema } from "@/src/libs/validation/signup.schema";
// import { getInstituteCodesOnly } from "@/src/libs/auth/actions/institute.action";
// import { Institute } from "@/src/types/institute";

function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [instituteOptions, setInstituteOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [formMethods, setFormMethods] = useState<HTMLFormElement>();
  const router = useRouter();

  // useEffect(() => {
  //   const fetchInstituteCodes = async () => {
  //     setIsLoading(true);
  //     try {
  //       const res = await getInstituteCodesOnly();

  //       if (res?.success && res.data?.results) {
  //         const options = res.data.results.map((institute: Institute) => ({
  //           value: institute.id,
  //           label: institute.code,
  //         }));
  //         setInstituteOptions(options);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching institute codes:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchInstituteCodes();
  // }, []);

  const onSubmit = async (data: RForm) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);
      if (result.success) {
        if (formMethods) {
          formMethods.reset();
        }
        router.push("/login");
      } else {
        if (result.errors) {
          Object.keys(result.errors).forEach((key) => {
            if (formMethods) {
              formMethods.setError(key, {
                type: "server",
                message: result.errors[key],
              });
            }
          });
        }
      }
    } catch (error: any) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const fields: FormField[] = [
    {
      name: "username",
      type: "text",
      label: "Username",
      placeholder: "Enter username",
      required: true,
      className: "inputField",
      floatingLabel: true,
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      placeholder: "Enter email",
      required: true,
      className: "inputField",
      floatingLabel: true,
    },
    {
      name: "password",
      type: "password",
      score: true,
      label: "Password",
      placeholder: "Enter password",
      required: true,
      className: "inputField",
      floatingLabel: true,
    },
    {
      name: "re_password",
      type: "password",
      label: "Confirm Password",
      placeholder: "Confirm password",
      required: true,
      className: "inputField",
      floatingLabel: true,
    },
    // {
    //   name: "professional_email",
    //   type: "email",
    //   label: "Professional Email",
    //   placeholder: "Enter professional email",
    //   required: false,
    //   className: "inputField",
    //   floatingLabel: true,
    // },
    // {
    //   name: "institute",
    //   type: "select",
    //   label: "Institute",
    //   placeholder: isLoading ? "Loading codes..." : "Select institute code",
    //   required: false,
    //   className: "inputField",
    //   floatingLabel: true,
    //   options: instituteOptions,
    // },
  ];

  return (
    <div className="min-h-full w-full max-w-md mx-auto">
      <Form
        fields={fields}
        schema={signupSchema}
        onSubmit={onSubmit}
        onFormMount={setFormMethods as any}
        resetOnSubmit={false}
        submitButton={{
          text: "Register",
          type: "submit",
          variant: "primary",
          size: "squared",
          fullWidth: true,
          loading: isLoading,
        }}
      />
    </div>
  );
}

export default React.memo(SignUpForm);
