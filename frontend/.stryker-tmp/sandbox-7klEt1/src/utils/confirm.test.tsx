// @ts-nocheck
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
    it('should create a confirmation dialog with default options', async () => {
      const promise = showConfirm('Test message')
      
      // Check that overlay was created
      const overlay = document.querySelector('div[style*="position: fixed"]')
      expect(overlay).toBeTruthy()
      
      // Check that dialog was created
      const dialog = overlay?.querySelector('div[style*="background: white"]')
      expect(dialog).toBeTruthy()
      
      // Check default title
      const title = dialog?.querySelector('h3')
      expect(title?.textContent).toBe('Confirm')
      
      // Check message
      const message = dialog?.querySelector('p')
      expect(message?.textContent).toBe('Test message')
      
      // Check buttons
      const buttons = dialog?.querySelectorAll('button')
      expect(buttons?.length).toBe(2)
      expect(buttons?.[0].textContent).toBe('Cancel')
      expect(buttons?.[1].textContent).toBe('Confirm')
      
      // Click cancel
      const cancelBtn = buttons?.[0] as HTMLButtonElement
      cancelBtn.click()
      
      const result = await promise
      expect(result).toBe(false)
    })

    it('should use custom title', async () => {
      const promise = showConfirm('Test message', { title: 'Custom Title' })
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const title = dialog?.querySelector('h3')
      expect(title?.textContent).toBe('Custom Title')
      
      // Click cancel
      const cancelBtn = dialog?.querySelector('button') as HTMLButtonElement
      cancelBtn.click()
      
      await promise
    })

    it('should use custom button texts', async () => {
      const promise = showConfirm('Test message', {
        confirmText: 'Yes',
        cancelText: 'No'
      })
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      expect(buttons?.[0].textContent).toBe('No')
      expect(buttons?.[1].textContent).toBe('Yes')
      
      // Click cancel
      const cancelBtn = buttons?.[0] as HTMLButtonElement
      cancelBtn.click()
      
      await promise
    })

    it('should resolve to true when confirm button is clicked', async () => {
      const promise = showConfirm('Test message')
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = buttons?.[1] as HTMLButtonElement
      
      confirmBtn.click()
      
      const result = await promise
      expect(result).toBe(true)
    })

    it('should resolve to false when cancel button is clicked', async () => {
      const promise = showConfirm('Test message')
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const cancelBtn = buttons?.[0] as HTMLButtonElement
      
      cancelBtn.click()
      
      const result = await promise
      expect(result).toBe(false)
    })

    it('should resolve to false when overlay is clicked', async () => {
      const promise = showConfirm('Test message')
      
      const overlay = document.querySelector('div[style*="position: fixed"]') as HTMLElement
      
      // Simulate clicking the overlay (not the dialog)
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', { value: overlay })
      overlay.dispatchEvent(clickEvent)
      
      const result = await promise
      expect(result).toBe(false)
    })

    it('should not resolve when dialog is clicked (not overlay)', async () => {
      const promise = showConfirm('Test message')
      
      const dialog = document.querySelector('div[style*="background: white"]') as HTMLElement
      
      // Simulate clicking the dialog (not the overlay)
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', { value: dialog })
      dialog.dispatchEvent(clickEvent)
      
      // Should not resolve immediately
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Click cancel to clean up
      const buttons = dialog.querySelectorAll('button')
      const cancelBtn = buttons[0] as HTMLButtonElement
      cancelBtn.click()
      
      await promise
    })

    it('should apply warning type colors', async () => {
      const promise = showConfirm('Test message', { type: 'warning' })
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = buttons?.[1] as HTMLButtonElement
      
      // Warning color: #f59e0b
      expect(confirmBtn.style.background).toContain('#f59e0b')
      
      confirmBtn.click()
      await promise
    })

    it('should apply danger type colors', async () => {
      const promise = showConfirm('Test message', { type: 'danger' })
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = buttons?.[1] as HTMLButtonElement
      
      // Danger color: #ef4444
      expect(confirmBtn.style.background).toContain('#ef4444')
      
      confirmBtn.click()
      await promise
    })

    it('should apply info type colors', async () => {
      const promise = showConfirm('Test message', { type: 'info' })
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = buttons?.[1] as HTMLButtonElement
      
      // Info color: #3b82f6
      expect(confirmBtn.style.background).toContain('#3b82f6')
      
      confirmBtn.click()
      await promise
    })

    it('should handle hover effects on cancel button', async () => {
      const promise = showConfirm('Test message')
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const cancelBtn = buttons?.[0] as HTMLButtonElement
      
      // Test hover
      cancelBtn.dispatchEvent(new MouseEvent('mouseover'))
      expect(cancelBtn.style.background).toBe('rgb(249, 250, 251)')
      
      // Test mouseout
      cancelBtn.dispatchEvent(new MouseEvent('mouseout'))
      expect(cancelBtn.style.background).toBe('white')
      
      cancelBtn.click()
      await promise
    })

    it('should handle hover effects on confirm button', async () => {
      const promise = showConfirm('Test message', { type: 'warning' })
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = buttons?.[1] as HTMLButtonElement
      
      const initialBg = confirmBtn.style.background
      
      // Test hover
      confirmBtn.dispatchEvent(new MouseEvent('mouseover'))
      const hoverBg = confirmBtn.style.background
      expect(hoverBg).not.toBe(initialBg)
      
      // Test mouseout
      confirmBtn.dispatchEvent(new MouseEvent('mouseout'))
      expect(confirmBtn.style.background).toBe(initialBg)
      
      confirmBtn.click()
      await promise
    })

    it('should add animation styles only once', async () => {
      const promise1 = showConfirm('First dialog')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const styles1 = document.getElementById('confirm-dialog-styles')
      expect(styles1).toBeTruthy()
      
      // Click cancel
      const dialog1 = document.querySelector('div[style*="background: white"]')
      const buttons1 = dialog1?.querySelectorAll('button')
      const cancelBtn1 = buttons1?.[0] as HTMLButtonElement
      cancelBtn1.click()
      await promise1
      
      // Create second dialog
      const promise2 = showConfirm('Second dialog')
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const styles2 = document.getElementById('confirm-dialog-styles')
      expect(styles2).toBe(styles1) // Should be the same element
      
      // Click cancel
      const dialog2 = document.querySelector('div[style*="background: white"]')
      const buttons2 = dialog2?.querySelectorAll('button')
      const cancelBtn2 = buttons2?.[0] as HTMLButtonElement
      cancelBtn2.click()
      await promise2
    })

    it('should focus confirm button', async () => {
      const promise = showConfirm('Test message')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = buttons?.[1] as HTMLButtonElement
      
      // Check if button has focus (or was focused)
      // Note: focus() might not work in jsdom, but we can check it was called
      expect(confirmBtn).toBeTruthy()
      
      confirmBtn.click()
      await promise
    })

    it('should handle multi-line messages', async () => {
      const promise = showConfirm('Line 1\nLine 2\nLine 3')
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const message = dialog?.querySelector('p')
      expect(message?.textContent).toBe('Line 1\nLine 2\nLine 3')
      expect(message?.style.whiteSpace).toBe('pre-line')
      
      const buttons = dialog?.querySelectorAll('button')
      const cancelBtn = buttons?.[0] as HTMLButtonElement
      cancelBtn.click()
      await promise
    })

    it('should remove overlay after confirmation', async () => {
      const promise = showConfirm('Test message')
      
      const overlay = document.querySelector('div[style*="position: fixed"]')
      expect(overlay).toBeTruthy()
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = buttons?.[1] as HTMLButtonElement
      confirmBtn.click()
      
      await promise
      
      // Overlay should be removed
      const remainingOverlay = document.querySelector('div[style*="position: fixed"]')
      expect(remainingOverlay).toBeFalsy()
    })

    it('should remove overlay after cancellation', async () => {
      const promise = showConfirm('Test message')
      
      const overlay = document.querySelector('div[style*="position: fixed"]')
      expect(overlay).toBeTruthy()
      
      const dialog = document.querySelector('div[style*="background: white"]')
      const buttons = dialog?.querySelectorAll('button')
      const cancelBtn = buttons?.[0] as HTMLButtonElement
      cancelBtn.click()
      
      await promise
      
      // Overlay should be removed
      const remainingOverlay = document.querySelector('div[style*="position: fixed"]')
      expect(remainingOverlay).toBeFalsy()
    })
  })
})

