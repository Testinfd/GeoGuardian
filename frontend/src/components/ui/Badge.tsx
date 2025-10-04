/**
 * Badge Component
 * Reusable badge component with different variants and sizes
 */

import React from 'react'
import { cn } from '@/lib/design-system'
import type { BadgeProps } from '@/types'

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  onClick,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full'
  const interactiveStyles = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-200 text-gray-900',
    outline: 'border border-gray-300 bg-transparent text-gray-700',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }
  
  return (
    <span
      className={cn(
        baseStyles,
        interactiveStyles,
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge