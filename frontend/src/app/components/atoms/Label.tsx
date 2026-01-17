import React, { LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string
  required?: boolean
}

const Label: React.FC<LabelProps> = ({ 
  htmlFor, 
  children, 
  required = false, 
  className = '',
  ...props 
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-2 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

export default Label