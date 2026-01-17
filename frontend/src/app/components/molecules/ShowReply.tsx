import React from 'react';
import { Comment, UserType } from '@/types';
import getTimeAgo from '@/src/libs/utils/helpers';
import ProfileHeader from '../organisms/ProfileHeader';
import { useAppSelector } from '@/src/redux-store';
import { selectPostCommentById } from '@/src/redux-store/slices/comment';
import ShowActions from './ShowActions';
import SizeAvatars from '../organisms/Avatar';

interface ShowReplyProps {
    reply: Comment;
    postId: string | number;
}

function ShowReply({ reply, postId }: ShowReplyProps) {
    // Get the latest reply data from Redux store
    const latestReply = useAppSelector(state =>
        selectPostCommentById(state, postId, reply.id)
    ) || reply;

    const forUser = {
        username: latestReply.author_username!,
        profile_picture_url: latestReply.author_avatar!,
    };

    return (
        <div className="flex gap-2 py-1">
            <SizeAvatars user={forUser as UserType} size={32} />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300">{latestReply.content}</p>

                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                        {getTimeAgo(latestReply.created_at)}
                    </span>
                    {latestReply.like_count > 0 && (
                        <span className='text-xs text-gray-400'>
                            {latestReply.like_count} {latestReply.like_count === 1 ? 'like' : 'likes'}
                        </span>
                    )}
                </div>
            </div>
            <ShowActions
                postId={postId}
                commentId={latestReply.id}
                size={14}
            />
        </div>
    );
}

export default ShowReply;
