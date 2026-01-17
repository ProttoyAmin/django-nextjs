'use client'

import React, { useEffect } from 'react'
import ListMembers from '../../components/ListMembers';
import { useParams } from 'next/navigation';
import { ClubMember, fetchClubMembersThunk } from '@/src/redux-store/slices/club';
import { useAppDispatch, useAppSelector } from '@/src/redux-store';

function Members() {
    const { id } = useParams();
    const clubId = id as string
    const dispatch = useAppDispatch();
    const membersData = useAppSelector((state) => state.club.members[clubId]);
    const isLoading = useAppSelector((state) => state.club.isLoading);

    useEffect(() => {
        dispatch(fetchClubMembersThunk({ clubId }));
    }, [clubId, dispatch]);

    const handleMemberClick = (member: ClubMember) => {
        console.log('Member clicked:', member);
        // Navigate to member details or open modal
    };

    const handleRoleClick = (role: string) => {
        console.log('Role clicked:', role);
        // Filter by role or show role details
    };
    return (
        <>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Club Members</h1>
                    <p className="mt-2">
                        Manage and view all members of your club
                    </p>
                </div>

                <ListMembers
                    membersData={membersData}
                />
            </div>
        </>
    )
}

export default Members