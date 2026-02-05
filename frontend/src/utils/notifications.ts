import type { DocumentAdapter, TimerAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationOptions {
  duration?: number // milliseconds, default 5000
  type?: NotificationType // default 'info'
  // Dependency injection
  documentAdapter?: DocumentAdapter | null
  timerAdapter?: TimerAdapter
}

/**
 * Show a non-blocking notification toast
 */
export function showNotification(message: string, options: NotificationOptions = {}) {
  const { 
    duration = 5000, 
    type = 'info',
    documentAdapter = defaultAdapters.createDocumentAdapter(),
    timerAdapter = defaultAdapters.createTimerAdapter()
  } = options

  // Handle null document adapter
  // Explicit check to prevent mutation survivors
  if (documentAdapter === null || documentAdapter === undefined) {
    return null
  }

  const colors = {
    success: { bg: '#10b981', text: 'white' },
    error: { bg: '#ef4444', text: 'white' },
    info: { bg: '#3b82f6', text: 'white' },
    warning: { bg: '#f59e0b', text: 'white' }
  }

  const color = colors[type]

  try {
    const notification = documentAdapter.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    color: ${color.text};
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    max-width: 400px;
    white-space: pre-line;
    font-family: system-ui, -apple-system, sans-serif;
    animation: slideIn 0.3s ease-out;
  `

    // Add animation keyframes if not already added
    // Explicit check to prevent mutation survivors
    if (documentAdapter.getElementById('notification-styles') === null) {
      const style = documentAdapter.createElement('style')
      style.id = 'notification-styles'
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `
      documentAdapter.head.appendChild(style)
    }

    notification.textContent = message
    documentAdapter.body.appendChild(notification)

    // Auto-remove after duration
    timerAdapter.setTimeout(() => {
      notification.style.transition = 'opacity 0.3s, transform 0.3s'
      notification.style.opacity = '0'
      notification.style.transform = 'translateX(100%)'
      timerAdapter.setTimeout(() => notification.remove(), 300)
    }, duration)

    return notification
  } catch (error) {
    // Handle errors gracefully
    return null
  }
}

/**
 * Show a success notification
 */
export function showSuccess(message: string, duration?: number) {
  return showNotification(message, { type: 'success', duration })
}

/**
 * Show an error notification
 */
export function showError(message: string, duration?: number) {
  return showNotification(message, { type: 'error', duration })
}

/**
 * Show an info notification
 */
export function showInfo(message: string, duration?: number) {
  return showNotification(message, { type: 'info', duration })
}

/**
 * Show a warning notification
 */
export function showWarning(message: string, duration?: number) {
  return showNotification(message, { type: 'warning', duration })
}

