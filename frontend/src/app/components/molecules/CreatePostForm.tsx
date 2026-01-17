// src/app/components/molecules/CreatePostForm.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PostFormType } from "@/src/types/post";
import PostContentStep from "./PostContentStep";
import { PostVisibilityStep } from "./PostVisibilityStep";
import { useDiscardConfirmation } from "@/src/hooks/useDiscardConfirmation";
import {
  createTextPost,
  createMixedMediaPost,
} from "@/src/libs/auth/post.actions";
import { DiscardConfirmation } from "../organisms/DiscardConfirmation";
import { useRouter } from "next/navigation";

interface CreatePostFormProps {
  onClose: () => void;
  onSubmit: (data: PostFormType) => void;
}

type FormStep = "content" | "visibility";

function CreatePostForm({ onClose, onSubmit }: CreatePostFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<PostFormType>>({
    content: "",
    media: [],
    visibility: "public",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentStepWatch, setContentStepWatch] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const steps: FormStep[] = ["content", "visibility"];
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const hasChanges = Boolean(
    formData.content ||
      (formData.media && formData.media.length > 0) ||
      formData.visibility
  );

  const {
    showDiscardConfirm,
    handleCloseAttempt,
    handleConfirmDiscard,
    handleCancelDiscard,
  } = useDiscardConfirmation(hasChanges, onClose);

  const handleDataChange = useCallback((newData: Partial<PostFormType>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const setContentWatch = useCallback((watchFunction: any) => {
    setContentStepWatch(() => watchFunction);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (contentStepWatch && currentStep === "content") {
      const subscription = contentStepWatch((value: any) => {
        setFormData((prev) => ({ ...prev, ...value }));
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const transitionToStep = useCallback((targetIndex: number) => {
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentStepIndex(targetIndex);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleNext = useCallback(
    (data: Partial<PostFormType>) => {
      setFormData((prev) => ({ ...prev, ...data }));

      if (!isLastStep) {
        transitionToStep(currentStepIndex + 1);
      }
    },
    [isLastStep, currentStepIndex, transitionToStep]
  );

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      transitionToStep(currentStepIndex - 1);
    }
  }, [isFirstStep, currentStepIndex, transitionToStep]);

  const handleFormSubmit = useCallback(
    async (data: PostFormType) => {
      setIsSubmitting(true);
      try {
        const finalData = { ...formData, ...data } as PostFormType;

        if (finalData.post_destination === "club") {
          console.log("Club post submission detected:", finalData);

          if (
            !finalData.selected_clubs ||
            finalData.selected_clubs.length === 0
          ) {
            console.error("No clubs selected");
            setIsSubmitting(false);
            return;
          }

          const promises = finalData.selected_clubs.map((clubId) => {
            if (finalData.media && finalData.media.length > 0) {
              return createMixedMediaPost(
                finalData.content || null,
                finalData.media,
                finalData.visibility === "public",
                clubId
              );
            } else {
              return createTextPost(
                finalData.content || "",
                finalData.visibility === "public",
                clubId
              );
            }
          });

          await Promise.all(promises);

          router.push(`/`);
          onSubmit(finalData);
          onClose();
          return;
        }

        if (finalData.media && finalData.media.length > 0) {
          const result = await createMixedMediaPost(
            finalData.content || null,
            finalData.media,
            finalData.visibility === "public"
          );
        } else {
          // Text post
          const result = await createTextPost(
            finalData.content || "",
            finalData.visibility === "public"
          );
        }
        router.push(`/`);
        onSubmit(finalData);
        onClose();
      } catch (error) {
        console.error("Failed to create post:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit, onClose]
  );

  const getTranslateValue = () => {
    return `${-(currentStepIndex * (100 / steps.length))}%`;
  };

  return (
    <>
      {/* Modal Header */}
      <div
        className={`flex items-center justify-between p-4 border-b
        ${
          isMounted
            ? "bounce-up-active scale-100 opacity-100 translate-y-0"
            : "bounce-up scale-95 opacity-0 translate-y-8"
        }`}
      >
        <div className={`flex items-center gap-3`}>
          {!isFirstStep && (
            <button
              onClick={handleBack}
              className="p-2 cursor-pointer rounded-full transition-colors disabled:opacity-50"
              disabled={isTransitioning}
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold">
              {currentStep === "content"
                ? "Create Post"
                : "Visibility Settings"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>

        <button
          onClick={handleCloseAttempt}
          className="p-2 cursor-pointer rounded-full transition-colors"
          aria-label="Close"
          disabled={isSubmitting}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="h-1 bg-transparent">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div
        className={`overflow-hidden max-h-[calc(90vh-100px)] relative ${
          isMounted
            ? "bounce-up-active scale-100 opacity-100 translate-y-0"
            : "bounce-up scale-95 opacity-0 translate-y-8"
        }`}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            width: `${steps.length * 100}%`,
            transform: `translateX(${getTranslateValue()})`,
          }}
        >
          {steps.map((step, index) => {
            return (
              <div
                key={step}
                className="shrink-0"
                style={{ width: `${100 / steps.length}%` }}
              >
                <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
                  {step === "content" ? (
                    <PostContentStep
                      data={formData}
                      onChange={handleDataChange}
                      onWatch={setContentWatch}
                      onNext={handleNext}
                      isActive={index === currentStepIndex}
                    />
                  ) : (
                    <PostVisibilityStep
                      data={formData}
                      onChange={handleDataChange}
                      onSubmit={handleFormSubmit}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <DiscardConfirmation
          isOpen={showDiscardConfirm}
          onCancel={handleCancelDiscard}
          onConfirm={handleConfirmDiscard}
        />
      )}
    </>
  );
}

export default React.memo(CreatePostForm);

/*
 * FUTURE ENHANCEMENTS GUIDE:
 *
 * 1. Add new steps:
 *    - Create a new step component (e.g., PostTagsStep.tsx)
 *    - Add it to the steps array with id, title, component, and validate function
 *
 * 2. Add step navigation:
 *    - Use transitionToStep(index) to jump to any step
 *    - Add a step indicator/breadcrumb component
 *
 * 3. Add conditional steps:
 *    - Filter steps array based on conditions
 *    - Example: show tags step only if user has premium account
 *
 * 4. Add animations:
 *    - Customize transition duration/easing in transitionToStep
 *    - Add fade effects or other transitions
 *
 * 5. Add validation:
 *    - Use step.validate() before allowing next
 *    - Show validation errors inline
 *
 * 6. Add step state:
 *    - Track completed steps
 *    - Show checkmarks on completed steps
 *    - Allow skipping optional steps
 */
