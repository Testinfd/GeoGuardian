/**
 * Input Component
 * Reusable input component with validation and error states
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/design-system'
import type { InputProps } from '@/types'

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyPress,
  error,
  disabled = false,
  required = false,
  className,
  ...props
}, ref) => {
  const baseStyles = 'block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200'
  
  const variants = {
    default: 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
    error: 'border-danger-300 focus:ring-danger-500 focus:border-danger-500',
    disabled: 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed',
  }
  
  const getVariant = () => {
    if (disabled) return 'disabled'
    if (error) return 'error'
    return 'default'
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return

    const targetValue: string = e.target.value
    
    // Support both event-based and value-based onChange patterns
    // Check if onChange expects a string parameter (value-based) or event (event-based)
    if (typeof onChange === 'function') {
      // Most of our components use value-based onChange, so call with value
      ;(onChange as any)(targetValue)
    }
  }
  
  return (
    <div className="w-full">
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyPress={onKeyPress}
        disabled={disabled}
        required={required}
        className={cn(
          baseStyles,
          variants[getVariant()],
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input