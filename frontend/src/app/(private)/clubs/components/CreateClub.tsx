'use client'

import React, { useState } from 'react'
import Form from '@/src/app/components/organisms/Form';
import { FormField } from '@/src/app/components/organisms/Form';
import { createClub } from '@/src/libs/auth/actions/clubs.actions';
import { useAppDispatch } from '@/src/redux-store';
import { addUserClub } from '@/src/redux-store/slices/user';
import { useRouter } from 'next/navigation';

function CreateClub() {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const [formErrors, setFormErrors] = useState<any>(null)

    const createClubFormFields: FormField[] = [
        {
            name: "name",
            type: "text",
            label: "Club Name",
            placeholder: "Enter club name",
            required: true,
            floatingLabel: true
        },
        {
            name: "description",
            type: "text",
            label: "Description",
            placeholder: "Enter club description",
            required: true,
            floatingLabel: true
        },
        {
            name: "origin",
            type: "text",
            label: "Origin",
            placeholder: "Enter club origin",
            required: true,
            floatingLabel: true
        },
        {
            name: "select_privacy",
            type: "select",
            label: "Privacy",
            placeholder: "Select privacy",
            options: [
                { value: "public", label: "Public" },
                { value: "private", label: "Private" },
            ],
            default: "public",
        }
    ]

    const onSubmit = async (data: any) => {

        try {
            const response = await createClub(data)
            if (response.success && response.data) {
                dispatch(addUserClub({
                    club_id: response.data.id,
                    club_name: response.data.name,
                    club_slug: response.data.slug,
                    club_avatar: response.data.avatar,
                    is_public: response.data.is_public,
                    is_visible: response.data.is_visible,
                    is_active: response.data.is_active,
                    club_url: response.data.club_url || `/clubs/${response.data.id}`,
                    role: response.data.role,
                    joined_at: new Date().toISOString(),
                }));
                router.push(`/clubs/${response.data.id}`)
            } else {
                if (response.errors) {
                    Object.keys(response.errors).forEach((key) => {
                        if (formErrors) {
                            formErrors.setError(key, {
                                type: 'server',
                                message: response.errors[key]
                            });
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error(error)
        }

    }

    return (
        <Form
            fields={createClubFormFields}
            onSubmit={onSubmit}
            onFormMount={setFormErrors}
            resetOnSubmit={false}
            submitButton={{
                text: "Create Club",
                fullWidth: true,
                variant: "primary",
                size: "squared"
            }}
        />
    )
}

export default React.memo(CreateClub)