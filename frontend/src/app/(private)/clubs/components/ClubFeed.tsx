import React from 'react'
import { PostType } from '@/src/types/post';
import ProfileHeader from '@/src/app/components/organisms/ProfileHeader';
import ShowFollowButtons from '@/src/app/components/organisms/ShowFollowButtons';
import ShowPost from '@/src/app/components/organisms/ShowPost';
import Link from 'next/link';
import ShowActions from '@/src/app/components/molecules/ShowActions';
import Options from '@/src/app/components/organisms/Options';
import { Modal } from '@/src/app/components/organisms/Modal';
import Button from '@/src/app/components/atoms/Button';
import { Ellipsis } from 'lucide-react';
import ClubProfile from './ClubProfile';
import { useSearchParams } from 'next/navigation';
import UserModalProfile from '../[id]/components/UserModalProfile';

interface ClubFeedProps {
    posts: PostType[];
    clubId: string | number;
}

function ClubFeed({ posts, clubId }: ClubFeedProps) {
    const [showModal, setShowModal] = React.useState(false)
    const searchParams = useSearchParams();
    const modalUsername = searchParams.get('username');

    return (
        <div className='flex flex-col gap-5 mx-50'>
            {posts.map((post) => (
                <div key={post?.id} className="rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3">
                        <Link href={`?profile=user&username=${post?.author_username}`} scroll={false} className='cursor-pointer'>
                            <ProfileHeader post={post} clubId={clubId as string} for="post" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <ShowFollowButtons targetId={post?.author_id} variant="default" size="default" />
                            <Button name="" icon={<Ellipsis size={16} />} variant='default' size='md' onClick={() => { setShowModal(true) }} />
                        </div>

                        {showModal && (
                            <Modal isOpen={showModal} onClose={() => setShowModal(false)} size='auto' close>
                                <div className='p-2 w-[400px] flex flex-col gap-4 items-center justify-center'>
                                    <Options post={post} setAction={() => setShowModal(false)} type='club' />
                                </div>
                            </Modal>
                        )}
                    </div>
                    <Link href={`/p/${post?.id}`} as={`/p/${post?.id}`} scroll={false}>
                        <ShowPost post={post} type="feed" />
                    </Link>
                    <ShowActions postId={post?.id} showCounts club />
                </div>
            ))}

            {modalUsername && (
                <UserModalProfile username={modalUsername} clubId={clubId as string} type='club' />
            )}
        </div>
    )
}

export default React.memo(ClubFeed)