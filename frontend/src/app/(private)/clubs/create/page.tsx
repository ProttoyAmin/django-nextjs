'use client'

import React from 'react';
import CreateClub from '../components/CreateClub';

function CreateClubPage() {
    return (
        <div className='w-full p-4'>
            <h1 className='text-2xl font-bold text-center'>Create Club</h1>
            <CreateClub />
        </div>
    )
}

export default CreateClubPage