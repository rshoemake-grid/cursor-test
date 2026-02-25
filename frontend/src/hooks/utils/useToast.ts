/**
 * Custom Hook for Toast Notifications
 * SOLID: Single Responsibility - only manages toast state
 * DRY: Reusable toast logic
 * DIP: Depends on abstractions
 */

import { useState, useCallback } from 'react'
import type { ToastType } from '../../components/ui/Toast'

export interface ToastData {
  id: string
  message: string
  type?: ToastType
  duration?: number
}

/**
 * Custom hook for managing toast notifications
 * 
 * @returns Toast state and control functions
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newToast: ToastData = {
        id,
        message,
        type,
        duration,
      }

      setToasts((prev) => [...prev, newToast])
      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => addToast(message, 'success', duration),
    [addToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => addToast(message, 'error', duration),
    [addToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => addToast(message, 'warning', duration),
    [addToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => addToast(message, 'info', duration),
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
