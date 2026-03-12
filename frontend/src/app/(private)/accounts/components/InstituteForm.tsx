"use client";

import Form, { FormField } from "@/src/app/components/organisms/Form";
import {
  authenticateUserType,
  getInstituteCodesOnly,
} from "@/src/libs/auth/actions/institute.action";
import { connectUserToInstitute } from "@/src/libs/auth/actions/user.actions";
import { useEffect, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

function InstituteForm({
  isConnected,
}: {
  isConnected: (connected: boolean) => void;
}) {
  const [instituteOptions, setInstituteOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formMethods, setFormMethods] = useState<UseFormReturn<FieldValues>>();

  useEffect(() => {
    const fetchInstituteCodes = async () => {
      setIsLoading(true);
      try {
        const res = await getInstituteCodesOnly();

        if (res?.success && res.data?.results) {
          const options = res.data.results.map((institute: any) => ({
            value: institute.id,
            label: institute.code,
          }));
          setInstituteOptions(options);
        }
      } catch (error) {
        console.error("Error fetching institute codes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstituteCodes();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const res = await connectUserToInstitute(data);
      console.log("response", res);

      if (res?.success) {
        console.log("Authentication successful", res.data);
        isConnected(true);
      } else if (res?.errors) {
        Object.keys(res.errors).forEach((key) => {
          if (formMethods) {
            formMethods.setError(key, {
              type: "server",
              message: res.errors[key],
            });
          }
        });
      } else {
        console.error("Unknown error during authentication", res);
      }
    } catch (error) {
      console.error("Error authenticating user type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formFields: FormField[] = [
    {
      name: "user_type",
      label: "Type",
      placeholder: "None",
      type: "select",
      required: true,
      options: [
        {
          label: "Student",
          value: "student",
        },
        {
          label: "Faculty",
          value: "faculty",
        },
        {
          label: "Alumni",
          value: "alumni",
        },
      ],
    },
    {
      name: "institute",
      label: "Institute",
      type: "combobox",
      placeholder: "None",
      options: instituteOptions,
      info: true,
      required: true,
      layout: {
        colSpan: 1,
        className: "md:col-span-1",
      },
    },
    {
      name: "professional_email",
      label: "Professional Email",
      type: "email",
      required: true,
      layout: {
        colSpan: 1,
        className: "md:col-span-1",
      },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      layout: {
        colSpan: 1,
        className: "md:col-span-1",
      },
    },
  ];
  return (
    <div className="w-1/2">
      <Form
        fields={formFields}
        onSubmit={onSubmit}
        onFormMount={(methods) => setFormMethods(methods)}
        submitButton={{
          text: "Connect Institute",
          loading: isLoading,
          fullWidth: true,
          variant: "primary",
          size: "lg",
        }}
      />
    </div>
  );
}

export default InstituteForm;
