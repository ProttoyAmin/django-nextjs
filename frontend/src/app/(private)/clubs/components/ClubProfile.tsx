'use client'

import React from 'react'
import ProfileCard from '../../profile/components/ProfileCard'
import { useAppSelector } from '@/src/redux-store'
import { useUser } from '@/src/hooks/useUser'
import { checkUser } from '@/src/hooks/checkUser'

function ClubProfile({ clubId, username }: { clubId: string, username: string }) {

    const { user, currentUser, isLoading, errorMessage, isCurrentUser } =
        checkUser(username);
    const club = useAppSelector((state) => state.club.entities[clubId!]);

    console.log('user', user)
    return (
        <div>
            <ProfileCard
                user={user}
                isCurrentUser={isCurrentUser}
            />
        </div>
    )
}

export default ClubProfile