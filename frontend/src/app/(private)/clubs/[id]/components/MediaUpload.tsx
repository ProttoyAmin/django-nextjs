'use client'

import React from 'react';
import Form, { FormField } from '@/src/app/components/organisms/Form';
import { useAppSelector } from '@/src/redux-store';
import Image from 'next/image';
import Button from '@/src/app/components/atoms/Button';
import { useAppDispatch } from '@/src/redux-store';

interface MediaUploadProps {
    clubId: string;
    type: 'club' | 'post' | 'event' | 'profile';
    formFields: FormField[];
    onSubmit: (data: any) => void;
    handleClose?: () => void;
    onRemove?: (data: any) => void;
}

function MediaUpload({ clubId, type, formFields, onSubmit, handleClose, onRemove }: MediaUploadProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState('')
    // console.log("MediaUpload rendered!!!")




    if (type === 'club') {
        const club = useAppSelector((state) => state.club.entities[clubId])
        const dispatch = useAppDispatch()
        if (!club) {
            // dispatch(getClubById(clubId))
        }


        return (
            <>
                <div className="p-6 h-full flex-1 overflow-y-auto ">
                    {club.avatar && (
                        <div className="mb-8 flex justify-center">
                            <Image
                                src={club.avatar || `${process.env.NEXT_PUBLIC_DICEBEAR_API}${club?.name}`}
                                alt="Current profile"
                                width={160}
                                height={160}
                                className="w-40 h-40 rounded-full object-cover border-2 border-gray-200"
                            />
                        </div>
                    )}

                    <Form
                        fields={formFields}
                        onSubmit={onSubmit}
                        submitButton={{
                            text: isSubmitting ? 'Uploading...' : 'Upload New Image',
                            disabled: isSubmitting,
                            loading: isSubmitting,
                            fullWidth: true,
                            variant: 'ghost',
                            size: 'squared'
                        }}
                        className="mb-6"
                    />

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md text-sm bounce-up-active">
                            {error}
                        </div>
                    )}
                </div>
            </>
        )
    }

    if (type === 'profile') {
        const user = useAppSelector((state) => state.user.currentUser)
        return (
            <>
                <div className="p-6 h-full flex-1 overflow-y-auto ">
                    {user?.profile_picture_url && (
                        <div className="mb-8 flex justify-center">
                            <Image
                                src={user?.profile_picture_url || `${process.env.NEXT_PUBLIC_DICEBEAR_API}${user?.username}`}
                                loading="eager"
                                alt="Current profile"
                                width={160}
                                height={160}
                                className="w-40 h-40 rounded-full object-cover border-2 border-gray-200"
                            />
                        </div>
                    )}

                    <Form
                        fields={formFields}
                        onSubmit={onSubmit}
                        submitButton={{
                            text: isSubmitting ? 'Uploading...' : 'Change Club Avatar',
                            disabled: isSubmitting,
                            loading: isSubmitting,
                            fullWidth: true,
                            variant: 'ghost',
                            size: 'squared'
                        }}
                        className="mb-6"
                    />

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md text-sm bounce-up-active">
                            {error}
                        </div>
                    )}
                </div>
            </>
        )
    }
}

export default React.memo(MediaUpload)