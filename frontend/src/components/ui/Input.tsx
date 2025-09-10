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

    // Check if onChange accepts an event (standard React pattern) or just a value (custom pattern)
    const targetValue = e.target.value

    // Try calling with the full event first (standard React pattern)
    try {
      (onChange as (event: React.ChangeEvent<HTMLInputElement>) => void)(e)
    } catch {
      // If that fails, try calling with just the value (custom pattern)
      try {
        (onChange as (value: string) => void)(targetValue)
      } catch {
        // If both fail, log the issue
        console.warn('Input onChange handler failed for both value and event patterns')
      }
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