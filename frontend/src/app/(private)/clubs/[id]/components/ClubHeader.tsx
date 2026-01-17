'use client'

import { useAppSelector } from '@/src/redux-store';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { Modal } from '@/src/app/components/organisms/Modal';
import { ModalHeader } from '@/src/app/components/organisms/ModalHeader';
import { FormField } from '@/src/app/components/organisms/Form';
import { useAppDispatch } from '@/src/redux-store';
import { postClubMediaThunk, fetchClub } from '@/src/redux-store/slices/club';
import React, { useEffect } from 'react'
import MediaUpload from './MediaUpload';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ClubHeader() {
    const [showModal, setShowModal] = useState(false)
    const { id } = useParams();
    const clubId = id as string
    const club = useAppSelector((state) => state.club.entities[clubId])
    const dispatch = useAppDispatch()
    const router = useRouter()

    useEffect(() => {
        if (!club && clubId) {
            dispatch(fetchClub({ clubId }));
        }
    }, [clubId, club, dispatch]);

    const onSubmit = (data: any) => {
        const avatarFile = Array.isArray(data.avatar) && data.avatar.length > 0 ? data.avatar[0] : data.avatar;
        dispatch(postClubMediaThunk({ clubId, avatar: avatarFile }))
    }

    const avatarForm: FormField[] = [
        {
            name: 'avatar',
            label: 'Upload New Avatar',
            type: 'file',
            accept: 'image/*',
            required: true,
            layout: {
                colSpan: 12
            }
        }
    ]
    return (
        <>
            <div className="cursor-pointer" onClick={() => router.push(`/clubs/${clubId}`)}>
                {/* <Link href={`clubs/${clubId}`}> */}
                <Image src={club?.avatar || `${process.env.NEXT_PUBLIC_DICEBEAR_API}${club?.name}`} alt="Avatar" width={40} height={40} className='rounded-full w-24 h-24 object-cover' />
                {/* </Link> */}
                {/* {showModal &&
                    <>
                        <Modal
                            isOpen={showModal}
                            onClose={() => setShowModal(false)}
                            size='sm'
                        >
                            <ModalHeader
                                title="Change Club Avatar"
                                onClose={() => setShowModal(false)}
                            />
                            <MediaUpload clubId={clubId} type={'club'} formFields={avatarForm} onSubmit={onSubmit} handleClose={() => setShowModal(false)} />
                        </Modal>
                    </>
                } */}
            </div>
            <div className="text-xl font-semibold">
                {club?.name}
            </div>
        </>
    )
}