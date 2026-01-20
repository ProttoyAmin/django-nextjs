"use client";
import React, { InputHTMLAttributes, forwardRef } from "react";
import { FieldError } from "react-hook-form";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  type?: string;
  label?: string;
  error?: FieldError;
  floatingLabel?: boolean;
  defaultValue?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      type,
      label,
      error,
      floatingLabel = true,
      className = "",
      defaultValue,
      ...props
    },
    ref,
  ) => {
    if (floatingLabel) {
      return (
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={type}
            {...props}
            className={`
              peer block w-full px-0 py-2 border-0 border-b-2 
              bg-transparent focus:outline-none focus:ring-0
              ${
                error
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-grey-300 focus:border-black-500"
              }
              ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${className}
            `}
            placeholder=" "
            defaultValue={defaultValue}
          />

          {label && (
            <label
              htmlFor={id}
              className={`
                absolute left-0 top-2 
                text-gray-500 
                transition-all duration-300 ease-in-out
                peer-focus:-top-5 peer-focus:text-sm
                peer-focus:text-white
                peer-[:not(:placeholder-shown)]:-top-5
                peer-[:not(:placeholder-shown)]:text-sm
                ${error ? "text-red-500" : ""}
                pointer-events-none
              `}
            >
              {label}
            </label>
          )}

          {/* Underline effect */}
          <div
            className={`
            absolute bottom-0 left-0 h-0.5 w-full 
            transition-all duration-300 ease-in-out
            transform scale-x-0
            peer-focus:scale-x-100
            peer-[:not(:placeholder-shown)]:scale   -x-100
            ${error ? "bg-red-500" : "bg-white"}
          `}
          />
        </div>
      );
    }

    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          type={type}
          {...props}
          className={`
            w-full px-3 py-2 border rounded-lg
            bg-black focus:outline-none focus:ring-2
            ${
              error
                ? "border-red-500 focus:ring-red-500/50"
                : "border-gray-300 focus:border-purple-500 focus:ring-purple-500/50"
            }
            ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${className}
          `}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
