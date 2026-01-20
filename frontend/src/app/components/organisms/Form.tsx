// Form component with enhanced layout support, file handling, and color picker
"use client";
import React, { useState, useEffect } from "react";
import { useForm, FieldValues, UseFormReturn } from "react-hook-form";
import Input from "../atoms/Input";
import Label from "../atoms/Label";
import Button from "../atoms/Button";
import FilePreview from "../atoms/FilePreview";
import "../components.css";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema, ZodTypeDef } from "zod/v3";
import { ZodType } from "zod";
import ProgressBar from "../atoms/ProgressBar";

export interface FormField {
  name?: string;
  label?: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "tel"
    | "url"
    | "search"
    | "date"
    | "file"
    | "select"
    | "checkbox"
    | "radio"
    | "color";
  required?: boolean;
  default?: string | number | boolean | FileList | File[];
  validation?: any;
  placeholder?: string;
  floatingLabel?: boolean;
  className?: string;
  layout?: {
    colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    rowSpan?: number;
    className?: string;
  };
  accept?: string;
  multiple?: boolean;
  options?: Array<{ value: string; label: string }>;
  onChange?: (value: any) => void;
  // Color field specific properties
  colorOptions?: Array<{ value: string; name: string; hex: string }>;
  showCustomInput?: boolean;
  allowCustomColors?: boolean;
}

interface FormProps {
  fields: FormField[];
  schema?: ZodType<any, ZodTypeDef, any>;
  onSubmit: (data: any) => void;
  onChange?: (data: any) => void;
  submitButton?: {
    text?: string;
    type?: "button" | "submit" | "reset";
    variant?:
      | "primary"
      | "secondary"
      | "danger"
      | "success"
      | "ghost"
      | "outline"
      | "ghostDanger"
      | "warning"
      | "info"
      | "light"
      | "dark";
    size?: "squared" | "rounded" | "sm" | "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
  } | null;
  className?: string;
  defaultValues?: Record<string, any>;
  gridColumns?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  onFormMount?: (formMethods: UseFormReturn<FieldValues>) => void;
  resetOnSubmit?: boolean;
  children?: React.ReactNode;
  customSubmitButton?: React.ReactNode;
}

// Default color options
const DEFAULT_COLOR_OPTIONS = [
  { value: "#3b82f6", name: "Blue", hex: "#3b82f6" },
  { value: "#10b981", name: "Green", hex: "#10b981" },
  { value: "#ef4444", name: "Red", hex: "#ef4444" },
];

