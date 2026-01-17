// Mobile Bottom Navigation Bar
"use client";

import React, { useState, useCallback } from "react";
import { ProfileIcon } from "../atoms/Icons";
import { LogoutUser } from "@/src/libs/auth/actions/user.actions";
import { useAppDispatch, useAppSelector } from "@/src/redux-store/hooks";
import { logout } from "@/src/redux-store/slices/auth";
import Button from "../atoms/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "../atoms/Loader";
import { useUser } from "@/src/hooks/useUser";
import CreatePostForm from "../molecules/CreatePostForm";
import { Modal } from "./Modal";
import { PostFormType } from "@/src/types/post";
import { LogOut, House, Plus, Club } from "lucide-react";

function BottomBar() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const { user, isLoading } = useUser();
    const [showPostModal, setShowPostModal] = useState(false);

    const logUserOut = useCallback(async () => {
        await LogoutUser();
        dispatch(logout());
        router.push("/login");
    }, [dispatch, router]);

    const openPostModal = useCallback(() => {
        setShowPostModal(true);
    }, []);

    const closePostModal = useCallback(() => {
        setShowPostModal(false);
    }, []);

    const handlePostSubmit = useCallback((data: PostFormType) => {
        closePostModal();
    }, [closePostModal]);

    if (isLoading) {
        return null;
    }

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-black px-4 py-3 md:hidden">
                {user ? (
                    <div className="flex items-center justify-around gap-2">
                        {/* Home Button */}
                        <Link href={"/"} className="flex-1">
                            <button
                                type="button"
                                className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
                                aria-label="Home"
                            >
                                <House className="w-6 h-6 text-white" />
                            </button>
                        </Link>

                        {/* Profile Button */}
                        <Link href={`/${user?.username}`} className="flex-1">
                            <button
                                type="button"
                                className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
                                aria-label="Profile"
                            >
                                <ProfileIcon className="w-6 h-6" />
                            </button>
                        </Link>

                        <Link href={`/clubs`} className="flex-1">
                            <button
                                type="button"
                                className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
                                aria-label="Profile"
                            >
                                <Club className="w-6 h-6" />
                            </button>
                        </Link>

                        {/* Create Post Button */}
                        <button
                            type="button"
                            onClick={openPostModal}
                            className="flex-1 flex items-center justify-center p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                            aria-label="Create Post"
                        >
                            <Plus className="w-6 h-6 text-white" />
                        </button>

                        {/* Logout Button */}
                        <button
                            type="button"
                            onClick={logUserOut}
                            className="flex-1 flex items-center justify-center p-3 rounded-lg hover:bg-red-900/20 transition-colors"
                            aria-label="Logout"
                        >
                            <LogOut className="w-6 h-6 text-red-500" />
                        </button>

                        {/* Create Post Modal */}
                        <Modal isOpen={showPostModal} onClose={closePostModal}>
                            <CreatePostForm
                                onClose={closePostModal}
                                onSubmit={handlePostSubmit}
                            />
                        </Modal>
                    </div>
                ) : null}
            </nav>
        </>
    );
}

export default BottomBar;