'use client'

import React from 'react'

interface MorePostsProps {
    postId: string;
}

const MorePosts = ({ postId }: MorePostsProps) => {
    return (
        <div>
            <h2>More Posts</h2>
            <p>Post ID: {postId}</p>
        </div>
    );
};

export default MorePosts;