// Color picker component
interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  options?: Array<{ value: string; name: string; hex: string }>;
  showCustomInput?: boolean;
  allowCustomColors?: boolean;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  options = DEFAULT_COLOR_OPTIONS,
  showCustomInput = true,
  allowCustomColors = true,
  disabled = false,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState(value || "#3b82f6");

  useEffect(() => {
    const isCustomColor = !options.some((option) => option.value === value);
    if (isCustomColor && value) {
      setShowCustom(true);
      setCustomColor(value);
    }
  }, [value, options]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setShowCustom(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
  };

  const handleCustomColorApply = () => {
    if (customColor && allowCustomColors) {
      onChange(customColor);
    }
  };

  const handleCustomColorKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && allowCustomColors) {
      e.preventDefault();
      handleCustomColorApply();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((color) => (
          <button
            key={color.value}
            type="button"
            disabled={disabled}
            onClick={() => handleColorSelect(color.value)}
            className={`
              w-8 h-8 rounded-full border-2 transition-all duration-200
              ${
                value === color.value
                  ? "border-gray-300 scale-110"
                  : "border-transparent"
              }
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-105 hover:border-gray-200"
              }
            `}
            title={`${color.name} - ${color.hex}`}
            style={{ backgroundColor: color.hex }}
            aria-label={`Select ${color.name} color`}
          >
            {value === color.value && (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}

        {/* Custom color button */}
        {showCustomInput && allowCustomColors && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowCustom(!showCustom)}
            className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${showCustom ? "border-gray-300" : "border-gray-600"}
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-gray-400"
              }
              transition-colors duration-200
            `}
            title="Custom color"
            aria-label="Choose custom color"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Custom color input */}
      {showCustomInput && allowCustomColors && showCustom && (
        <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-8 h-8 rounded border border-gray-600"
                style={{ backgroundColor: customColor }}
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  onKeyUpCapture={handleCustomColorKeyPress}
                  placeholder="#RRGGBB or rgb()"
                  className="bg-gray-900 border-gray-700 text-sm"
                  disabled={disabled}
                />
              </div>
            </div>
            <Button
              name="Apply"
              type="button"
              variant="default"
              size="sm"
              onClick={handleCustomColorApply}
              disabled={disabled}
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              disabled={disabled}
              className="w-8 h-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-gray-400">
              Current:{" "}
              <code className="ml-1 bg-gray-900 px-2 py-1 rounded">
                {customColor}
              </code>
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Enter hex code (#RRGGBB) or use the color picker
          </p>
        </div>
      )}

      {/* Selected color preview */}
      <div className="mt-2 flex items-center gap-3 p-2 bg-gray-800/30 rounded">
        <div
          className="w-6 h-6 rounded border border-gray-600"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-medium text-gray-300">
          Selected color:
        </span>
        <code className="text-sm bg-gray-900 px-2 py-1 rounded font-mono">
          {value}
        </code>
      </div>
    </div>
  );
};

function Form({
  fields,
  schema,
  onSubmit,
  onChange,
  submitButton = {
    text: "Submit",
    variant: "primary",
    size: "squared",
    loading: false,
    disabled: false,
    fullWidth: false,
  },
  className = "",
  defaultValues = {},
  gridColumns = 1,
  onFormMount,
  resetOnSubmit = true,
  children,
  customSubmitButton,
}: FormProps) {
  const [isVisible, setIsVisible] = useState(false);
  const formDefaultValues = fields.reduce(
    (acc, field) => {
      // For color field, use default color if provided
      if (
        field.type === "color" &&
        !field.default &&
        !defaultValues[field.name!]
      ) {
        acc[field.name!] = DEFAULT_COLOR_OPTIONS[0].value; // Default to first color
      } else {
        acc[field.name!] =
          field.default !== undefined
            ? field.default
            : defaultValues[field.name!] || "";
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  const formMethods = useForm({
    defaultValues: formDefaultValues,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
  } = formMethods;

  const watchedValues = watch();

  React.useEffect(() => {
    if (onFormMount) {
      onFormMount(formMethods);
    }
  }, [onFormMount, formMethods]);

  React.useEffect(() => {
    if (!onChange) return;

    const subscription = watch((value) => {
      onChange(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  const processFormData = (data: any) => {
    const processedData: any = {};

    fields.forEach((field) => {
      const value = data[field.name!];

      if (field.type === "file") {
        if (value instanceof FileList) {
          processedData[field.name!] = Array.from(value);
        } else {
          processedData[field.name!] = value;
        }
      } else if (value === "") {
        if (field.required) {
          processedData[field.name!] = value;
        } else {
          processedData[field.name!] = field.type === "number" ? null : "";
        }
      } else if (field.type === "number") {
        processedData[field.name!] = value ? Number(value) : null;
      } else if (field.type === "checkbox") {
        processedData[field.name!] = Boolean(value);
      } else if (field.type === "color") {
        // Validate color format for color field
        const isValidColor =
          /^#([0-9A-F]{3}){1,2}$/i.test(value) ||
          /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.test(value) ||
          /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/i.test(
            value,
          );

        if (!isValidColor && field.required && value) {
          // If invalid but required, keep it (validation will catch it)
          processedData[field.name!] = value;
        } else if (isValidColor || !field.required) {
          processedData[field.name!] = value;
        } else {
          processedData[field.name!] = "";
        }
      } else {
        processedData[field.name!] = value;
      }
    });

    return processedData;
  };

  const validateFile = (files: FileList | File[] | null, field: FormField) => {
    if (
      !files ||
      (Array.isArray(files) ? files.length === 0 : files.length === 0)
    ) {
      if (field.required) {
        return `${field.label} is required`;
      }
      return true;
    }

    const fileList = Array.isArray(files) ? files : Array.from(files);

    if (!field.multiple && fileList.length > 1) {
      return "Only one file is allowed";
    }

    if (field.accept) {
      const acceptedTypes = field.accept.split(",").map((type) => type.trim());

      for (const file of fileList) {
        let isValidType = false;

        for (const acceptedType of acceptedTypes) {
          if (acceptedType.startsWith(".")) {
            const fileExtension =
              "." + file.name.split(".").pop()?.toLowerCase();
            if (fileExtension === acceptedType.toLowerCase()) {
              isValidType = true;
              break;
            }
          } else {
            if (file.type.match(acceptedType.replace("*", ".*"))) {
              isValidType = true;
              break;
            }
          }
        }

        if (!isValidType) {
          return `File type not allowed. Accepted types: ${field.accept}`;
        }
      }
    }

    const maxSize = 50 * 1024 * 1024;
    for (const file of fileList) {
      if (file.size > maxSize) {
        return "File size too large. Maximum size is 50MB";
      }
    }

    return true;
  };

  const validateColor = (color: string, field: FormField) => {
    if (!color && field.required) {
      return `${field.label} is required`;
    }

    if (color) {
      // Check if it's a valid color format
      const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(color);
      const isValidRgb = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i.test(
        color,
      );
      const isValidRgba =
        /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/i.test(
          color,
        );

      if (!isValidHex && !isValidRgb && !isValidRgba) {
        return "Please enter a valid color code (hex, rgb, or rgba)";
      }
    }

    return true;
  };

  const handleFormSubmit = (data: any) => {
    const processedData = processFormData(data);
    onSubmit(processedData);
    if (resetOnSubmit) {
      reset();
    }
  };

  const handleFieldChange = (field: FormField, value: any) => {
    if (field.onChange) {
      field.onChange(value);
    }
  };

  const handleColorChange = (fieldName: string, color: string) => {
    setValue(fieldName, color, { shouldValidate: true });

    // Find the field and call its onChange if exists
    const field = fields.find((f) => f.name === fieldName);
    if (field?.onChange) {
      field.onChange(color);
    }
  };

  const getGridClass = (columns: number) => {
    const gridClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
      6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-6",
      7: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7",
      8: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8",
      9: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9",
      10: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-10",
      11: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-11",
      12: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12",
    };
    return gridClasses[columns as keyof typeof gridClasses] || gridClasses[1];
  };

  const getColSpanClass = (colSpan: number = 1) => {
    const colSpanClasses = {
      1: "col-span-1",
      2: "col-span-1 md:col-span-2",
      3: "col-span-1 md:col-span-3",
      4: "col-span-1 md:col-span-4",
      5: "col-span-1 md:col-span-5",
      6: "col-span-1 md:col-span-6",
      7: "col-span-1 md:col-span-7",
      8: "col-span-1 md:col-span-8",
      9: "col-span-1 md:col-span-9",
      10: "col-span-1 md:col-span-10",
      11: "col-span-1 md:col-span-11",
      12: "col-span-1 md:col-span-12",
    };
    return (
      colSpanClasses[colSpan as keyof typeof colSpanClasses] ||
      colSpanClasses[1]
    );
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "color":
        return (
          <div>
            <input
              type="hidden"
              id={field.name}
              {...register(field.name!, {
                required: field.required ? `${field.label} is required` : false,
                validate: (value) => validateColor(value, field),
                ...field.validation,
              })}
            />
            <ColorPicker
              value={
                watchedValues[field.name!] || DEFAULT_COLOR_OPTIONS[0].value
              }
              onChange={(color) => handleColorChange(field.name!, color)}
              options={field.colorOptions || DEFAULT_COLOR_OPTIONS}
              showCustomInput={field.showCustomInput !== false}
              allowCustomColors={field.allowCustomColors !== false}
              disabled={isSubmitting}
            />
          </div>
        );

      case "select":
        return (
          <>
            <select
              id={field.name}
              disabled={isSubmitting}
              className={`bg-[#1f1f1f] w-full px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-amber-50 ${
                errors[field.name!] ? "border-red-500" : "border-gray-300"
              } ${field.className}`}
              {...register(field.name!, {
                required: field.required ? `${field.label} is required` : false,
                ...field.validation,
                onChange: (e) => handleFieldChange(field, e.target.value),
              })}
            >
              <option value="" className="">
                {field.label}
              </option>
              {field.options?.map((option) => (
                <option
                  key={option.value}
                  className="text-sm"
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
            {watchedValues[field.name!] === "alumni" && (
              <p className="text-gray-400 text-xs mt-1">
                * Note: Alumnis will authenticate with the regular email you
                provided.
              </p>
            )}
          </>
        );

      case "checkbox":
        return (
          <div className="flex items-center">
            <label htmlFor={field.name} className="ml-2 block text-sm">
              <input
                id={field.name}
                type="checkbox"
                disabled={isSubmitting}
                className={`${field.className}`}
                {...register(field.name!, {
                  required: field.required
                    ? `${field.label} is required`
                    : false,
                  ...field.validation,
                  onChange: (e) => handleFieldChange(field, e.target.checked),
                })}
              />
              {field.label}
            </label>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  id={`${field.name}-${index}`}
                  type="radio"
                  value={option.value}
                  disabled={isSubmitting}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${field.className}`}
                  {...register(field.name!, {
                    required: field.required
                      ? `${field.label} is required`
                      : false,
                    ...field.validation,
                    onChange: (e) => handleFieldChange(field, e.target.value),
                  })}
                />
                <label
                  htmlFor={`${field.name}-${index}`}
                  className="ml-2 block text-sm"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case "file":
        return (
          <div>
            <Input
              id={field.name!}
              type="file"
              label={field.floatingLabel ? field.label : undefined}
              floatingLabel={field.floatingLabel}
              disabled={isSubmitting}
              accept={field.accept}
              multiple={field.multiple}
              error={errors[field.name!] as any}
              className={field.className}
              {...register(field.name!, {
                required: field.required ? `${field.label} is required` : false,
                validate: (value) => validateFile(value, field),
                ...field.validation,
                onChange: (e) => handleFieldChange(field, e.target.files),
              })}
            />

            <FilePreview
              files={watchedValues[field.name!]}
              fieldName={field.name!}
            />
          </div>
        );

      case "textarea":
        return (
          <Input
            id={field.name!}
            type={field.type}
            label={field.floatingLabel ? field.label : undefined}
            floatingLabel={field.floatingLabel}
            disabled={isSubmitting}
            placeholder={field.placeholder}
            error={errors[field.name!] as any}
            className={field.className}
            {...register(field.name!, {
              required: field.required ? `${field.label} is required` : false,
              ...field.validation,
              onChange: (e) => handleFieldChange(field, e.target.value),
            })}
          />
        );

      case "password":
        return (
          <>
            <div className="relative">
              <Input
                id={field.name!}
                type={isVisible ? "text" : "password"}
                label={field.floatingLabel ? field.label : undefined}
                floatingLabel={field.floatingLabel}
                disabled={isSubmitting}
                placeholder={field.placeholder}
                error={errors[field.name!] as any}
                className={`${field.className}`}
                {...register(field.name!, {
                  required: field.required
                    ? `${field.label} is required`
                    : false,
                  ...field.validation,
                  onChange: (e) => handleFieldChange(field, e.target.value),
                })}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {isVisible ? (
                  <EyeIcon
                    opacity={0.5}
                    size={16}
                    className="cursor-pointer text-gray-500"
                    onClick={() => setIsVisible(!isVisible)}
                  />
                ) : (
                  <EyeOffIcon
                    opacity={0.5}
                    size={16}
                    className="cursor-pointer text-gray-500"
                    onClick={() => setIsVisible(!isVisible)}
                  />
                )}
              </div>
            </div>
            {watchedValues[field.name!]?.length > 1 && (
              <ProgressBar
                password={
                  watchedValues[field.name!]?.length > 1
                    ? watchedValues[field.name!]
                    : ""
                }
                showText={false}
                height="1px"
              />
            )}
          </>
        );

      default:
        return (
          <Input
            id={field.name!}
            type={field.type || "text"}
            label={field.floatingLabel ? field.label : undefined}
            floatingLabel={field.floatingLabel}
            disabled={isSubmitting}
            placeholder={field.placeholder}
            error={errors[field.name!] as any}
            className={field.className}
            {...register(field.name!, {
              required: field.required ? `${field.label} is required` : false,
              ...field.validation,
              valueAsNumber: field.type === "number",
              onChange: (e) => handleFieldChange(field, e.target.value),
            })}
          />
        );
    }
  };

  return (
    <div className={`min-h-full w-full mx-auto  ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className={`grid ${getGridClass(gridColumns)} gap-6`}>
          {fields.map((field) => (
            <div
              key={field.name}
              className={`form-field ${getColSpanClass(
                field.layout?.colSpan,
              )} ${field.layout?.className || ""}`}
            >
              {!field.floatingLabel && field.type !== "color" && (
                <Label htmlFor={field.name!} required={field.required}>
                  {field.label}
                </Label>
              )}

              {field.type === "color" && !field.floatingLabel && (
                <Label
                  htmlFor={field.name!}
                  required={field.required}
                  className="block mb-2"
                >
                  {field.label}
                </Label>
              )}

              {renderField(field)}

              {errors[field.name!] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[field.name!]?.message as string}
                </p>
              )}
            </div>
          ))}
        </div>

        {children}

        {/* Custom submit button logic */}
        {customSubmitButton ? (
          <div className="flex justify-end">{customSubmitButton}</div>
        ) : (
          submitButton !== null && (
            <div className="flex justify-end">
              <Button
                name={submitButton?.text || "Submit"}
                type={submitButton?.type || "submit"}
                loading={isSubmitting || submitButton?.loading}
                disabled={isSubmitting || submitButton?.disabled}
                size={submitButton?.size}
                variant={submitButton?.variant}
                fullWidth={submitButton?.fullWidth}
              />
            </div>
          )
        )}
      </form>
    </div>
  );
}

export default Form;
