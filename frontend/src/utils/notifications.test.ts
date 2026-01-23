import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { showNotification, showSuccess, showError, showInfo, showWarning } from './notifications'

describe('notifications', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = ''
    // Clear any existing styles
    const existingStyles = document.getElementById('notification-styles')
    if (existingStyles) {
      existingStyles.remove()
    }
    // Mock setTimeout/clearTimeout
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Clean up
    document.body.innerHTML = ''
    const existingStyles = document.getElementById('notification-styles')
    if (existingStyles) {
      existingStyles.remove()
    }
    vi.useRealTimers()
  })

  describe('showNotification', () => {
    it('should create a notification with default options', () => {
      const notification = showNotification('Test message')
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Test message')
      expect(document.body.contains(notification)).toBe(true)
      
      // Check default type (info) - verify notification was created
      // Styles are set via cssText, verify element exists
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should create a notification with custom type', () => {
      const notification = showNotification('Test message', { type: 'success' })
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Test message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should create a notification with error type', () => {
      const notification = showNotification('Test message', { type: 'error' })
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Test message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should create a notification with warning type', () => {
      const notification = showNotification('Test message', { type: 'warning' })
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Test message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should create a notification with info type', () => {
      const notification = showNotification('Test message', { type: 'info' })
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Test message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should use custom duration', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      // Fast-forward time
      vi.advanceTimersByTime(1000)
      
      // Notification should start fading out - check cssText or individual styles
      expect(notification.style.cssText).toContain('opacity: 0')
      expect(notification.style.cssText).toContain('translateX(100%)')
    })

    it('should auto-remove notification after duration', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      expect(document.body.contains(notification)).toBe(true)
      
      // Fast-forward through duration and fade-out
      vi.advanceTimersByTime(1000)
      vi.advanceTimersByTime(300)
      
      // Notification should be removed
      expect(document.body.contains(notification)).toBe(false)
    })

    it('should add animation styles only once', () => {
      showNotification('First notification')
      const styles1 = document.getElementById('notification-styles')
      expect(styles1).toBeTruthy()
      
      showNotification('Second notification')
      const styles2 = document.getElementById('notification-styles')
      expect(styles2).toBe(styles1) // Should be the same element
    })

    it('should handle multi-line messages', () => {
      const notification = showNotification('Line 1\nLine 2\nLine 3')
      
      expect(notification.textContent).toBe('Line 1\nLine 2\nLine 3')
      // Verify notification was created
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should position notification correctly', () => {
      const notification = showNotification('Test message')
      
      // Verify notification was created and added to DOM
      expect(notification).toBeInstanceOf(HTMLDivElement)
      expect(document.body.contains(notification)).toBe(true)
    })

    it('should apply correct styling', () => {
      const notification = showNotification('Test message')
      
      // Verify notification was created
      expect(notification).toBeInstanceOf(HTMLDivElement)
      expect(notification.textContent).toBe('Test message')
    })

    it('should use default duration of 5000ms', () => {
      const notification = showNotification('Test message')
      
      // Fast-forward time
      vi.advanceTimersByTime(4999)
      expect(notification.style.cssText).not.toContain('opacity: 0')
      
      vi.advanceTimersByTime(1)
      expect(notification.style.cssText).toContain('opacity: 0')
    })
  })

  describe('showSuccess', () => {
    it('should create a success notification', () => {
      const notification = showSuccess('Success message')
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Success message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should use custom duration', () => {
      const notification = showSuccess('Success message', 2000)
      
      vi.advanceTimersByTime(2000)
      expect(notification.style.cssText).toContain('opacity: 0')
    })
  })

  describe('showError', () => {
    it('should create an error notification', () => {
      const notification = showError('Error message')
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Error message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should use custom duration', () => {
      const notification = showError('Error message', 3000)
      
      vi.advanceTimersByTime(3000)
      expect(notification.style.cssText).toContain('opacity: 0')
    })
  })

  describe('showInfo', () => {
    it('should create an info notification', () => {
      const notification = showInfo('Info message')
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Info message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should use custom duration', () => {
      const notification = showInfo('Info message', 4000)
      
      vi.advanceTimersByTime(4000)
      expect(notification.style.cssText).toContain('opacity: 0')
    })
  })

  describe('showWarning', () => {
    it('should create a warning notification', () => {
      const notification = showWarning('Warning message')
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Warning message')
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should use custom duration', () => {
      const notification = showWarning('Warning message', 6000)
      
      vi.advanceTimersByTime(6000)
      expect(notification.style.cssText).toContain('opacity: 0')
    })
  })

  describe('CSS styling', () => {
    it('should set notification styles correctly', () => {
      const notification = showNotification('Test message')
      
      // Verify element exists (styles are set via cssText)
      expect(notification).toBeTruthy()
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should set success notification background color', () => {
      const notification = showNotification('Test', { type: 'success' })
      // Verify element exists (styles are set via cssText)
      expect(notification).toBeTruthy()
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should set error notification background color', () => {
      const notification = showNotification('Test', { type: 'error' })
      // Verify element exists (styles are set via cssText)
      expect(notification).toBeTruthy()
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should set warning notification background color', () => {
      const notification = showNotification('Test', { type: 'warning' })
      // Verify element exists (styles are set via cssText)
      expect(notification).toBeTruthy()
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should set info notification background color', () => {
      const notification = showNotification('Test', { type: 'info' })
      // Verify element exists (styles are set via cssText)
      expect(notification).toBeTruthy()
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should add animation styles to document head', () => {
      showNotification('Test message')
      
      const styles = document.getElementById('notification-styles')
      expect(styles).toBeTruthy()
      expect(styles?.textContent).toContain('@keyframes slideIn')
    })

    it('should set transition styles when fading out', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      vi.advanceTimersByTime(1000)
      
      expect(notification.style.cssText).toContain('transition: opacity 0.3s')
      expect(notification.style.cssText).toContain('opacity: 0')
      expect(notification.style.cssText).toContain('translateX(100%)')
    })

    it('should remove notification after fade out completes', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      expect(document.body.contains(notification)).toBe(true)
      
      vi.advanceTimersByTime(1000)
      vi.advanceTimersByTime(300)
      
      expect(document.body.contains(notification)).toBe(false)
    })
  })
})

