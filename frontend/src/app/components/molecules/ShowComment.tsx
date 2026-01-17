'use client';

import React from 'react'
import { Comment, UserType } from '@/types'
import { Reply } from 'lucide-react'
import Button from '../atoms/Button'
import ShowReply from './ShowReply';
import { useUser } from '@/src/hooks/useUser';
import getTimeAgo from '@/src/libs/utils/helpers';
import ProfileHeader from '../organisms/ProfileHeader';
import { useAppSelector } from '@/src/redux-store';
import { selectPostComments, selectPostCommentById } from '@/src/redux-store/slices/comment';
import ShowActions from './ShowActions';
import SizeAvatars from '../organisms/Avatar';

interface ShowCommentProps {
    comment: Comment;
    onReplyClick?: () => void;
    postId: string | number;
}

function ShowComment({ comment, onReplyClick, postId }: ShowCommentProps) {
    const [showReplies, setShowReplies] = React.useState(false);
    const { user } = useUser();

    // Get the latest comment data from Redux store
    const latestComment = useAppSelector(state =>
        selectPostCommentById(state, postId, comment.id)
    ) || comment;

    const replies = useAppSelector(state =>
        selectPostComments(state, postId).filter(c => c.parent === comment.id)
    );

    const handleReplyClick = () => {
        if (onReplyClick) {
            onReplyClick();
        }
    };

    const forUser = {
        username: latestComment.author_username!,
        profile_picture_url: latestComment.author_avatar!,
    };

    return (
        <div className="flex flex-col gap-1 py-2">
            <div className="flex items-start gap-2">
                <SizeAvatars user={forUser as UserType} size={32} badgeSize='8px' />
                <div className="flex-1">
                    <p className='text-sm text-gray-200'>{latestComment.content}</p>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-400">
                            {getTimeAgo(latestComment.created_at?.toString() || "")}
                        </p>
                        {latestComment.like_count > 0 && (
                            <p className='text-xs text-gray-400'>
                                {latestComment.like_count} {latestComment.like_count === 1 ? 'like' : 'likes'}
                            </p>
                        )}
                        <Button
                            name={'Reply'}
                            icon={<Reply size={14} />}
                            variant="default"
                            size="sm"
                            onClick={handleReplyClick}
                            className="text-xs text-gray-400 hover:text-gray-200"
                        />
                        {replies.length > 0 && (
                            <Button
                                name={showReplies
                                    ? 'Hide replies'
                                    : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                                }
                                variant="default"
                                size="sm"
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-xs text-gray-400 hover:text-gray-200 font-semibold"
                            />
                        )}
                    </div>
                </div>

                <ShowActions
                    postId={postId}
                    commentId={latestComment.id}
                    size={14}
                />
            </div>

            {showReplies && replies.length > 0 && (
                <div className="mt-2 ml-8 space-y-2 border-l-2 border-gray-700 pl-4">
                    {replies.map((reply) => (
                        <ShowReply key={reply.id} postId={postId} reply={reply} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ShowComment