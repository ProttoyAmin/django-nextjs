"use client";

import { useAppDispatch, useAppSelector, RootState } from "@/src/redux-store";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/src/app/components/organisms/Modal";
import { ModalHeader } from "@/src/app/components/organisms/ModalHeader";
import { FormField } from "@/src/app/components/organisms/Form";
import {
  postClubMediaThunk,
  updateClubDetailsThunk,
  fetchClub,
} from "@/src/redux-store/slices/club";
import MediaUpload from "../../components/MediaUpload";
import Form from "@/src/app/components/organisms/Form";
import Loader from "@/src/app/components/atoms/Loader";
import Button from "@/src/app/components/atoms/Button";
import { CameraIcon } from "lucide-react";
import { hasChanges } from "@/src/libs/utils/helpers";
import { Club } from "@/src/types/club";
import Input from "@/src/app/components/atoms/Input";
import { useForm } from "react-hook-form";

interface PrivacySettings extends Club {
  is_public: boolean;
  allow_public_posts: boolean;
  rules: string;
}

export default function Edit() {
  const { id } = useParams();
  const clubId = id as string;
  const dispatch = useAppDispatch();
  const club = useAppSelector((state: RootState) =>
    state.club.entities[clubId] ? state.club.entities[clubId] : null
  );
  const initialClub = club;
  const isLoading = useAppSelector((state: RootState) => state.club.isLoading);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrivacySettings>();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPublic = watch("is_public");

  useEffect(() => {
    if (!club && clubId) {
      dispatch(fetchClub({ clubId }));
    }
  }, [clubId, club, dispatch]);

  useEffect(() => {
    if (club) {
      setValue("is_public", club.is_public);
      setValue("about", club.about || "");
      setValue("allow_public_posts", club.allow_public_posts);
      setValue("privacy", club.privacy);
      setValue("rules", club.rules || "");
    }
  }, [club, setValue]);

  const onUpdateDetails = async (data: any) => {
    if (!hasChanges<Club>(data, initialClub)) {
      return;
    }
    console.log(data);
    try {
      await dispatch(updateClubDetailsThunk({ clubId, data })).unwrap();
    } catch (error) {
      console.error("Failed to update details", error);
    }
  };

  const onUploadAvatar = async (data: any) => {
    const avatarFile =
      Array.isArray(data.avatar) && data.avatar.length > 0
        ? data.avatar[0]
        : data.avatar;
    if (avatarFile) {
      await dispatch(
        postClubMediaThunk({ clubId, avatar: avatarFile, type: "update" })
      );
      setShowAvatarModal(false);
    }
  };

  const onUploadBanner = async (data: any) => {
    const bannerFile =
      Array.isArray(data.banner) && data.banner.length > 0
        ? data.banner[0]
        : data.banner;
    if (bannerFile) {
      await dispatch(
        postClubMediaThunk({ clubId, banner: bannerFile, type: "update" })
      );
      setShowBannerModal(false);
    }
  };

  const onRemoveAvatar = async (data: any) => {
    await dispatch(
      postClubMediaThunk({ clubId, type: "remove", avatar: data.avatar })
    );
    setShowAvatarModal(false);
  };

  const onRemoveBanner = async (data: any) => {
    await dispatch(
      postClubMediaThunk({ clubId, type: "remove", banner: data.banner })
    );
    setShowBannerModal(false);
  };

  const submitPrivacy = async (data: PrivacySettings) => {
    console.log(data);
    setLoading(true);
    try {
      console.log(
        await dispatch(updateClubDetailsThunk({ clubId, data })).unwrap()
      );
      alert("Privacy settings updated successfully!");
    } catch (error) {
      console.error("Failed to update details", error);
      alert("Failed to update privacy settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const detailsFields: FormField[] = [
    {
      name: "about",
      label: "About",
      type: "textarea",
      required: false,
      default: club?.about || "",
      layout: { colSpan: 12 },
    },
    {
      name: "rules",
      label: "Club Rules",
      type: "textarea",
      required: false,
      default: club?.rules || "",
      layout: { colSpan: 12 },
    },
    {
      name: "privacy",
      label: "Club Privacy",
      type: "select",
      options: [
        { label: "Public", value: "public" },
        { label: "Closed", value: "closed" },
        { label: "Secret", value: "secret" },
      ],
      required: true,
      default: club?.privacy || "public",
      layout: { colSpan: 12 },
    },
  ];

  const avatarFields: FormField[] = [
    {
      name: "avatar",
      label: "Upload New Avatar",
      type: "file",
      accept: "image/*",
      required: true,
      layout: { colSpan: 12 },
    },
  ];

  const bannerFields: FormField[] = [
    {
      name: "banner",
      label: "Upload New Banner",
      type: "file",
      accept: "image/*",
      required: true,
      layout: { colSpan: 12 },
    },
  ];

  if (!club && isLoading) return <Loader />;
  if (!club) return <div>Club not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div
            className="relative group cursor-pointer"
            onClick={() => setShowAvatarModal(true)}
          >
            <Image
              src={
                club.avatar ||
                `${process.env.NEXT_PUBLIC_DICEBEAR_API}${club.name}`
              }
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full w-20 h-20 object-cover border-2 border-gray-700"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white">
                <CameraIcon />
              </span>
            </div>
          </div>

          <div
            className="relative group cursor-pointer flex-1 h-20 bg-gray-800 rounded-lg overflow-hidden"
            onClick={() => setShowBannerModal(true)}
          >
            {club.banner ? (
              <Image
                src={club.banner}
                alt="Banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Banner
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white">
                <CameraIcon />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* <label className="switch">
          <input type="checkbox" {...register("is_public")} />
          <span className="slider">
            <span className="circle" />
          </span>
        </label> */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
              Private Club
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              When your club is private, only people you approve can see your
              posts and stories. Users will have to request to join your club.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 sm:ml-4 self-start sm:self-center">
            <input
              type="checkbox"
              checked={!isPublic} // Checked means Private (is_public: false)
              className="sr-only peer"
              onChange={(e) => {
                const newValue = !e.target.checked;
                setValue("is_public", newValue);
                // Trigger submission for the toggle
                handleSubmit((data) =>
                  onUpdateDetails({ ...data, is_public: newValue })
                )();
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Public Posts Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-t pt-4 border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
              Allow Public Posts
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Allow anyone to see posts from this club even if they are not
              members.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 sm:ml-4 self-start sm:self-center">
            <input
              type="checkbox"
              {...register("allow_public_posts")}
              defaultChecked={club.allow_public_posts}
              className="sr-only peer"
              onChange={(e) => {
                setValue("allow_public_posts", e.target.checked);
                handleSubmit((data) =>
                  onUpdateDetails({
                    ...data,
                    allow_public_posts: e.target.checked,
                  })
                )();
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {!isPublic && (
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
                  Private Club Enabled
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  New members will need your approval. Your existing members can
                  still see club posts.
                </p>
              </div>
            </div>
          </div>
        )}
        <Form
          fields={detailsFields}
          onSubmit={onUpdateDetails}
          submitButton={{ text: "Save Changes" }}
          className="space-y-4"
          defaultValues={club}
        />
      </div>

      {showAvatarModal && (
        <Modal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          size="sm"
        >
          <ModalHeader
            title="Change Avatar"
            onClose={() => setShowAvatarModal(false)}
          />
          <MediaUpload
            clubId={clubId}
            type="club"
            formFields={avatarFields}
            onSubmit={onUploadAvatar}
          />

          <div className="p-6 border-t flex gap-3 justify-between">
            <Button
              name="Remove Current Image"
              type="button"
              variant="ghostDanger"
              size="squared"
              // onClick={onRemoveAvatar}
              fullWidth
            />
            <Button
              name="Cancel"
              type="button"
              variant="secondary"
              size="squared"
              onClick={() => setShowAvatarModal(false)}
            />
          </div>
        </Modal>
      )}

      {showBannerModal && (
        <Modal
          isOpen={showBannerModal}
          onClose={() => setShowBannerModal(false)}
          size="sm"
        >
          <ModalHeader
            title="Change Banner"
            onClose={() => setShowBannerModal(false)}
          />
          <MediaUpload
            clubId={clubId}
            type="club"
            formFields={bannerFields}
            onSubmit={onUploadBanner}
            handleClose={() => setShowBannerModal(false)}
          />
          <div className="p-6 border-t flex gap-3 justify-between">
            <Button
              name="Remove Current Image"
              type="button"
              variant="ghostDanger"
              size="squared"
              // onClick={onRemoveAvatar}
              fullWidth
            />
            <Button
              name="Cancel"
              type="button"
              variant="secondary"
              size="squared"
              onClick={() => setShowAvatarModal(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
