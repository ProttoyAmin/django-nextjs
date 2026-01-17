// src/app/components/molecules/ProfilePictureForm.tsx
import React, { useState, useEffect } from 'react';
import Form, { FormField } from '../organisms/Form';
import { Modal } from '../organisms/Modal';
import { ModalHeader } from '../organisms/ModalHeader';
import Button from '../atoms/Button';
import { uploadProfilePicture } from '@/src/libs/auth/actions/user.actions';
import { clearProfilePicture } from '@/src/libs/auth/actions/user.actions';
import Image from 'next/image';

interface ProfilePictureFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentPicture?: string | null;
}

const ProfilePictureForm: React.FC<ProfilePictureFormProps> = ({
  isOpen,
  onClose,
  currentPicture
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      setIsMounted(false);
    }
  }, [isOpen]);

  const profilePictureFields: FormField[] = [
    {
      name: "image",
      label: "Upload New Profile Picture",
      type: "file",
      accept: "image/*",
      required: true,
      layout: {
        colSpan: 12
      }
    }
  ];

  const handleSubmit = async (data: any) => {
    if (!data.image || data.image.length === 0) {
      setError("Please select an image to upload");
      return;
    }

    const file = data.image[0];
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await uploadProfilePicture(file);
      if (result.success) {
        onClose();
      } else {
        setError(result.errors?.detail || "Failed to upload profile picture");
      }
    } catch (err) {
      setError("An error occurred while uploading");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePicture = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await clearProfilePicture();
      if (result.success) {
        onClose();
      } else {
        setError(result.errors?.detail || "Failed to remove profile picture");
      }
    } catch (err) {
      setError("An error occurred while removing profile picture");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsMounted(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="content-center" size='sm' >
      <div className={`flex flex-col transform transition-all duration-300 
        ${isMounted
          ? 'bounce-up-active scale-100 opacity-100 translate-y-0'
          : 'bounce-up scale-95 opacity-0 translate-y-8'
        }`}
      >
        <ModalHeader
          title="Change Profile Picture"
          onClose={handleClose}
        />

        <div className="p-6 h-full flex-1 overflow-y-auto ">
          {currentPicture && (
            <div className="mb-8 flex justify-center">
              <Image
                src={currentPicture}
                alt="Current profile"
                width={160}
                height={160}
                className="w-40 h-40 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}

          <Form
            fields={profilePictureFields}
            onSubmit={handleSubmit}
            submitButton={{
              text: isSubmitting ? 'Uploading...' : 'Upload New Image',
              disabled: isSubmitting,
              loading: isSubmitting,
              fullWidth: true,
              variant: 'ghost',
              size: 'squared'
            }}
            className="mb-6"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md text-sm bounce-up-active">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex gap-3 justify-between">
          <Button
            name="Remove Current Image"
            type="button"
            variant="ghostDanger"
            size="squared"
            onClick={handleRemovePicture}
            disabled={isSubmitting || !currentPicture}
            fullWidth
          />
          <Button
            name="Cancel"
            type="button"
            variant="secondary"
            size="squared"
            onClick={handleClose}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ProfilePictureForm;