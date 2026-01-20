'use client'

import { FormField } from '@/src/app/components/organisms/Form'
import React from 'react'
import Form from '@/src/app/components/organisms/Form'
import { registerUser } from '@/src/libs/auth/actions/user.actions'
import { useRouter } from 'next/navigation'

function FacultyForm() {

    const type = 'Faculty'
    const router = useRouter()

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
            label: 'Repeat Password',
            placeholder: 'Repeat password',
            required: true,
            className: 'inputField',
            floatingLabel: true
        },
        {
            name: 'professional_email',
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


    const [formMethods, setFormMethods] = React.useState<any>(null);

    const onSubmit = async (data: any) => {
        try {
            const result = await registerUser(data)
            if (result.success) {
                if (formMethods) {
                    formMethods.reset();
                }
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
            }
        } catch (error: any) {
            console.log(error)
        }
    }

    return (
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
                    fullWidth: true
                }}
            />

        </div>
    )
}

export default React.memo(FacultyForm)