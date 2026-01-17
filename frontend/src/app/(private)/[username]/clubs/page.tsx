'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/src/hooks/useUser';

function UserClubsPage() {
    const router = useRouter()
    const { user } = useUser();
    useEffect(() => {
        if (user?.username) {
            router.replace(`/${user.username}`);
        }
    }, [user, router]);
    return (
        <>
        </>
    )
}

export default UserClubsPage