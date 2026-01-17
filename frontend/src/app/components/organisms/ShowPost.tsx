'use client'

import { PostType, MediaFile } from '@/src/types/post'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import PostCarousel from './PostCarousel'
import { MessageCircle, Heart, LucideImages } from 'lucide-react'

function ShowPost({ post, type, contain }: { post: PostType, type?: string, contain?: boolean }) {
    const [medias, setMedias] = useState<MediaFile[]>(post.media_files || [])

    if (post.original_post !== null) {
        return null;
    }

    if (type === 'feed') {
        if (medias.length === 0 && !post.content) {
            return null;
        }

        return (
            <>
                <div className='w-full h-full'>
                    <PostCarousel post={post} />
                </div>
                <div className="p-3 w-full h-full">
                    {post.content && medias.length > 0 && (
                        <div className="mt-5 flex items-center gap-2">
                            <p className="text-sm font-bold">{post.author_username}</p>
                            <p className="text-sm">{post.content}</p>
                        </div>
                    )}
                </div>
            </>
        )
    }

    if (type === 'post') {
        if (medias.length === 0 && !post.content) {
            return null;
        }

        return (
            <div className='w-full h-full'>
                <PostCarousel post={post} />
            </div>
        )
    }

    if (type === 'media') {
        if (medias.length === 0) {
            return (
                <div className='w-full h-full flex items-center justify-center bg-gray-900/50'>
                    <p className="text-gray-400">No media available</p>
                </div>
            );
        }

        return (
            <div className='w-full h-full'>
                <PostCarousel post={post} fullHeight={true} contain />
            </div>
        )
    }

    if (type === 'profile') {
        const firstMedia = medias.length > 0 ? medias[0] : null;

        if (!firstMedia && !post.content) {
            return null;
        }

        return (
            <>
                <div className="relative w-full aspect-square overflow-hidden group cursor-pointer">
                    {firstMedia ? (
                        <>
                            {firstMedia.image_file ? (
                                <Image
                                    src={firstMedia.image_file}
                                    alt="post thumbnail"
                                    fill
                                    className="object-cover group-hover:opacity-90 transition-opacity"
                                    sizes="(max-width: 768px) 33vw, 300px"
                                />
                            ) : firstMedia.video_file ? (
                                <video
                                    src={firstMedia.video_file}
                                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                    muted
                                />
                            ) : null}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                                <div className="flex items-center gap-2">
                                    <Heart size={24} fill='white' />
                                    <span className="font-semibold">{post.like_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={24} fill='white' />
                                    <span className="font-semibold">{post.comment_count || 0}</span>
                                </div>
                            </div>

                            {medias.length > 1 && (
                                <div className="absolute top-2 right-2">
                                    <LucideImages size={20} strokeOpacity={1} />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-linear-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4 group-hover:opacity-90 transition-opacity">
                            <p className="text-white text-center font-medium line-clamp-6 text-sm">
                                {post.content}
                            </p>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                                <div className="flex items-center gap-2">
                                    <Heart size={24} fill='white' />
                                    <span className="font-semibold">{post.like_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={24} fill='white' />
                                    <span className="font-semibold">{post.comment_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </>
        )
    }

    return null;
}

export default React.memo(ShowPost);