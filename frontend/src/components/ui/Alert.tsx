/**
 * Alert Component
 * Reusable alert component for displaying different types of messages
 */

import React from 'react'
import { cn } from '@/lib/design-system'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

interface AlertProps {
  type?: 'success' | 'warning' | 'danger' | 'info'
  variant?: 'success' | 'warning' | 'danger' | 'error' | 'info' | 'destructive' | 'default'
  title?: string
  message?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  children?: React.ReactNode
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  variant,
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
  children,
}) => {
  // Support both type and variant props for compatibility
  const alertType = variant === 'error' ? 'danger' : 
                   variant === 'destructive' ? 'danger' : 
                   variant === 'default' ? 'info' : 
                   (variant || type)
  const baseStyles = 'p-4 rounded-lg border flex items-start space-x-3'
  
  const variants = {
    success: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    danger: 'bg-danger-50 border-danger-200 text-danger-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }
  
  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    danger: XCircle,
    info: Info,
  }
  
  const iconColors = {
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-danger-500',
    info: 'text-blue-500',
  }
  
  const Icon = icons[alertType as keyof typeof icons]
  
  return (
    <div className={cn(baseStyles, variants[alertType as keyof typeof variants], className)}>
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[alertType as keyof typeof iconColors])} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium mb-1">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-sm">
            {message}
          </p>
        )}
        {children}
      </div>
      
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default Alert