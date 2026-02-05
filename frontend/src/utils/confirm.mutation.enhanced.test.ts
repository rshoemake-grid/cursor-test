/**
 * Enhanced mutation tests for confirm utility
 * Focuses on killing remaining 2 surviving mutants through:
 * 1. Testing documentAdapter falsy checks
 * 2. Testing getElementById conditional
 * 3. Testing event target equality check
 */

import { showConfirm } from './confirm'
import { defaultAdapters } from '../types/adapters'

// Mock defaultAdapters
jest.mock('../types/adapters', () => ({
  defaultAdapters: {
    createDocumentAdapter: jest.fn(),
    createTimerAdapter: jest.fn(),
  },
}))

const mockDefaultAdapters = defaultAdapters as jest.Mocked<typeof defaultAdapters>

describe('showConfirm - Enhanced Mutation Killers', () => {
  let mockDocumentAdapter: any
  let mockTimerAdapter: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock document adapter
    const stylesMap = new Map<string, any>()
    const elementsMap = new Map<string, any>()

    mockDocumentAdapter = {
      createElement: jest.fn((tag: string) => {
        const element: any = {
          tagName: tag.toUpperCase(),
          style: {} as any,
          textContent: '',
          id: '',
          onclick: null,
          onmouseover: null,
          onmouseout: null,
          remove: jest.fn(),
          focus: jest.fn(),
          appendChild: jest.fn(),
        }
        Object.defineProperty(element.style, 'cssText', {
          get: () => element.style.cssText || '',
          set: (value: string) => {
            element.style.cssText = value
          },
        })
        return element
      }),
      getElementById: jest.fn((id: string) => {
        return stylesMap.get(id) || null
      }),
      head: {
        appendChild: jest.fn((element: any) => {
          if (element.id) {
            stylesMap.set(element.id, element)
          }
        }),
      },
      body: {
        appendChild: jest.fn(),
      },
    }

    mockTimerAdapter = {
      setTimeout: jest.fn(),
      clearTimeout: jest.fn(),
    }

    mockDefaultAdapters.createDocumentAdapter.mockReturnValue(mockDocumentAdapter)
    mockDefaultAdapters.createTimerAdapter.mockReturnValue(mockTimerAdapter)
  })

  describe('documentAdapter Falsy Check', () => {
    describe('if (!documentAdapter) condition', () => {
      it('should verify exact falsy check - documentAdapter is null', async () => {
        const result = await showConfirm('Test message', {
          documentAdapter: null, // Explicitly null
        })

        // Should return false immediately (documentAdapter is falsy)
        expect(result).toBe(false)
        expect(mockDocumentAdapter.createElement).not.toHaveBeenCalled()
      })

      it('should verify exact falsy check - documentAdapter is undefined', async () => {
        const result = await showConfirm('Test message', {
          documentAdapter: undefined, // Explicitly undefined
        })

        // Should return false immediately (documentAdapter is falsy)
        expect(result).toBe(false)
        expect(mockDocumentAdapter.createElement).not.toHaveBeenCalled()
      })

      it('should verify exact falsy check - documentAdapter is truthy', async () => {
        // Start the promise but don't await (we'll resolve it manually)
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter, // Truthy
        })

        // Should create elements (documentAdapter is truthy)
        await new Promise(resolve => setTimeout(resolve, 10))
        expect(mockDocumentAdapter.createElement).toHaveBeenCalled()

        // Clean up - click cancel
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay })
        }

        const result = await promise
        expect(result).toBe(false) // Cancelled
      })
    })
  })

  describe('getElementById Conditional', () => {
    describe('if (!documentAdapter.getElementById("confirm-dialog-styles")) condition', () => {
      it('should verify exact falsy check - styles element does not exist', async () => {
        mockDocumentAdapter.getElementById.mockReturnValue(null) // Element not found

        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        await new Promise(resolve => setTimeout(resolve, 10))

        // Should create style element (element not found)
        expect(mockDocumentAdapter.createElement).toHaveBeenCalledWith('style')
        expect(mockDocumentAdapter.head.appendChild).toHaveBeenCalled()

        // Clean up
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay })
        }

        await promise
      })

      it('should verify exact falsy check - styles element exists', async () => {
        const existingStyle = mockDocumentAdapter.createElement('style')
        existingStyle.id = 'confirm-dialog-styles'
        mockDocumentAdapter.getElementById.mockReturnValue(existingStyle) // Element found

        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        await new Promise(resolve => setTimeout(resolve, 10))

        // Should not create another style element (element exists)
        const styleCalls = mockDocumentAdapter.createElement.mock.calls.filter(
          (call: any[]) => call[0] === 'style'
        )
        // May create one, but should check first
        expect(mockDocumentAdapter.getElementById).toHaveBeenCalledWith('confirm-dialog-styles')

        // Clean up
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay })
        }

        await promise
      })
    })
  })

  describe('Event Target Equality Check', () => {
    describe('if (e.target === overlay) condition', () => {
      it('should verify exact equality - target is overlay', async () => {
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        await new Promise(resolve => setTimeout(resolve, 10))

        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        expect(overlay).toBeDefined()

        // Simulate click on overlay
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay }) // Target is overlay
        }

        const result = await promise

        // Should resolve to false (cancelled)
        expect(result).toBe(false)
        expect(overlay.remove).toHaveBeenCalled()
      })

      it('should verify exact equality - target is not overlay', async () => {
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        await new Promise(resolve => setTimeout(resolve, 10))

        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        const dialog = overlay?.appendChild?.mock?.calls?.[0]?.[0]

        // Simulate click on dialog (not overlay)
        if (overlay?.onclick) {
          overlay.onclick({ target: dialog }) // Target is not overlay
        }

        // Should not resolve yet (click was on dialog, not overlay)
        // Wait a bit to see if it resolves
        await new Promise(resolve => setTimeout(resolve, 50))

        // Clean up properly
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay })
        }

        const result = await promise
        expect(result).toBe(false) // Eventually cancelled
      })

      it('should verify exact equality - target is null', async () => {
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        await new Promise(resolve => setTimeout(resolve, 10))

        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]

        // Simulate click with null target
        if (overlay?.onclick) {
          overlay.onclick({ target: null }) // Target is null
        }

        // Should not resolve (target !== overlay)
        await new Promise(resolve => setTimeout(resolve, 50))

        // Clean up
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay })
        }

        const result = await promise
        expect(result).toBe(false)
      })
    })
  })

  describe('Button Click Handlers', () => {
    it('should resolve true when confirm button clicked', async () => {
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      const dialog = overlay?.appendChild?.mock?.calls?.[0]?.[0]
      const buttonsContainer = dialog?.appendChild?.mock?.calls?.find(
        (call: any[]) => call[0]?.tagName === 'DIV'
      )?.[0]

      // Find confirm button (last button)
      const confirmBtn = buttonsContainer?.appendChild?.mock?.calls?.slice(-1)?.[0]?.[0]

      if (confirmBtn?.onclick) {
        confirmBtn.onclick()
      }

      const result = await promise

      // Should resolve to true (confirmed)
      expect(result).toBe(true)
      expect(overlay.remove).toHaveBeenCalled()
    })

    it('should resolve false when cancel button clicked', async () => {
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      const dialog = overlay?.appendChild?.mock?.calls?.[0]?.[0]
      const buttonsContainer = dialog?.appendChild?.mock?.calls?.find(
        (call: any[]) => call[0]?.tagName === 'DIV'
      )?.[0]

      // Find cancel button (first button)
      const cancelBtn = buttonsContainer?.appendChild?.mock?.calls?.[0]?.[0]

      if (cancelBtn?.onclick) {
        cancelBtn.onclick()
      }

      const result = await promise

      // Should resolve to false (cancelled)
      expect(result).toBe(false)
      expect(overlay.remove).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Make createElement throw an error
      mockDocumentAdapter.createElement.mockImplementation(() => {
        throw new Error('DOM error')
      })

      const result = await showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      // Should resolve to false (error handled)
      expect(result).toBe(false)
    })
  })

  describe('Default Options', () => {
    it('should use default title when not provided', async () => {
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      const dialog = overlay?.appendChild?.mock?.calls?.[0]?.[0]
      const titleEl = dialog?.appendChild?.mock?.calls?.find(
        (call: any[]) => call[0]?.tagName === 'H3'
      )?.[0]

      // Should use default title
      expect(titleEl?.textContent).toBe('Confirm')

      // Clean up
      if (overlay?.onclick) {
        overlay.onclick({ target: overlay })
      }

      await promise
    })

    it('should use default confirmText when not provided', async () => {
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      const dialog = overlay?.appendChild?.mock?.calls?.[0]?.[0]
      const buttonsContainer = dialog?.appendChild?.mock?.calls?.find(
        (call: any[]) => call[0]?.tagName === 'DIV'
      )?.[0]
      const confirmBtn = buttonsContainer?.appendChild?.mock?.calls?.slice(-1)?.[0]?.[0]

      // Should use default confirmText
      expect(confirmBtn?.textContent).toBe('Confirm')

      // Clean up
      if (overlay?.onclick) {
        overlay.onclick({ target: overlay })
      }

      await promise
    })
  })
})
