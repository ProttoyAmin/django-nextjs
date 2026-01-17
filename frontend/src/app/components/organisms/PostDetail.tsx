"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/src/redux-store";
import ProfileHeader from "./ProfileHeader";
import Comments from "../molecules/Comments";
import { deletePost, getPostComments } from "@/src/libs/auth/post.actions";
import { useRouter } from "next/navigation";
import Options from "./Options";
import { Modal } from "./Modal";
import { MoreHorizontal } from "lucide-react";
import { ModalHeader } from "./ModalHeader";
import { useAppDispatch } from "@/src/redux-store";
import { removePostById, updateUserPost } from "@/src/redux-store/slices/post";
import { setPostComments } from "@/src/redux-store/slices/comment";
import Loader from "../atoms/Loader";
import ActivityButtons from "../../(private)/profile/components/ActivityButtons";
import ShowActions from "../molecules/ShowActions";
import UpdatePost from "../../(private)/p/components/UpdatePost";
import { UseFormReturn } from "react-hook-form";
import { updatePost } from "@/src/libs/auth/post.actions";
import SizeAvatars from "./Avatar";
import { UserType } from "@/types";

interface PostDetailProps {
  postId: string | number;
}

function PostDetail({ postId }: PostDetailProps) {
  const [openModal, setOpenModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const post = useAppSelector((state) => state.post.entities[postId]);
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id);
  const comments = useAppSelector((state) => state.comment.byPostId[postId]);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Create ref to hold form methods
  const formMethodsRef = useRef<UseFormReturn | null>(null);

  const user = {
    username: post?.author_username,
    profile_picture_url: post?.author_avatar,
  };

  useEffect(() => {
    if (!post) return;

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const response = await getPostComments(post.id);

        if (response.success && response.data) {
          const comments = response.data.results || response.data;

          dispatch(
            setPostComments({
              postId: post.id,
              comments: comments,
            })
          );
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    if (!comments) {
      fetchComments();
    }
  }, [post, dispatch]);

  const handleDelete = async () => {
    if (!post) return;
    try {
      const response = await deletePost(post.id);
      if (response.success) {
        dispatch(removePostById(post.id));
        setOpenModal(false);
        setConfirmDelete(false);
        router.back();
      } else {
        alert(response.errors?.detail || "Failed to delete post");
      }
    } catch (err) {
      alert("Failed to delete post");
    }
  };

  const handleDone = () => {
    if (formMethodsRef.current) {
      formMethodsRef.current.handleSubmit(async (data) => {
        if (data.content === post.content) {
          setShowEdit(false);
          return;
        }
        if (data.content.length === 0) {
          setShowEdit(false);
          return;
        }
        try {
          const response = await updatePost(post.id, data);
          if (response.success) {
            dispatch(updateUserPost(post));
            setOpenModal(false);
            setShowEdit(false);
          } else {
            alert(response.errors?.detail || "Failed to update post");
          }
        } catch (error: any) {
          alert(error?.message || "Failed to update post");
        }

        setShowEdit(false);
      })();
    }
  };

  const options = [
    {
      name: currentUserId === post?.author_id ? "Delete" : "Report",
      onClick: () =>
        currentUserId === post?.author_id
          ? setConfirmDelete(true)
          : setShowReport(true),
      variant: "ghostDanger",
    },
    {
      name: currentUserId === post?.author_id ? "Edit" : "Go To Post",
      onClick: () =>
        currentUserId === post?.author_id
          ? setShowEdit(true)
          : router.refresh(),
      variant: "secondary",
    },
    {
      name: "Close",
      onClick: () => {
        setOpenModal(false);
      },
      variant: "secondary",
    },
  ];

  const confirmDeleteOptions = [
    {
      name: "Delete",
      onClick: handleDelete,
      variant: "ghostDanger",
    },
    {
      name: "Close",
      onClick: () => {
        setConfirmDelete(false);
      },
      variant: "secondary",
    },
  ];

  if (!post) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="relative flex items-center w-full gap-2">
              <SizeAvatars user={user as UserType} size={40} badgeSize="8px" />
              <span className="text-sm text-gray-300 absolute top-0 left-1/8 font-semibold">
                {post.author_username}
              </span>
            </div>
            <MoreHorizontal
              onClick={() => setOpenModal(true)}
              size={20}
              className="cursor-pointer hover:text-gray-400"
            />
          </div>

          {post.content && (
            <div className="mt-4">
              <div className="flex gap-3">
                <div className="font-semibold text-sm min-w-fit">
                  {post.author_username}
                </div>
                <p className="text-sm text-gray-300">{post.content}</p>
              </div>
            </div>
          )}
        </div>
        <ShowActions postId={post.id} size={20} showCounts={true} />

        <div className="flex-1 overflow-y-auto">
          <React.Suspense fallback={<Loader />}>
            <Comments postId={post.id} showCreateComment={true} />
          </React.Suspense>
        </div>
      </div>

      {openModal && (
        <Modal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          size="auto"
        >
          <div className="p-2 w-[400px] flex flex-col gap-4 items-center justify-center">
            <Options
              items={options}
              post={post}
              type="delete"
              setAction={setConfirmDelete}
            />
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          size="lg_vertical"
        >
          <ModalHeader
            title="Edit info"
            onClose={() => setShowEdit(false)}
            onDone={handleDone}
            className="bg-black/10 h-15"
            type="edit"
          />
          <UpdatePost
            post={post}
            className="w-full h-full"
            onFormMount={(methods) => (formMethodsRef.current = methods)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          size="auto"
        >
          <div className="p-2 w-[400px] flex flex-col gap-4 items-center justify-center">
            <Options
              post={post}
              setAction={handleDelete}
              type="delete"
              items={confirmDeleteOptions}
            />
          </div>
        </Modal>
      )}

      {showReport && (
        <Modal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          size="auto"
        >
          <ModalHeader
            title="Report this post?"
            onClose={() => setShowReport(false)}
          />
          <div className="p-2 w-[400px] flex flex-col gap-4 items-center justify-center">
            <Options post={post} setAction={setShowReport} type="report" />
          </div>
        </Modal>
      )}
    </>
  );
}

export default React.memo(PostDetail);
