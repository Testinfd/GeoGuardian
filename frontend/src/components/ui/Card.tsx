/**
 * Card Component
 * Reusable card component with multiple variants
 */

import React from 'react'
import { cn } from '@/lib/design-system'
import type { CardProps } from '@/types'

const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  variant = 'default',
  onClick,
  className,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-xl border border-gray-100 overflow-hidden'
  
  const variants = {
    default: 'shadow-md',
    hover: 'shadow-md hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 cursor-pointer',
    glass: 'bg-white/10 backdrop-blur-md border-white/20',
  }
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }
  
  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {(title || description) && (
        <div className="p-6 pb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-600 text-sm">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(
        title || description ? 'p-6 pt-0' : 'p-6'
      )}>
        {children}
      </div>
    </div>
  )
}

export default Card