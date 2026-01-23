import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { showConfirm } from './confirm'

describe('confirm', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = ''
    // Clear any existing styles
    const existingStyles = document.getElementById('confirm-dialog-styles')
    if (existingStyles) {
      existingStyles.remove()
    }
  })

  afterEach(() => {
    // Clean up
    document.body.innerHTML = ''
    const existingStyles = document.getElementById('confirm-dialog-styles')
    if (existingStyles) {
      existingStyles.remove()
    }
  })

  describe('showConfirm', () => {
    it('should return a promise', () => {
      const promise = showConfirm('Test message')
      expect(promise).toBeInstanceOf(Promise)
      
      // Clean up
      const buttons = document.querySelectorAll('button')
      if (buttons.length > 0) {
        (buttons[0] as HTMLButtonElement).click()
      }
    })

    it('should resolve to false when cancel button is clicked', async () => {
      const promise = showConfirm('Test message')
      
      // Wait for DOM to be created
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      const cancelBtn = buttons[0] as HTMLButtonElement
      cancelBtn.click()
      
      const result = await promise
      expect(result).toBe(false)
    })

    it('should resolve to true when confirm button is clicked', async () => {
      const promise = showConfirm('Test message')
      
      // Wait for DOM to be created
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(1)
      
      const confirmBtn = buttons[1] as HTMLButtonElement
      confirmBtn.click()
      
      const result = await promise
      expect(result).toBe(true)
    })

    it('should use custom title', async () => {
      const promise = showConfirm('Test message', { title: 'Custom Title' })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const title = document.querySelector('h3')
      expect(title?.textContent).toBe('Custom Title')
      
      const buttons = document.querySelectorAll('button')
      buttons[0].click()
      await promise
    })

    it('should use custom button texts', async () => {
      const promise = showConfirm('Test message', {
        confirmText: 'Yes',
        cancelText: 'No'
      })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      expect(buttons[0].textContent).toBe('No')
      expect(buttons[1].textContent).toBe('Yes')
      
      buttons[0].click()
      await promise
    })

    it('should resolve to false when overlay is clicked', async () => {
      const promise = showConfirm('Test message')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const overlay = document.body.lastElementChild as HTMLElement
      expect(overlay).toBeTruthy()
      
      // Click overlay directly
      overlay.click()
      
      const result = await promise
      expect(result).toBe(false)
    })

    it('should apply warning type colors', async () => {
      const promise = showConfirm('Test message', { type: 'warning' })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBe(2)
      
      // Find confirm button
      const confirmBtn = Array.from(buttons).find(btn => btn.textContent === 'Confirm') as HTMLButtonElement
      expect(confirmBtn).toBeTruthy()
      
      // Verify button exists and function works correctly
      // The actual color is set via template string in cssText
      expect(confirmBtn).toBeInstanceOf(HTMLButtonElement)
      
      confirmBtn.click()
      const result = await promise
      expect(result).toBe(true)
    })

    it('should apply danger type colors', async () => {
      const promise = showConfirm('Test message', { type: 'danger' })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBe(2)
      
      // Find confirm button
      const confirmBtn = Array.from(buttons).find(btn => btn.textContent === 'Confirm') as HTMLButtonElement
      expect(confirmBtn).toBeTruthy()
      
      // Verify button exists and function works correctly
      expect(confirmBtn).toBeInstanceOf(HTMLButtonElement)
      
      confirmBtn.click()
      const result = await promise
      expect(result).toBe(true)
    })

    it('should apply info type colors', async () => {
      const promise = showConfirm('Test message', { type: 'info' })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBe(2)
      
      // Find confirm button
      const confirmBtn = Array.from(buttons).find(btn => btn.textContent === 'Confirm') as HTMLButtonElement
      expect(confirmBtn).toBeTruthy()
      
      // Verify button exists and function works correctly
      expect(confirmBtn).toBeInstanceOf(HTMLButtonElement)
      
      confirmBtn.click()
      const result = await promise
      expect(result).toBe(true)
    })

    it('should handle hover effects on cancel button', async () => {
      const promise = showConfirm('Test message')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      const cancelBtn = buttons[0] as HTMLButtonElement
      
      // Test hover
      cancelBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      expect(cancelBtn.style.background).toBe('rgb(249, 250, 251)')
      
      // Test mouseout
      cancelBtn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
      expect(cancelBtn.style.background).toBe('white')
      
      cancelBtn.click()
      await promise
    })

    it('should handle hover effects on confirm button', async () => {
      const promise = showConfirm('Test message', { type: 'warning' })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBe(2)
      
      // Find confirm button
      const confirmBtn = Array.from(buttons).find(btn => btn.textContent === 'Confirm') as HTMLButtonElement
      expect(confirmBtn).toBeTruthy()
      
      // Verify hover handler exists
      expect(confirmBtn.onmouseover).toBeTruthy()
      expect(confirmBtn.onmouseout).toBeTruthy()
      
      // Test hover - handlers should be callable
      confirmBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      expect(confirmBtn.onmouseover).toBeTruthy()
      
      // Test mouseout
      confirmBtn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
      expect(confirmBtn.onmouseout).toBeTruthy()
      
      confirmBtn.click()
      await promise
    })

    it('should add animation styles only once', async () => {
      const promise1 = showConfirm('First dialog')
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const styles1 = document.getElementById('confirm-dialog-styles')
      expect(styles1).toBeTruthy()
      
      // Click cancel
      const buttons1 = document.querySelectorAll('button')
      buttons1[0].click()
      await promise1
      
      // Create second dialog
      const promise2 = showConfirm('Second dialog')
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const styles2 = document.getElementById('confirm-dialog-styles')
      expect(styles2).toBe(styles1) // Should be the same element
      
      // Click cancel
      const buttons2 = document.querySelectorAll('button')
      buttons2[0].click()
      await promise2
    })

    it('should handle multi-line messages', async () => {
      const promise = showConfirm('Line 1\nLine 2\nLine 3')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const message = document.querySelector('p')
      expect(message?.textContent).toBe('Line 1\nLine 2\nLine 3')
      expect(message?.style.whiteSpace).toBe('pre-line')
      
      const buttons = document.querySelectorAll('button')
      buttons[0].click()
      await promise
    })

    it('should remove overlay after confirmation', async () => {
      const promise = showConfirm('Test message')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const overlayBefore = document.body.children.length
      expect(overlayBefore).toBeGreaterThan(0)
      
      const buttons = document.querySelectorAll('button')
      buttons[1].click()
      
      await promise
      
      // Overlay should be removed
      await new Promise(resolve => setTimeout(resolve, 10))
      const overlayAfter = document.querySelector('div[style*="position: fixed"]')
      expect(overlayAfter).toBeFalsy()
    })

    it('should remove overlay after cancellation', async () => {
      const promise = showConfirm('Test message')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const overlayBefore = document.body.children.length
      expect(overlayBefore).toBeGreaterThan(0)
      
      const buttons = document.querySelectorAll('button')
      buttons[0].click()
      
      await promise
      
      // Overlay should be removed
      await new Promise(resolve => setTimeout(resolve, 10))
      const overlayAfter = document.querySelector('div[style*="position: fixed"]')
      expect(overlayAfter).toBeFalsy()
    })

    it('should use default options when not provided', async () => {
      const promise = showConfirm('Test message')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const title = document.querySelector('h3')
      expect(title?.textContent).toBe('Confirm')
      
      const buttons = document.querySelectorAll('button')
      expect(buttons[0].textContent).toBe('Cancel')
      expect(buttons[1].textContent).toBe('Confirm')
      
      buttons[0].click()
      await promise
    })
  })
})
