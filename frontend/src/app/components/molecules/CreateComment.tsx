'use client'

import { CommentForm } from "@/src/types/post";
import { Comment } from "@/types";
import Form from "../organisms/Form";
import { FormField } from "../organisms/Form";
import { createPostComment } from "@/src/libs/auth/post.actions";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useAppDispatch } from "@/src/redux-store";
import { addPostComment } from "@/src/redux-store/slices/comment";

interface CreateCommentProps {
    postId: string | number;
}

export interface CreateCommentRef {
    focusInput: (comment?: Comment) => void;
}

const CreateComment = forwardRef<CreateCommentRef, CreateCommentProps>(
    ({ postId }, ref) => {
        const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
        const dispatch = useAppDispatch();

        useImperativeHandle(ref, () => ({
            focusInput: (comment?: Comment) => {
                if (comment) {
                    setReplyToComment(comment);
                }

                const input = document.querySelector('input[name="content"]') as HTMLInputElement;
                if (input) {
                    input.focus();
                    if (comment) {
                        input.value = `@${comment.author_username} `;
                    }
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }));

        const commentForm: FormField[] = [
            {
                name: "content",
                type: "text",
                placeholder: "Add your comment...",
            }
        ]

        const onSubmit = async (data: CommentForm) => {
            try {
                if (data.content.length === 0) return;

                const parentId = replyToComment ? replyToComment.id as number : undefined;

                const result = await createPostComment(postId, data.content, parentId);

                if (result.success && result.data) {
                    dispatch(addPostComment({
                        postId: postId,
                        comment: result.data
                    }));

                    setReplyToComment(null);

                    const input = document.querySelector('input[name="content"]') as HTMLInputElement;
                    if (input) {
                        input.value = '';
                    }
                }
            } catch (error) {
                console.error('Error creating comment:', error);
            }
        }

        return (
            <div className="flex items-center gap-5 w-full p-4 border-t">
                <Form
                    fields={commentForm}
                    onSubmit={onSubmit}
                    submitButton={{
                        text: "Post",
                        fullWidth: true,
                        variant: "secondary",
                        size: "squared"
                    }}
                    resetOnSubmit={true}
                />
            </div>
        )
    }
);

CreateComment.displayName = 'CreateComment';

export default CreateComment