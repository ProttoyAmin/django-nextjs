'use client'

import React, { useCallback, useState } from 'react'
import { useAppSelector } from '@/src/redux-store';
import Image from 'next/image';
import Button from '@/src/app/components/atoms/Button';
import Link from 'next/link';
import { Club, UserClub } from '@/src/types/club';
import { joinClub } from '@/src/libs/auth/actions/clubs.actions';
import { useAppDispatch } from '@/src/redux-store';
import { addUserClub } from '@/src/redux-store/slices/user';
import { useRouter } from 'next/navigation';

function ListClubs({ clubs }: { clubs: UserClub[] }) {
    const userClubs = useAppSelector((state) => state.user.currentUser?.clubs);
    const router = useRouter();
    const dispatch = useAppDispatch();

    console.log('userClubs', userClubs)
    console.log('clubs', clubs)

    const getButtonName = (club: UserClub) => {
        const isJoined = userClubs?.some((userClub: UserClub) => userClub?.club_id === club?.club_id);
        if (isJoined) return 'Visit';
        return 'Join';
    }

    const handleButtonClick = useCallback(async (club: UserClub) => {
        if (getButtonName(club) === 'Join') {
            if (!club.is_public) {
                confirm('Are you sure you want to join this club?')
            }
            try {
                const response = await joinClub(club.id);
                if (response.success) {
                    dispatch(addUserClub({
                        club_id: club.club_id,
                        club_name: club.club_name,
                        club_slug: club.club_slug,
                        club_avatar: club.club_avatar,
                        is_public: club.is_public,
                        is_visible: club.is_visible,
                        is_active: club.is_active,
                        club_url: `/clubs/${club.club_id}`,
                        role: club.role_name!,
                        joined_at: new Date().toISOString(),
                    }));
                }
            } catch (error) {
                console.error("Failed to join club", error);
            }
        } else if (getButtonName(club) === 'Visit') {
            router.push(`/clubs/${club.club_id}`);
        }
    }, [userClubs]);

    return (
        <>
            <div className="p-4">
                <div className="space-y-2">
                    {clubs?.map((club: UserClub, index: number) => (
                        <div key={club?.club_id || `${index}`} className='flex items-center gap-3 p-3 rounded-lg justify-between'>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Link href={`/clubs/${club?.club_id}/`}>
                                        <Image src={club?.club_avatar || `${process.env.NEXT_PUBLIC_DICEBEAR_API}${club?.club_slug}`} alt="" width={40} height={40} className='w-10 h-10 rounded-full transition-transform duration-200 hover:scale-110' />
                                    </Link>
                                </div>
                                <div>
                                    <Link href={`/clubs/${club?.club_id}`}>
                                        <p>{club?.club_name}</p>
                                    </Link>
                                </div>
                            </div>
                            <Button
                                name={getButtonName(club)}
                                variant="default"
                                size="squared"
                                onClick={() => handleButtonClick(club)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default React.memo(ListClubs)