'use client'

import React, { useState } from 'react';
import Form, { FormField } from '@/src/app/components/organisms/Form';

function CreateRoles({ onSubmit, formMount }: { onSubmit: (data: any) => void, formMount: (formErrors: any) => void }) {

    const formFields: FormField[] = [
        {
            name: "name",
            label: "Role Name",
            type: "text",
            floatingLabel: true,
            required: true,
            placeholder: "Enter name",
        },
        {
            name: "color",
            // label: "Color",
            type: "color",
            required: false,
            placeholder: "Enter color",
        },
        {
            name: "can_manage_members",
            label: "Can manage members",
            type: "checkbox",
            required: false,
        },
        {
            name: "can_manage_posts",
            label: "Can manage posts",
            type: "checkbox",
            required: false,
        },
        {
            name: "can_manage_events",
            label: "Can manage events",
            type: "checkbox",
            required: false,
        },
        {
            name: "can_manage_settings",
            label: "Can manage settings",
            type: "checkbox",
            required: false,
        },
    ]
    return (
        <div>
            <Form
                onSubmit={onSubmit}
                fields={formFields}
                onFormMount={formMount}
                submitButton={
                    {
                        text: "Create Role",
                        type: "submit",
                        variant: "primary",
                        size: "md",
                        fullWidth: true
                    }
                }
                resetOnSubmit={false}
            />
        </div>
    )
}

export default CreateRoles