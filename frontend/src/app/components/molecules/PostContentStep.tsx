// src/app/components/molecules/PostContentStep.tsx
import React from 'react';
import Form, { FormField } from '../organisms/Form';
import { PostFormType } from '@/src/types/post';

interface PostContentStepProps {
  data: Partial<PostFormType>;
  onChange: (data: Partial<PostFormType>) => void;
  onWatch?: (watchFunction: any) => void;
  onNext: (data: Partial<PostFormType>) => void;
  isActive: boolean;
}

const contentFields: FormField[] = [
  {
    name: "content",
    label: "What's on your mind?",
    type: "textarea",
    placeholder: "Share your thoughts...",
    floatingLabel: true,
    layout: {
      colSpan: 12
    },
    className: ""
  },
  {
    name: "media",
    label: "Add Photos & Videos",
    type: "file",
    multiple: true,
    accept: "image/*,video/*,.mp4,.mov,.avi,.mkv",
    layout: {
      colSpan: 12
    }
  }
];

function PostContentStep({ data, onChange, onWatch, onNext, isActive }: PostContentStepProps) {
  const handleFormChange = (formData: Partial<PostFormType>) => {
    onChange(formData);
  };

  const handleFormMount = (formMethods: any) => {
    if (onWatch && formMethods.watch) {
      onWatch(formMethods.watch);
    }
  };

  const handleNext = (formData: Partial<PostFormType>) => {
    onNext(formData);
  };

  const isNextEnabled = Boolean(
    data.content || 
    (data.media && data.media.length > 0)
  );

  return (
    <>
    <div className={`p-6 ${!isActive ? 'hidden' : ''}`}>
      <Form
        fields={contentFields}
        onSubmit={handleNext}
        submitButton={{
          text: 'Next',
          disabled: !isNextEnabled
        }}
        defaultValues={data}
        onFormMount={handleFormMount}
        resetOnSubmit={false}
        onChange={handleFormChange}
      />
    </div>
    </>
  );
}

export default React.memo(PostContentStep);