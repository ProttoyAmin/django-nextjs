export interface EditProfileType {
  first_name: string
  last_name: string
  email: string
  professional_email: string | null
  student_id: string | null
  department: string | null
  year: string | null
}

// Configuration for form fields - easily extensible for future fields
export interface FormFieldConfig {
  name: keyof EditProfileType
  label: string
  placeholder?: string
  type?: string
  required: boolean
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
}

export const PROFILE_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: "first_name",
    label: "First Name",
    placeholder: "Enter your first name",
    type: "text",
    required: true,
    validation: { minLength: 1, maxLength: 50 },
  },
  {
    name: "last_name",
    label: "Last Name",
    placeholder: "Enter your last name",
    type: "text",
    required: true,
    validation: { minLength: 1, maxLength: 50 },
  },
  {
    name: "email",
    label: "Email",
    placeholder: "your@email.com",
    type: "email",
    required: true,
    validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  },
  {
    name: "professional_email",
    label: "Educational Email",
    placeholder: "your.name@university.edu",
    type: "email",
    required: false,
    validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  },
  {
    name: "student_id",
    label: "Student ID",
    placeholder: "e.g., STU123456",
    type: "text",
    required: false,
    validation: { minLength: 1, maxLength: 20 },
  },
  {
    name: "department",
    label: "Department",
    placeholder: "e.g., Computer Science",
    type: "text",
    required: false,
    validation: { minLength: 1, maxLength: 50 },
  },
  {
    name: "year",
    label: "Academic Year",
    placeholder: "e.g., 2nd Year",
    type: "text",
    required: false,
    validation: { minLength: 1, maxLength: 20 },
  },
]
