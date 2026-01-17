import { FormField } from "../app/components/organisms/Form";


export const settingsFormFields: FormField[] = [
    {
      name: "username",
      label: "Username",
      type: "text",
      required: true,
      floatingLabel: true,
      layout: { colSpan: 6 }
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      floatingLabel: true,
      layout: { colSpan: 6 }
    },
    {
      name: "current_password",
      label: "Current Password",
      type: "password",
      floatingLabel: true,
      layout: { colSpan: 4 }
    },
    {
      name: "new_password",
      label: "New Password",
      type: "password",
      floatingLabel: true,
      layout: { colSpan: 4 }
    },
    {
      name: "confirm_password",
      label: "Confirm Password",
      type: "password",
      floatingLabel: true,
      layout: { colSpan: 4 }
    }
  ];

export const contactFormFields: FormField[] = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      required: true,
      floatingLabel: true,
      layout: { colSpan: 12 }
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      required: true,
      floatingLabel: true,
      layout: { colSpan: 6 }
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      floatingLabel: true,
      layout: { colSpan: 6 }
    },
    {
      name: "subject",
      label: "Subject",
      type: "text",
      floatingLabel: true,
      layout: { colSpan: 12 }
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      required: true,
      floatingLabel: true,
      layout: { colSpan: 12 },
      className: "min-h-[150px]"
    }
  ];


  export const postFormFields: FormField[] = [
    {
      name: "content",
      label: "Content",
      type: "textarea",
      placeholder: "What's on your mind?",
      floatingLabel: true,
      layout: {
        colSpan: 12
      },
      className: "min-h-[120px]"
    },
    {
      name: "media",
      label: "Add Media",
      type: "file",
      multiple: true,
      accept: "image/*,video/*,.mp4,.mov,.avi,.mkv",
      layout: {
        colSpan: 12
      }
    },
    {
      name: "visibility",
      label: "Visibility",
      type: "text", // You might want to use 'select' here later
      placeholder: "Public, Friends, Only Me",
      floatingLabel: true,
      layout: {
        colSpan: 6
      }
    }
  ];