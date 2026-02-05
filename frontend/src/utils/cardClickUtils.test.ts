import { shouldIgnoreClick, createCardClickHandler } from './cardClickUtils'
import React from 'react'

describe('cardClickUtils', () => {
  describe('shouldIgnoreClick', () => {
    it('should return true for checkbox input', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      
      expect(shouldIgnoreClick(checkbox)).toBe(true)
    })

    it('should return true for element containing checkbox', () => {
      const parent = document.createElement('div')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      parent.appendChild(checkbox)
      
      // Mock closest to simulate finding checkbox
      const closestSpy = jest.spyOn(parent, 'closest')
      closestSpy.mockReturnValue(checkbox as any)
      expect(shouldIgnoreClick(parent)).toBe(true)
      closestSpy.mockRestore()
    })

    it('should return true for button element', () => {
      const button = document.createElement('button')
      expect(shouldIgnoreClick(button)).toBe(true)
    })

    it('should return true for element inside button', () => {
      const button = document.createElement('button')
      const span = document.createElement('span')
      button.appendChild(span)
      
      // Mock closest to simulate finding button
      const closestSpy = jest.spyOn(span, 'closest').mockReturnValue(button as any)
      expect(shouldIgnoreClick(span)).toBe(true)
      closestSpy.mockRestore()
    })

    it('should return true for input element', () => {
      const input = document.createElement('input')
      expect(shouldIgnoreClick(input)).toBe(true)
    })

    it('should return true for select element', () => {
      const select = document.createElement('select')
      expect(shouldIgnoreClick(select)).toBe(true)
    })

    it('should return true for anchor element', () => {
      const anchor = document.createElement('a')
      expect(shouldIgnoreClick(anchor)).toBe(true)
    })

    it('should return false for regular div', () => {
      const div = document.createElement('div')
      expect(shouldIgnoreClick(div)).toBe(false)
    })

    it('should return false for span element', () => {
      const span = document.createElement('span')
      expect(shouldIgnoreClick(span)).toBe(false)
    })

    it('should return false for paragraph element', () => {
      const p = document.createElement('p')
      expect(shouldIgnoreClick(p)).toBe(false)
    })
  })

  describe('createCardClickHandler', () => {
    it('should call toggle function when clicking non-interactive element', () => {
      const toggleFn = jest.fn()
      const handler = createCardClickHandler(toggleFn)
      
      const div = document.createElement('div')
      // Mock closest to return null (no interactive element found)
      jest.spyOn(div, 'closest').mockReturnValue(null)
      
      const event = {
        target: div,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      handler(event, 'item-1')

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(toggleFn).toHaveBeenCalledWith('item-1')
    })

    it('should not call toggle when clicking checkbox', () => {
      const toggleFn = jest.fn()
      const handler = createCardClickHandler(toggleFn)
      
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      // Mock closest to return the checkbox itself
      jest.spyOn(checkbox, 'closest').mockReturnValue(checkbox as any)
      
      const event = {
        target: checkbox,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      handler(event, 'item-1')

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(toggleFn).not.toHaveBeenCalled()
    })

    it('should not call toggle when clicking button', () => {
      const toggleFn = jest.fn()
      const handler = createCardClickHandler(toggleFn)
      
      const button = document.createElement('button')
      // Mock closest to return the button itself
      jest.spyOn(button, 'closest').mockReturnValue(button as any)
      
      const event = {
        target: button,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      handler(event, 'item-1')

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(toggleFn).not.toHaveBeenCalled()
    })

    it('should not call toggle when clicking element inside button', () => {
      const toggleFn = jest.fn()
      const handler = createCardClickHandler(toggleFn)
      
      const button = document.createElement('button')
      const span = document.createElement('span')
      button.appendChild(span)
      
      // Mock closest to simulate finding button
      const closestSpy = jest.spyOn(span, 'closest').mockReturnValue(button as any)
      
      const event = {
        target: span,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      handler(event, 'item-1')

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(toggleFn).not.toHaveBeenCalled()
      closestSpy.mockRestore()
    })

    it('should work with different ID types', () => {
      const toggleFn = jest.fn()
      const handler = createCardClickHandler(toggleFn)
      
      const div = document.createElement('div')
      // Mock closest to return null (no interactive element found)
      jest.spyOn(div, 'closest').mockReturnValue(null)
      
      const event = {
        target: div,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      handler(event, 'custom-id-123' as any)

      expect(toggleFn).toHaveBeenCalledWith('custom-id-123')
    })

    it('should handle multiple clicks correctly', () => {
      const toggleFn = jest.fn()
      const handler = createCardClickHandler(toggleFn)
      
      const div = document.createElement('div')
      // Mock closest to return null (no interactive element found)
      jest.spyOn(div, 'closest').mockReturnValue(null)
      
      const event1 = {
        target: div,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      const event2 = {
        target: div,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent

      handler(event1, 'item-1')
      handler(event2, 'item-2')

      expect(toggleFn).toHaveBeenCalledTimes(2)
      expect(toggleFn).toHaveBeenNthCalledWith(1, 'item-1')
      expect(toggleFn).toHaveBeenNthCalledWith(2, 'item-2')
    })
  })
})
