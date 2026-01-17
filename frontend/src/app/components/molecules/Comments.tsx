'use client'

import React, { useRef } from 'react'
import { Comment } from '@/types';
import { useAppSelector } from '@/src/redux-store';
import { selectPostComments } from '@/src/redux-store/slices/comment';
import ShowComment from './ShowComment';
import ShowActions from './ShowActions';
import CreateComment, { CreateCommentRef } from './CreateComment';

interface CommentsProps {
    postId: string | number;
    showCreateComment?: boolean;
}

function Comments({ postId, showCreateComment = false }: CommentsProps) {
    const createCommentRef = useRef<CreateCommentRef>(null);

    const comments = useAppSelector(state =>
        selectPostComments(state, postId).filter(
            comment => comment.parent === null || comment.parent === 'None'
        )
    );

    const handleReplyClick = (comment: Comment) => {
        createCommentRef.current?.focusInput(comment);
    };

    return (
        <div className="flex flex-col w-full">
            <div className="space-y-2">
                {comments.map((comment: Comment) => (
                    <div key={comment.id} className="flex items-center gap-2">
                        <ShowComment
                            comment={comment}
                            postId={postId}
                            onReplyClick={() => handleReplyClick(comment)}
                        />
                    </div>
                ))}
            </div>

            {showCreateComment && (
                <CreateComment ref={createCommentRef} postId={postId} />
            )}
        </div>
    )
}

export default Comments