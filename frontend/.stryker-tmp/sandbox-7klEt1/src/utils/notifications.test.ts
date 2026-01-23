// @ts-nocheck
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
      
      // Check default type (info)
      expect(notification.style.background).toContain('#3b82f6')
      expect(notification.style.color).toBe('white')
    })

    it('should create a notification with custom type', () => {
      const notification = showNotification('Test message', { type: 'success' })
      
      expect(notification.style.background).toContain('#10b981')
      expect(notification.style.color).toBe('white')
    })

    it('should create a notification with error type', () => {
      const notification = showNotification('Test message', { type: 'error' })
      
      expect(notification.style.background).toContain('#ef4444')
      expect(notification.style.color).toBe('white')
    })

    it('should create a notification with warning type', () => {
      const notification = showNotification('Test message', { type: 'warning' })
      
      expect(notification.style.background).toContain('#f59e0b')
      expect(notification.style.color).toBe('white')
    })

    it('should create a notification with info type', () => {
      const notification = showNotification('Test message', { type: 'info' })
      
      expect(notification.style.background).toContain('#3b82f6')
      expect(notification.style.color).toBe('white')
    })

    it('should use custom duration', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      // Fast-forward time
      vi.advanceTimersByTime(1000)
      
      // Notification should start fading out
      expect(notification.style.transition).toBe('opacity 0.3s, transform 0.3s')
      expect(notification.style.opacity).toBe('0')
      expect(notification.style.transform).toBe('translateX(100%)')
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
      expect(notification.style.whiteSpace).toBe('pre-line')
    })

    it('should position notification correctly', () => {
      const notification = showNotification('Test message')
      
      expect(notification.style.position).toBe('fixed')
      expect(notification.style.top).toBe('20px')
      expect(notification.style.right).toBe('20px')
    })

    it('should apply correct styling', () => {
      const notification = showNotification('Test message')
      
      expect(notification.style.padding).toBe('16px 24px')
      expect(notification.style.borderRadius).toBe('8px')
      expect(notification.style.zIndex).toBe('10000')
      expect(notification.style.maxWidth).toBe('400px')
    })

    it('should use default duration of 5000ms', () => {
      const notification = showNotification('Test message')
      
      // Fast-forward time
      vi.advanceTimersByTime(4999)
      expect(notification.style.opacity).toBe('')
      
      vi.advanceTimersByTime(1)
      expect(notification.style.opacity).toBe('0')
    })
  })

  describe('showSuccess', () => {
    it('should create a success notification', () => {
      const notification = showSuccess('Success message')
      
      expect(notification.style.background).toContain('#10b981')
      expect(notification.textContent).toBe('Success message')
    })

    it('should use custom duration', () => {
      const notification = showSuccess('Success message', 2000)
      
      vi.advanceTimersByTime(2000)
      expect(notification.style.opacity).toBe('0')
    })
  })

  describe('showError', () => {
    it('should create an error notification', () => {
      const notification = showError('Error message')
      
      expect(notification.style.background).toContain('#ef4444')
      expect(notification.textContent).toBe('Error message')
    })

    it('should use custom duration', () => {
      const notification = showError('Error message', 3000)
      
      vi.advanceTimersByTime(3000)
      expect(notification.style.opacity).toBe('0')
    })
  })

  describe('showInfo', () => {
    it('should create an info notification', () => {
      const notification = showInfo('Info message')
      
      expect(notification.style.background).toContain('#3b82f6')
      expect(notification.textContent).toBe('Info message')
    })

    it('should use custom duration', () => {
      const notification = showInfo('Info message', 4000)
      
      vi.advanceTimersByTime(4000)
      expect(notification.style.opacity).toBe('0')
    })
  })

  describe('showWarning', () => {
    it('should create a warning notification', () => {
      const notification = showWarning('Warning message')
      
      expect(notification.style.background).toContain('#f59e0b')
      expect(notification.textContent).toBe('Warning message')
    })

    it('should use custom duration', () => {
      const notification = showWarning('Warning message', 6000)
      
      vi.advanceTimersByTime(6000)
      expect(notification.style.opacity).toBe('0')
    })
  })
})

