/**
 * Loading Spinner Component
 * Reusable loading spinner with different sizes
 */

import React from 'react'
import { cn } from '@/lib/design-system'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  className?: string
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }
  
  const colors = {
    primary: 'border-primary-500',
    secondary: 'border-secondary-500',
    white: 'border-white',
    gray: 'border-gray-500',
  }
  
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-current',
        sizes[size],
        colors[color],
        className
      )}
    />
  )
}

export default Loading