"use client";

import React, { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/src/redux-store';
import { PostType } from '@/src/types/post';
import ShowPost from '@/src/app/components/organisms/ShowPost';
import Update from '@/src/app/components/organisms/Update';
import { UseFormReturn } from 'react-hook-form';

interface UpdatePostProps {
    post: PostType;
    className?: string;
    onFormMount?: (methods: UseFormReturn) => void;
}

const UpdatePost = ({ post, className, onFormMount }: UpdatePostProps) => {
    const router = useRouter();

    return (
        <>
            <div className="flex justify-between items-center h-full w-full">
                <div className="flex h-full w-full">
                    <div className="w-2/3 overflow-hidden h-full">
                        {post && <ShowPost post={post} type='media' />}
                    </div>
                    <div className="w-1/3 overflow-hidden h-full">
                        {post && <Update
                            post={post}
                            type='post'
                            onFormMount={onFormMount} // Pass the callback down
                        />}
                    </div>
                </div>
            </div>
        </>
    )
}

export default UpdatePost