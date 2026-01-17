"use client";

import { useParams, useRouter } from "next/navigation";
import { Modal } from "@/src/app/components/organisms/Modal";
import ShowPost from "@/src/app/components/organisms/ShowPost";
import { useAppSelector } from "@/src/redux-store";
import PostDetail from "@/src/app/components/organisms/PostDetail";
import { getPost } from "@/src/libs/auth/post.actions";
import { useEffect, useState } from "react";
import { PostType } from "@/src/types/post";
import { useAppDispatch } from "@/src/redux-store";
import Loader from "@/src/app/components/atoms/Loader";
import { addPost } from "@/src/redux-store/slices/post";

export default function PostModalPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = params?.id as string;
  const dispatch = useAppDispatch();
  let post: PostType | null = null;
  post = useAppSelector((state) => state.post.entities[id]);

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
            setError(result.errors?.detail || "Failed to load post");
          }
        } catch (err) {
          setError("An error occurred while loading the post");
          console.error("Error fetching post:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, post, dispatch]);

  const handleClose = () => {
    router.back();
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <Modal isOpen={true} onClose={handleClose} size="xl" close>
          <div className="flex md:flex-row flex-col w-full h-full">
            <div className="w-full md:w-2/3 overflow-hidden h-full">
              {post && <ShowPost post={post} type="media" />}
            </div>
            <div className="w-full md:w-1/3 overflow-hidden h-full">
              {post && <PostDetail postId={post.id} />}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
