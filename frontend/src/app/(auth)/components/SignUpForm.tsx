"use client";
import React, { useState } from "react";
import { registerUser, RegisterUser } from "@/src/libs/auth/actions/user.actions";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/src/redux-store/hooks";
import { RForm } from "@/types";
import Button from "../../components/atoms/Button";
import Input from "../../components/atoms/Input";
import Form, { FormField } from "../../components/organisms/Form";

function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useAppDispatch();
  const router = useRouter();



  const [formMethods, setFormMethods] = React.useState<any>(null);

  const onSubmit = async (data: any) => {
    try {
      const result = await registerUser(data)
      if (result.success) {
        if (formMethods) {
          formMethods.reset();
        }
        setIsLoading(true)
        router.push('/login')
      } else {
        if (result.errors) {
          Object.keys(result.errors).forEach((key) => {
            if (formMethods) {
              formMethods.setError(key, {
                type: 'server',
                message: result.errors[key]
              });
            }
          });
        }
        setIsLoading(true)
      }
    } catch (error: any) {
      console.error(error)
      setIsLoading(true)
    }
  }


  const fields: FormField[] = [
    {
      name: 'username',
      type: 'text',
      label: 'Username',
      placeholder: 'Enter username',
      required: true,
      className: 'inputField',
      floatingLabel: true
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'Enter email',
      required: true,
      className: 'inputField',
      floatingLabel: true
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Enter password',
      required: true,
      className: 'inputField',
      floatingLabel: true
    },
    {
      name: 're_password',
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm password',
      required: true,
      className: 'inputField',
      floatingLabel: true
    },
    {
      name: 'edu_mail',
      type: 'email',
      label: 'Professional Email',
      placeholder: 'Enter professional email',
      required: true,
      className: 'inputField',
      floatingLabel: true
    },
    {
      name: 'type',
      type: 'select',
      label: 'Type',
      placeholder: 'Select user type',
      required: true,
      className: 'inputField',
      floatingLabel: true,
      options: [
        { value: 'faculty', label: 'Faculty' },
        { value: 'student', label: 'Student' },
        { value: 'staff', label: 'Staff' },
        { value: 'alumni', label: 'Alumni' },
      ]
    }
  ]


  return (
    // <div className="min-h-full w-full max-w-md mx-auto">
    //   <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    //     {errors.root?.serverError && (
    //       <div className="form">
    //         <p className="text-sm text-red-400">
    //           {errors.root.serverError.message}
    //         </p>
    //       </div>
    //     )}

    //     {/* Username Field */}
    //     <div className="form-field">
    //       <Input
    //         id="username"
    //         label="Username"
    //         type="text"
    //         className="inputField"
    //         floatingLabel={true}
    //         disabled={isSubmitting}
    //         error={errors.username}
    //         {...register("username", {
    //           required: "Username is required",
    //           minLength: { value: 3, message: "Minimum 3 characters" },
    //           maxLength: { value: 20, message: "Maximum 20 characters" },
    //         })}
    //       />
    //       {errors.username && (
    //         <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
    //       )}
    //     </div>

    //     {/* Email Field */}
    //     <div className="form-field">
    //       <Input
    //         id="email"
    //         label="Email"
    //         type="email"
    //         floatingLabel={true}
    //         disabled={isSubmitting}
    //         className="inputField"
    //         error={errors.email}
    //         {...register("email", {
    //           required: "Email is required",
    //           pattern: {
    //             value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    //             message: "Enter a valid email",
    //           },
    //         })}
    //       />
    //       {errors.email && (
    //         <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
    //       )}
    //     </div>

    //     <div className="form-field">
    //       <Input
    //         id="password"
    //         label="Password"
    //         type="password"
    //         className="inputField"
    //         floatingLabel={true}
    //         disabled={isSubmitting}
    //         error={errors.password}
    //         {...register("password", {
    //           required: "Password is required",
    //           minLength: { value: 3, message: "Minimum 3 characters" },
    //           maxLength: { value: 8, message: "Maximum 8 characters" },
    //         })}
    //       />
    //       {errors.password && (
    //         <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
    //       )}
    //     </div>

    //     <div className="form-field">
    //       <Input
    //         id="re_password"
    //         label="Repeat Password"
    //         type="password"
    //         className="inputField"
    //         floatingLabel={true}
    //         disabled={isSubmitting}
    //         error={errors.re_password}
    //         {...register("re_password", {
    //           required: "Password confirmation is required",
    //           minLength: { value: 3, message: "Minimum 3 characters" },
    //           maxLength: { value: 8, message: "Maximum 8 characters" },
    //         })}
    //       />
    //       {errors.re_password && (
    //         <p className="text-red-500 text-sm mt-1">
    //           {errors.re_password.message}
    //         </p>
    //       )}
    //     </div>

    //     <div className="form-field">
    //       <Input
    //         id="edu_mail"
    //         label="Academic Email"
    //         type="email"
    //         className="inputField"
    //         floatingLabel={true}
    //         disabled={isSubmitting}
    //         error={errors.edu_mail}
    //         {...register("edu_mail", {
    //           required: "Academic Email is required",
    //           pattern: {
    //             value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    //             message: "Enter a valid Education email",
    //           },
    //         })}
    //       />
    //       {errors.edu_mail && (
    //         <p className="text-red-500 text-sm mt-1">{errors.edu_mail.message}</p>
    //       )}
    //     </div>

    //     <Button
    //       name="Register"
    //       type="submit"
    //       loading={isSubmitting}
    //       disabled={isSubmitting}
    //       variant="primary"
    //       size='squared'
    //       fullWidth
    //     />
    //   </form>
    // </div>
    <>
      <div className='min-h-full w-full max-w-md mx-auto'>
        <Form
          fields={fields}
          onSubmit={onSubmit}
          onFormMount={setFormMethods}
          resetOnSubmit={false}
          submitButton={{
            text: 'Register',
            type: 'submit',
            variant: 'primary',
            size: 'squared',
            fullWidth: true,
          }}
        />

      </div>
    </>
  );
}

export default React.memo(SignUpForm);