import { renderHook, act } from '@testing-library/react'
import { useFormField, useSimpleFormField } from './useFormField'

describe('useFormField', () => {
  describe('basic usage', () => {
    it('should initialize with initial value', () => {
      const onUpdate = jest.fn()
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'initial',
          onUpdate,
        })
      )

      expect(result.current.value).toBe('initial')
    })

    it('should update value and call onUpdate', () => {
      const onUpdate = jest.fn()
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'initial',
          onUpdate,
        })
      )

      act(() => {
        result.current.setValue('new value')
      })

      expect(result.current.value).toBe('new value')
      expect(onUpdate).toHaveBeenCalledWith('new value')
    })

    it('should support functional updates', () => {
      const onUpdate = jest.fn()
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 10,
          onUpdate,
        })
      )

      act(() => {
        result.current.setValue((prev) => prev + 5)
      })

      expect(result.current.value).toBe(15)
      expect(onUpdate).toHaveBeenCalledWith(15)
    })
  })

  describe('node data synchronization', () => {
    it('should sync with nodeData when dataPath is provided', () => {
      const nodeData = {
        agent_config: {
          model: 'gpt-4',
        },
      }
      const onUpdate = jest.fn()

      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData,
          dataPath: 'agent_config.model',
        })
      )

      expect(result.current.value).toBe('gpt-4')
    })

    it('should use initialValue when nodeData value is undefined', () => {
      const nodeData = {
        agent_config: {},
      }
      const onUpdate = jest.fn()

      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData,
          dataPath: 'agent_config.model',
        })
      )

      expect(result.current.value).toBe('default')
    })

    it('should sync when nodeData changes', () => {
      const onUpdate = jest.fn()
      const { result, rerender } = renderHook(
        ({ nodeData }) =>
          useFormField({
            initialValue: 'default',
            onUpdate,
            nodeData,
            dataPath: 'agent_config.model',
          }),
        {
          initialProps: {
            nodeData: { agent_config: { model: 'gpt-4' } },
          },
        }
      )

      expect(result.current.value).toBe('gpt-4')

      rerender({
        nodeData: { agent_config: { model: 'gpt-3.5' } },
      })

      expect(result.current.value).toBe('gpt-3.5')
    })

    it('should not sync when input is focused', () => {
      const onUpdate = jest.fn()
      const input = document.createElement('input')
      document.body.appendChild(input)

      const { result, rerender } = renderHook(
        ({ nodeData }) =>
          useFormField({
            initialValue: 'initial',
            onUpdate,
            nodeData,
            dataPath: 'value',
          }),
        {
          initialProps: {
            nodeData: { value: 'new' },
          },
        }
      )

      // Simulate input being focused
      act(() => {
        input.focus()
        // @ts-ignore - accessing private ref for testing
        result.current.inputRef.current = input
      })

      // Update nodeData
      rerender({
        nodeData: { value: 'updated' },
      })

      // Value should not change because input is focused
      expect(result.current.value).toBe('new')

      // Cleanup
      document.body.removeChild(input)
    })

    it('should support array path', () => {
      const nodeData = {
        agent_config: {
          model: 'gpt-4',
        },
      }
      const onUpdate = jest.fn()

      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData,
          dataPath: ['agent_config', 'model'],
        })
      )

      expect(result.current.value).toBe('gpt-4')
    })
  })

  describe('useSimpleFormField', () => {
    it('should work without node data sync', () => {
      const onUpdate = jest.fn()
      const { result } = renderHook(() =>
        useSimpleFormField('initial', onUpdate)
      )

      expect(result.current.value).toBe('initial')

      act(() => {
        result.current.setValue('new')
      })

      expect(result.current.value).toBe('new')
      expect(onUpdate).toHaveBeenCalledWith('new')
    })
  })
})
