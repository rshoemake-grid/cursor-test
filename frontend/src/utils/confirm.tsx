import type { DocumentAdapter, TimerAdapter } from '../types/adapters'
import { defaultAdapters } from '../types/adapters'

/**
 * Show a confirmation dialog (non-blocking, promise-based)
 * Returns a promise that resolves to true if confirmed, false if cancelled
 */
export function showConfirm(
  message: string,
  options: {
    title?: string
    confirmText?: string
    cancelText?: string
    type?: 'warning' | 'danger' | 'info'
    // Dependency injection
    documentAdapter?: DocumentAdapter | null
    timerAdapter?: TimerAdapter
  } = {}
): Promise<boolean> {
  const {
    title = 'Confirm',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
    documentAdapter = defaultAdapters.createDocumentAdapter(),
    timerAdapter = defaultAdapters.createTimerAdapter()
  } = options

  // Handle null document adapter
  if (!documentAdapter) {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    try {
      // Create overlay
      const overlay = documentAdapter.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    `

    // Create dialog
    const dialog = documentAdapter.createElement('div')
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease-out;
      font-family: system-ui, -apple-system, sans-serif;
    `

    // Add animation styles if not already added
    if (!documentAdapter.getElementById('confirm-dialog-styles')) {
      const style = documentAdapter.createElement('style')
      style.id = 'confirm-dialog-styles'
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `
      documentAdapter.head.appendChild(style)
    }

    // Title
    const titleEl = documentAdapter.createElement('h3')
    titleEl.textContent = title
    titleEl.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    `
    dialog.appendChild(titleEl)

    // Message
    const messageEl = documentAdapter.createElement('p')
    messageEl.textContent = message
    messageEl.style.cssText = `
      margin: 0 0 24px 0;
      color: #4b5563;
      line-height: 1.5;
      white-space: pre-line;
    `
    dialog.appendChild(messageEl)

    // Buttons container
    const buttonsContainer = documentAdapter.createElement('div')
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `
    dialog.appendChild(buttonsContainer)

    // Cancel button
    const cancelBtn = documentAdapter.createElement('button')
    cancelBtn.textContent = cancelText
    cancelBtn.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    `
    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = '#f9fafb'
    }
    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = 'white'
    }
    cancelBtn.onclick = () => {
      overlay.remove()
      resolve(false)
    }
    buttonsContainer.appendChild(cancelBtn)

    // Confirm button
    const confirmBtn = documentAdapter.createElement('button')
    confirmBtn.textContent = confirmText
    const confirmColors = {
      warning: { bg: '#f59e0b', hover: '#d97706' },
      danger: { bg: '#ef4444', hover: '#dc2626' },
      info: { bg: '#3b82f6', hover: '#2563eb' }
    }
    const colors = confirmColors[type]
    confirmBtn.style.cssText = `
      padding: 8px 16px;
      border: none;
      background: ${colors.bg};
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    `
    confirmBtn.onmouseover = () => {
      confirmBtn.style.background = colors.hover
    }
    confirmBtn.onmouseout = () => {
      confirmBtn.style.background = colors.bg
    }
    confirmBtn.onclick = () => {
      overlay.remove()
      resolve(true)
    }
    buttonsContainer.appendChild(confirmBtn)

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove()
        resolve(false)
      }
    }

    // Add to DOM
    dialog.appendChild(buttonsContainer)
    overlay.appendChild(dialog)
    documentAdapter.body.appendChild(overlay)

    // Focus confirm button
    confirmBtn.focus()
    } catch (error) {
      // Handle errors gracefully
      resolve(false)
    }
  })
}

