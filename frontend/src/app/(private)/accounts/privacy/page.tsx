// app/(private)/accounts/privacy/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  updateUserProfile,
  getUserDetails,
} from "@/src/libs/auth/actions/user.actions";
import { useForm } from "react-hook-form";
import Form from "@/src/app/components/organisms/Form";
import Loader from "@/src/app/components/atoms/Loader";
import { setUser, useAppDispatch } from "@/src/redux-store";

interface PrivacySettings {
  is_private: boolean;
}

function AccountPrivacyPage() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrivacySettings>();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const dispatch = useAppDispatch();

  const isPrivate = watch("is_private");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserDetails();
        if (userData) {
          setInitialData(userData);
          setValue("is_private", userData?.data?.is_private || false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [setValue]);

  const onSubmit = async (data: PrivacySettings) => {
    setIsLoading(true);

    try {
      const response = await updateUserProfile({
        is_private: data.is_private,
      } as any);
      if (response) {
        dispatch(setUser(response?.data));
        alert("Privacy settings updated successfully!");
      }
    } catch (error: any) {
      console.warn(error);
      alert("Failed to update privacy settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialData) {
    return <Loader />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Account Privacy
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account privacy and visibility settings.
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                Private Account
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                When your account is private, only people you approve can see
                your posts and stories. Your existing followers won't be
                affected.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 sm:ml-4 self-start sm:self-center">
              <input
                type="checkbox"
                {...register("is_private")}
                className="sr-only peer"
                onChange={(e) => {
                  setValue("is_private", e.target.checked);
                  handleSubmit(onSubmit)();
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {isPrivate && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Private Account Enabled
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    New followers will need your approval. Your existing
                    followers can still see your posts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
          Privacy Information
        </h3>
        <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Public Account</p>
            <p>
              Anyone can see your posts, followers, and following. Your account
              appears in search results and recommendations.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Private Account</p>
            <p>
              Only approved followers can see your posts. Your account won't
              appear in search results or recommendations for people who don't
              follow you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPrivacyPage;
