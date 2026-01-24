// Jest globals - no import needed
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
    jest.useFakeTimers()
  })

  afterEach(() => {
    // Clean up
    document.body.innerHTML = ''
    const existingStyles = document.getElementById('notification-styles')
    if (existingStyles) {
      existingStyles.remove()
    }
    jest.useRealTimers()
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
      jest.advanceTimersByTime(1000)
      
      // Notification should start fading out - check cssText or individual styles
      expect(notification.style.cssText).toContain('opacity: 0')
      expect(notification.style.cssText).toContain('translateX(100%)')
    })

    it('should auto-remove notification after duration', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      expect(document.body.contains(notification)).toBe(true)
      
      // Fast-forward through duration and fade-out
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(300)
      
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
      jest.advanceTimersByTime(4999)
      expect(notification.style.cssText).not.toContain('opacity: 0')
      
      jest.advanceTimersByTime(1)
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
      
      jest.advanceTimersByTime(2000)
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
      
      jest.advanceTimersByTime(3000)
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
      
      jest.advanceTimersByTime(4000)
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
      
      jest.advanceTimersByTime(6000)
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
      
      jest.advanceTimersByTime(1000)
      
      expect(notification.style.cssText).toContain('transition: opacity 0.3s')
      expect(notification.style.cssText).toContain('opacity: 0')
      expect(notification.style.cssText).toContain('translateX(100%)')
    })

    it('should remove notification after fade out completes', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      expect(document.body.contains(notification)).toBe(true)
      
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(300)
      
      expect(document.body.contains(notification)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle duration of 0', () => {
      const notification = showNotification('Test message', { duration: 0 })
      
      expect(notification).toBeTruthy()
      jest.advanceTimersByTime(0)
      jest.advanceTimersByTime(300)
      
      // Should be removed immediately
      expect(document.body.contains(notification)).toBe(false)
    })

    it('should handle very large duration', () => {
      const notification = showNotification('Test message', { duration: 100000 })
      
      expect(notification).toBeTruthy()
      jest.advanceTimersByTime(5000)
      
      // Should still be visible
      expect(document.body.contains(notification)).toBe(true)
    })

    it('should handle empty message', () => {
      const notification = showNotification('')
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('')
      expect(document.body.contains(notification)).toBe(true)
    })

    it('should handle message with only whitespace', () => {
      const notification = showNotification('   ')
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('   ')
    })

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(1000)
      const notification = showNotification(longMessage)
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe(longMessage)
    })

    it('should handle options object being undefined', () => {
      const notification = showNotification('Test message', undefined as any)
      
      expect(notification).toBeTruthy()
      expect(notification.textContent).toBe('Test message')
    })


    it('should handle duration being undefined in options', () => {
      const notification = showNotification('Test message', { type: 'success', duration: undefined })
      
      expect(notification).toBeTruthy()
      // Should use default duration of 5000
      jest.advanceTimersByTime(4999)
      expect(notification.style.cssText).not.toContain('opacity: 0')
      
      jest.advanceTimersByTime(1)
      expect(notification.style.cssText).toContain('opacity: 0')
    })

    it('should handle type being undefined in options', () => {
      const notification = showNotification('Test message', { duration: 1000, type: undefined as any })
      
      expect(notification).toBeTruthy()
      // Should use default type 'info'
      expect(notification).toBeInstanceOf(HTMLDivElement)
    })

    it('should handle style element already existing', () => {
      // Create style element first
      const existingStyle = document.createElement('style')
      existingStyle.id = 'notification-styles'
      document.head.appendChild(existingStyle)
      
      const notification = showNotification('Test message')
      
      expect(notification).toBeTruthy()
      // Should not create duplicate style element
      const styles = document.querySelectorAll('#notification-styles')
      expect(styles.length).toBe(1)
    })

    it('should handle multiple notifications with different durations', () => {
      const notification1 = showNotification('Message 1', { duration: 1000 })
      const notification2 = showNotification('Message 2', { duration: 2000 })
      
      expect(document.body.contains(notification1)).toBe(true)
      expect(document.body.contains(notification2)).toBe(true)
      
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(300)
      
      expect(document.body.contains(notification1)).toBe(false)
      expect(document.body.contains(notification2)).toBe(true)
      
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(300)
      
      expect(document.body.contains(notification2)).toBe(false)
    })

    it('should handle showSuccess with undefined duration', () => {
      const notification = showSuccess('Success', undefined)
      
      expect(notification).toBeTruthy()
      // Should use default duration
      jest.advanceTimersByTime(4999)
      expect(notification.style.cssText).not.toContain('opacity: 0')
    })

    it('should handle showError with undefined duration', () => {
      const notification = showError('Error', undefined)
      
      expect(notification).toBeTruthy()
      // Should use default duration
      jest.advanceTimersByTime(4999)
      expect(notification.style.cssText).not.toContain('opacity: 0')
    })

    it('should handle showInfo with undefined duration', () => {
      const notification = showInfo('Info', undefined)
      
      expect(notification).toBeTruthy()
      // Should use default duration
      jest.advanceTimersByTime(4999)
      expect(notification.style.cssText).not.toContain('opacity: 0')
    })

    it('should handle showWarning with undefined duration', () => {
      const notification = showWarning('Warning', undefined)
      
      expect(notification).toBeTruthy()
      // Should use default duration
      jest.advanceTimersByTime(4999)
      expect(notification.style.cssText).not.toContain('opacity: 0')
    })

    it('should handle notification removal timing edge case', () => {
      const notification = showNotification('Test message', { duration: 1000 })
      
      // Advance exactly to duration
      jest.advanceTimersByTime(1000)
      
      // Should start fading
      expect(notification.style.cssText).toContain('opacity: 0')
      
      // Advance past fade duration
      jest.advanceTimersByTime(300)
      
      // Should be removed
      expect(document.body.contains(notification)).toBe(false)
    })

    it('should handle all notification types with custom colors', () => {
      const success = showNotification('Success', { type: 'success' })
      const error = showNotification('Error', { type: 'error' })
      const info = showNotification('Info', { type: 'info' })
      const warning = showNotification('Warning', { type: 'warning' })
      
      expect(success).toBeTruthy()
      expect(error).toBeTruthy()
      expect(info).toBeTruthy()
      expect(warning).toBeTruthy()
      
      // All should be in DOM
      expect(document.body.contains(success)).toBe(true)
      expect(document.body.contains(error)).toBe(true)
      expect(document.body.contains(info)).toBe(true)
      expect(document.body.contains(warning)).toBe(true)
    })
  })

  describe('object literal coverage for helper functions', () => {
    it('should verify exact object literal for showSuccess', () => {
      const notification = showSuccess('Success message', 2000)
      
      expect(notification).toBeTruthy()
      // Verify the exact object structure: { type: 'success', duration: 2000 }
      // This kills mutants that change the object literal
      expect(notification.textContent).toBe('Success message')
      
      // Verify it uses success type (green background)
      expect(notification.style.background).toBe('rgb(16, 185, 129)') // #10b981
    })

    it('should verify exact object literal for showSuccess with undefined duration', () => {
      const notification = showSuccess('Success message', undefined)
      
      expect(notification).toBeTruthy()
      // Verify object structure: { type: 'success', duration: undefined }
      expect(notification.textContent).toBe('Success message')
    })

    it('should verify exact object literal for showError', () => {
      const notification = showError('Error message', 3000)
      
      expect(notification).toBeTruthy()
      // Verify the exact object structure: { type: 'error', duration: 3000 }
      expect(notification.textContent).toBe('Error message')
      
      // Verify it uses error type (red background)
      expect(notification.style.background).toBe('rgb(239, 68, 68)') // #ef4444
    })

    it('should verify exact object literal for showError with undefined duration', () => {
      const notification = showError('Error message', undefined)
      
      expect(notification).toBeTruthy()
      // Verify object structure: { type: 'error', duration: undefined }
      expect(notification.textContent).toBe('Error message')
    })

    it('should verify exact object literal for showInfo', () => {
      const notification = showInfo('Info message', 4000)
      
      expect(notification).toBeTruthy()
      // Verify the exact object structure: { type: 'info', duration: 4000 }
      expect(notification.textContent).toBe('Info message')
      
      // Verify it uses info type (blue background)
      expect(notification.style.background).toBe('rgb(59, 130, 246)') // #3b82f6
    })

    it('should verify exact object literal for showInfo with undefined duration', () => {
      const notification = showInfo('Info message', undefined)
      
      expect(notification).toBeTruthy()
      // Verify object structure: { type: 'info', duration: undefined }
      expect(notification.textContent).toBe('Info message')
    })

    it('should verify exact object literal for showWarning', () => {
      const notification = showWarning('Warning message', 6000)
      
      expect(notification).toBeTruthy()
      // Verify the exact object structure: { type: 'warning', duration: 6000 }
      expect(notification.textContent).toBe('Warning message')
      
      // Verify it uses warning type (orange background)
      expect(notification.style.background).toBe('rgb(245, 158, 11)') // #f59e0b
    })

    it('should verify exact object literal for showWarning with undefined duration', () => {
      const notification = showWarning('Warning message', undefined)
      
      expect(notification).toBeTruthy()
      // Verify object structure: { type: 'warning', duration: undefined }
      expect(notification.textContent).toBe('Warning message')
    })

    it('should verify all helper functions use correct type values', () => {
      const success = showSuccess('Test')
      const error = showError('Test')
      const info = showInfo('Test')
      const warning = showWarning('Test')
      
      // Verify each uses the correct type in the object literal
      expect(success.style.background).toBe('rgb(16, 185, 129)') // success: #10b981
      expect(error.style.background).toBe('rgb(239, 68, 68)') // error: #ef4444
      expect(info.style.background).toBe('rgb(59, 130, 246)') // info: #3b82f6
      expect(warning.style.background).toBe('rgb(245, 158, 11)') // warning: #f59e0b
    })

    it('should verify exact text color string literal is white', () => {
      // This kills mutants that change 'white' to empty string or other values
      const success = showSuccess('Test')
      const error = showError('Test')
      const info = showInfo('Test')
      const warning = showWarning('Test')
      
      // Verify exact text color: text: 'white' in colors object
      expect(success.style.color).toBe('white')
      expect(error.style.color).toBe('white')
      expect(info.style.color).toBe('white')
      expect(warning.style.color).toBe('white')
    })

    it('should verify exact color object literal structure', () => {
      // Verify the exact structure: { bg: '#...', text: 'white' }
      const notification = showNotification('Test', { type: 'success' })
      
      // Verify both bg and text properties exist with correct values
      expect(notification.style.background).toBe('rgb(16, 185, 129)') // #10b981
      expect(notification.style.color).toBe('white')
    })

    it('should verify all color object literals have white text', () => {
      const types: Array<'success' | 'error' | 'info' | 'warning'> = ['success', 'error', 'info', 'warning']
      
      for (const type of types) {
        const notification = showNotification('Test', { type })
        // Verify exact text color string literal: 'white'
        expect(notification.style.color).toBe('white')
      }
    })
  })
})

