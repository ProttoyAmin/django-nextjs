'use client'

import { FormField } from '@/src/app/components/organisms/Form'
import React from 'react'
import Form from '@/src/app/components/organisms/Form'

function StaffForm() {
    const type = 'Staff'

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
            name: 'edu_mail',
            type: 'email',
            label: 'Professional Email',
            placeholder: 'Enter professional email',
            required: true,
            className: 'inputField',
            floatingLabel: true
        }
    ]


    const onSubmit = (data: any) => {
        console.log(data)
    }

    return (
        <div className='min-h-full w-full max-w-md mx-auto'>
            <Form fields={fields} onSubmit={onSubmit}
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

export default React.memo(StaffForm)