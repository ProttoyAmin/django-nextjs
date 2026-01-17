import { ButtonProps } from "@/types";
import { Loader } from "lucide-react";
import React from "react";

function Button({
  name,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  loading = false,
  size = "md",
  icon = null,
  className = "",
}: ButtonProps) {
  const baseStyles =
    "appearance-none border border-solid box-border cursor-pointer font-semibold line-height-normal select-none -webkit-user-select-none touch-action-manipulation will-change-transform transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";

  const variantStyles: { [key: string]: string } = {
    primary:
      "bg-transparent text-white-700 border-white-900 hover:bg-black-500 focus:ring-2 focus:ring-gray-900/50 shadow-[0_8px_15px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] active:translate-y-0 active:shadow-none",
    secondary:
      "bg-transparent border-transparent focus:ring-0 shadow-none min-h-0 p-2 hover:text-white-500",
    danger:
      "bg-transparent text-red-700 border-red-700 hover:bg-red-700 hover:text-white focus:ring-2 focus:ring-red-700/50 shadow-[0_8px_15px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] active:translate-y-0 active:shadow-none",
    success:
      "bg-transparent text-green-700 border-green-700 hover:bg-green-700 hover:text-white focus:ring-2 focus:ring-green-700/50 shadow-[0_8px_15px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] active:translate-y-0 active:shadow-none",
    ghost:
      "bg-transparent border-transparent focus:ring-0 shadow-none min-h-0 p-2 hover:text-white-500 hover:bg-gray-500/30",
    outline:
      "bg-transparent text-gray-400 border-gray-400 hover:text-white hover:bg-gray-800 focus:ring-0 shadow-none min-h-0 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-900/30",
    ghostDanger:
      "bg-transparent text-red-400 border-transparent hover:text-white hover:bg-red-800 focus:ring-0 shadow-none min-h-0 p-2 text-red-400 hover:text-red-500 hover:bg-red-900/30",
    warning:
      "bg-transparent text-yellow-400 border-yellow-400 hover:text-white hover:bg-yellow-800 focus:ring-0 shadow-none min-h-0 p-2 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-900/30",
    info: "bg-transparent text-blue-400 border-blue-400 hover:text-white hover:bg-blue-800 focus:ring-0 shadow-none min-h-0 p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-900/30",
    light:
      "bg-transparent text-gray-400 border-gray-400 hover:text-white hover:bg-gray-800 focus:ring-0 shadow-none min-h-0 p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-900/30",
    dark: "bg-transparent text-gray-400 border-gray-400 hover:text-white hover:bg-gray-800 focus:ring-0 shadow-none min-h-0 p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-900/30",
    default:
      "bg-transparent text-gray-400 hover:text-white focus:ring-0 shadow-none min-h-0 border-0",
  };

  const sizeStyles = {
    squared: "px-4 py-3 min-h-[3.75em] min-w-0 text-sm rounded-[5px]",
    sm: "min-w-0 text-sm rounded-[0.6375em]",
    md: "px-2 py-2 min-h-[1.75em] min-w-0 text-base rounded-[0.6375em]",
    lg: "px-8 py-4 min-h-[3.75em] min-w-0 text-lg rounded-[0.6375em]",
    rounded: "px-6 py-3.5 min-h-[3.75em] min-w-0 text-base rounded-[0.6375em]",
    default: "p-1 min-h-[3.75em] min-w-0 text-base rounded-[0.6375em]",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant || "primary"]} ${
        sizeStyles[size || "md"]
      } ${widthStyle} ${className}`}
    >
      <div className="relative flex items-center justify-center gap-2">
        {loading && (
          // <svg
          //   className="animate-spin h-4 w-4 text-current"
          //   xmlns="http://www.w3.org/2000/svg"
          //   fill="none"
          //   viewBox="0 0 24 24"
          // >
          //   <circle
          //     className="opacity-25"
          //     cx="12"
          //     cy="12"
          //     r="10"
          //     stroke="currentColor"
          //     strokeWidth="4"
          //   />
          //   <path
          //     className="opacity-75"
          //     fill="currentColor"
          //     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          //   />
          // </svg>
          <Loader size={16} />
        )}

        {/* Show icon only when not loading */}
        {!loading && icon && (
          <span className="flex items-center justify-center">{icon}</span>
        )}

        {loading ? "Loading..." : name}
      </div>
    </button>
  );
}

export default React.memo(Button);
