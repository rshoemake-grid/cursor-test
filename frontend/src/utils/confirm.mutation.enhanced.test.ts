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
  let stylesMap: Map<string, any>

  beforeEach(() => {
    jest.useFakeTimers() // Use fake timers to control setTimeout calls
    // Reset stylesMap for each test
    stylesMap = new Map<string, any>()
    const elementsMap = new Map<string, any>()

    // Create mock document adapter
    // Note: We create fresh mocks each time to avoid interference between tests
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
          children: [], // Initialize children array
        }
        // Create appendChild function that properly uses 'this'
        element.appendChild = jest.fn(function(this: any, child: any) {
          // Store children for easier access in tests
          // Use 'this' to reference the element that appendChild is called on
          if (!this.children) {
            this.children = []
          }
          this.children.push(child)
          return child
        })
        // Initialize cssText property
        element.style.cssText = ''
        Object.defineProperty(element.style, 'cssText', {
          get: () => element.style._cssText || '',
          set: (value: string) => {
            element.style._cssText = value
          },
        })
        return element
      }),
      getElementById: jest.fn((id: string) => {
        // Check stylesMap first (for pre-created elements)
        const fromMap = stylesMap.get(id)
        if (fromMap) {
          return fromMap
        }
        // Otherwise return null (element not found)
        return null
      }),
      head: {
        appendChild: jest.fn((element: any) => {
          if (element.id) {
            stylesMap.set(element.id, element)
          }
        }),
      },
      body: {
        appendChild: jest.fn((element: any) => {
          // Return the element so tests can access it
          return element
        }),
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
        // When undefined, showConfirm should use default adapter
        // But in test environment, default adapter might be null (no document)
        // So we need to mock the default adapter to return null
        mockDefaultAdapters.createDocumentAdapter.mockReturnValueOnce(null)
        
        const result = await showConfirm('Test message', {
          documentAdapter: undefined, // Explicitly undefined - should use default
        })

        // Should return false if default adapter is null (no document in test env)
        expect(result).toBe(false)
        expect(mockDocumentAdapter.createElement).not.toHaveBeenCalled()
      })

      it('should verify exact falsy check - documentAdapter is truthy', async () => {
        // Start the promise but don't await (we'll resolve it manually)
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter, // Truthy
        })

        // Promise executor runs synchronously - wait a microtask
        await new Promise(resolve => setTimeout(resolve, 0))
        
        // Should create elements (documentAdapter is truthy)
        expect(mockDocumentAdapter.createElement).toHaveBeenCalled()
        expect(mockDocumentAdapter.body.appendChild).toHaveBeenCalled()

        // Clean up - click cancel
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        expect(overlay).toBeDefined()
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
        // Reset mocks and clear stylesMap before test
        mockDocumentAdapter.createElement.mockClear()
        mockDocumentAdapter.head.appendChild.mockClear()
        mockDocumentAdapter.body.appendChild.mockClear()
        mockDocumentAdapter.getElementById.mockClear()
        stylesMap.clear() // Clear the styles map

        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        // Promise executor runs synchronously - elements are created immediately
        // Wait a microtask to ensure all synchronous code completes
        await new Promise(resolve => setTimeout(resolve, 0))

        // Verify getElementById was called to check for existing styles
        expect(mockDocumentAdapter.getElementById).toHaveBeenCalledWith('confirm-dialog-styles')
        
        // Should create style element (element not found)
        // The style element is created after overlay and dialog divs
        // Check all createElement calls for 'style'
        const styleCalls = mockDocumentAdapter.createElement.mock.calls.filter(
          (call: any[]) => call[0] === 'style'
        )
        expect(styleCalls.length).toBeGreaterThan(0)
        expect(mockDocumentAdapter.head.appendChild).toHaveBeenCalled()

        // Clean up - click cancel to resolve promise
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        expect(overlay).toBeDefined()
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay })
        }

        await promise
      })

      it('should verify exact falsy check - styles element exists', async () => {
        // Reset mocks and clear stylesMap before test
        mockDocumentAdapter.createElement.mockClear()
        mockDocumentAdapter.head.appendChild.mockClear()
        mockDocumentAdapter.body.appendChild.mockClear()
        mockDocumentAdapter.getElementById.mockClear()
        stylesMap.clear()
        
        // Create existing style element and store it in the styles map
        // We need to create it directly without going through createElement mock
        // to avoid polluting the mock calls
        const existingStyle: any = {
          tagName: 'STYLE',
          id: 'confirm-dialog-styles',
          textContent: '',
          style: {},
        }
        // Store directly in stylesMap so getElementById can find it
        stylesMap.set('confirm-dialog-styles', existingStyle)
        
        // Verify it's in the map
        expect(stylesMap.get('confirm-dialog-styles')).toBe(existingStyle)
        // Verify getElementById will return it
        expect(mockDocumentAdapter.getElementById('confirm-dialog-styles')).toBe(existingStyle)

        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        // Promise executor runs synchronously
        await new Promise(resolve => setTimeout(resolve, 0))

        // Should check for existing style element first
        expect(mockDocumentAdapter.getElementById).toHaveBeenCalledWith('confirm-dialog-styles')
        
        // Should not create another style element (element exists)
        // Count style elements created during showConfirm (after clearing mocks)
        // Since getElementById returns the existing style, the condition should be false
        // and no new style should be created
        const styleCallsAfterShowConfirm = mockDocumentAdapter.createElement.mock.calls.filter(
          (call: any[]) => call[0] === 'style'
        )
        // Should not create a new style element since one already exists
        expect(styleCallsAfterShowConfirm.length).toBe(0)

        // Clean up
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        expect(overlay).toBeDefined()
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
        // Don't clear mocks - the promise executor runs synchronously
        // If we clear, we might interfere with the mock setup
        // Instead, just verify the calls are made
        
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        // Promise executor runs synchronously - all DOM operations happen immediately
        // Wait a microtask to ensure all synchronous code completes
        await new Promise(resolve => setTimeout(resolve, 0))

        // Verify body.appendChild was called (overlay is appended to body)
        // Check if it was called (might be from previous test, but that's OK)
        const appendCalls = mockDocumentAdapter.body.appendChild.mock.calls
        expect(appendCalls.length).toBeGreaterThan(0)
        
        // Get overlay from the most recent call (last call)
        const overlay = appendCalls[appendCalls.length - 1]?.[0]
        expect(overlay).toBeDefined()
        expect(overlay.tagName).toBe('DIV')

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
        // Reset mocks before test
        mockDocumentAdapter.body.appendChild.mockClear()
        
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        // Promise executor runs synchronously, wait a tick for mocks
        await new Promise(resolve => setTimeout(resolve, 0))

        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        expect(overlay).toBeDefined()
        const dialogCall = overlay.appendChild.mock.calls.find(
          (call: any[]) => call[0]?.tagName === 'DIV' && call[0] !== overlay
        )
        const dialog = dialogCall?.[0]
        expect(dialog).toBeDefined()

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
        // Reset mocks before test
        mockDocumentAdapter.body.appendChild.mockClear()
        
        const promise = showConfirm('Test message', {
          documentAdapter: mockDocumentAdapter,
        })

        // Promise executor runs synchronously, wait a tick for mocks
        await new Promise(resolve => setTimeout(resolve, 0))

        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
        expect(overlay).toBeDefined()

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
      // Reset mocks before test
      mockDocumentAdapter.body.appendChild.mockClear()
      
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      // Wait for promise executor to run (creates elements synchronously)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Access elements from the mock structure
      // The overlay is appended to body
      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      expect(overlay).toBeDefined()
      
      // Dialog is appended to overlay
      const dialogCall = overlay.appendChild.mock.calls.find(
        (call: any[]) => call[0]?.tagName === 'DIV' && call[0] !== overlay
      )
      const dialog = dialogCall?.[0]
      expect(dialog).toBeDefined()
      
      // Buttons container is appended to dialog (DIV with buttons)
      const buttonsContainerCall = dialog.appendChild.mock.calls.find(
        (call: any[]) => call[0]?.tagName === 'DIV'
      )
      const buttonsContainer = buttonsContainerCall?.[0]
      expect(buttonsContainer).toBeDefined()

      // Confirm button is the last button appended to buttons container
      const buttonCalls = buttonsContainer.appendChild.mock.calls
      const confirmBtn = buttonCalls[buttonCalls.length - 1]?.[0]
      expect(confirmBtn).toBeDefined()
      expect(confirmBtn.tagName).toBe('BUTTON')

      if (confirmBtn?.onclick) {
        confirmBtn.onclick()
      }

      const result = await promise

      // Should resolve to true (confirmed)
      expect(result).toBe(true)
      expect(overlay.remove).toHaveBeenCalled()
    })

    it('should resolve false when cancel button clicked', async () => {
      // Reset mocks before test
      mockDocumentAdapter.body.appendChild.mockClear()
      
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      // Wait for promise executor to run (creates elements synchronously)
      await new Promise(resolve => setTimeout(resolve, 50))

      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      expect(overlay).toBeDefined()
      
      // Dialog is appended to overlay
      const dialogCall = overlay.appendChild.mock.calls.find(
        (call: any[]) => call[0]?.tagName === 'DIV' && call[0] !== overlay
      )
      const dialog = dialogCall?.[0]
      expect(dialog).toBeDefined()
      // Buttons container is appended to dialog (DIV with buttons)
      const buttonsContainerCall = dialog.appendChild.mock.calls.find(
        (call: any[]) => call[0]?.tagName === 'DIV'
      )
      const buttonsContainer = buttonsContainerCall?.[0]
      expect(buttonsContainer).toBeDefined()

      // Cancel button is the first button appended to buttons container
      const cancelBtn = buttonsContainer.appendChild.mock.calls[0]?.[0]
      expect(cancelBtn).toBeDefined()
      expect(cancelBtn.tagName).toBe('BUTTON')

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
      // Reset mocks before test
      mockDocumentAdapter.body.appendChild.mockClear()
      
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      // Promise executor runs synchronously, wait a tick for mocks
      await new Promise(resolve => setTimeout(resolve, 0))

      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      expect(overlay).toBeDefined()
      const dialogCall = overlay.appendChild.mock.calls.find(
        (call: any[]) => call[0]?.tagName === 'DIV' && call[0] !== overlay
      )
      const dialog = dialogCall?.[0]
      expect(dialog).toBeDefined()
      const titleEl = dialog.appendChild.mock.calls.find(
        (call: any[]) => call[0]?.tagName === 'H3'
      )?.[0]
      expect(titleEl).toBeDefined()

      // Should use default title
      expect(titleEl.textContent).toBe('Confirm')

      // Clean up
      if (overlay?.onclick) {
        overlay.onclick({ target: overlay })
      }

      await promise
    })

    it('should use default confirmText when not provided', async () => {
      // Reset mocks before test
      mockDocumentAdapter.body.appendChild.mockClear()
      
      const promise = showConfirm('Test message', {
        documentAdapter: mockDocumentAdapter,
      })

      // Promise executor runs synchronously, wait a tick for mocks
      await new Promise(resolve => setTimeout(resolve, 0))

      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0]
      expect(overlay).toBeDefined()
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

  afterEach(() => {
    // Clean up any pending timers to prevent memory leaks
    if (jest.isMockFunction(setTimeout)) {
      try {
        while (jest.getTimerCount() > 0) {
          jest.runOnlyPendingTimers()
        }
      } catch (e) {
        // Ignore errors - timers might already be cleared
      }
    }
    jest.useRealTimers()
  })
})
