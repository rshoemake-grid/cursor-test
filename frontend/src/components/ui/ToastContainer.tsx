/**
 * Toast Container Component
 * SOLID: Single Responsibility - only manages toast list
 * DRY: Centralized toast management
 * DIP: Depends on abstractions
 */

import { useCallback } from 'react'
import Toast, { type ToastType } from './Toast'

export interface ToastData {
  id: string
  message: string
  type?: ToastType
  duration?: number
}

export interface ToastContainerProps {
  toasts: ToastData[]
  onRemoveToast: (id: string) => void
}

/**
 * Toast Container Component
 * Manages and displays multiple toast notifications
 */
export default function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  const handleClose = useCallback(
    (id: string) => {
      onRemoveToast(id)
    },
    [onRemoveToast]
  )

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={handleClose}
          />
        </div>
      ))}
    </div>
  )
}
