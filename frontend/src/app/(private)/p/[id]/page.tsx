'use client';

import { useParams } from 'next/navigation';
import PostDetail from '@/src/app/components/organisms/PostDetail';
import MorePosts from '@/src/app/components/organisms/MorePosts';
import { useAppSelector } from '@/src/redux-store';
import Button from '@/src/app/components/atoms/Button';
import { useRouter } from 'next/navigation';
import { getPost } from '@/src/libs/auth/post.actions';
import { useAppDispatch } from '@/src/redux-store';
import { addPost } from '@/src/redux-store/slices/post';
import { useEffect, useState } from 'react';
import Loader from '@/src/app/components/atoms/Loader';
import ShowPost from '@/src/app/components/organisms/ShowPost';
import { Modal } from '@/src/app/components/organisms/Modal';
import { PostType } from '@/src/types/post';

export default function PostPage() {
    const params = useParams();
    const id = params?.id as string;
    let post: PostType | null = null;
    post = useAppSelector((state) => state.post.entities[id]);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!post && id) {
            const fetchPost = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const result = await getPost(id);
                    if (result.success && result.data) {
                        dispatch(addPost(result.data));
                    } else {
                        setError(result.errors?.detail || 'Failed to load post');
                    }
                } catch (err) {
                    setError('An error occurred while loading the post');
                    console.error('Error fetching post:', err);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchPost();
        }
    }, [id, post, dispatch]);

    console.log('post id: ', id)
    console.log('post: ', post)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-red-500 text-lg">{error}</p>
                <Button
                    name="Go Back"
                    onClick={() => router.back()}
                    variant="primary"
                />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-row-reverse h-full w-full">
                <div className="w-3/5 overflow-hidden h-full">
                    <ShowPost post={post} type='post' />
                </div>
                <div className="bg-card w-2/5 overflow-hidden h-full">
                    <PostDetail postId={post?.id} />
                </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t">
                <MorePosts postId={id} />
            </div>

            {showModal && (
                <Modal
                    isOpen={showModal}
                    size='2xl'
                    onClose={() => setShowModal(false)}
                    close={true}
                >
                    <ShowPost post={post} type='media' contain={true} />
                </Modal>
            )}
        </>
    );
}
