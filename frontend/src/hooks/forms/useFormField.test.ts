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

  describe('edge cases', () => {
    it('should handle getNestedValue with null object', () => {
      const onUpdate = jest.fn()
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData: null,
          dataPath: 'path',
        })
      )

      expect(result.current.value).toBe('default')
    })

    it('should handle getNestedValue with undefined object', () => {
      const onUpdate = jest.fn()
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData: undefined,
          dataPath: 'path',
        })
      )

      expect(result.current.value).toBe('default')
    })

    it('should handle getNestedValue with empty path', () => {
      const onUpdate = jest.fn()
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData: { value: 'test' },
          dataPath: '',
        })
      )

      expect(result.current.value).toBe('default')
    })

    it('should handle getNestedValue with null in path', () => {
      const onUpdate = jest.fn()
      const nodeData = {
        config: null,
      }
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData,
          dataPath: 'config.value',
        })
      )

      expect(result.current.value).toBe('default')
    })

    it('should handle getNestedValue with undefined in path', () => {
      const onUpdate = jest.fn()
      const nodeData = {
        config: undefined,
      }
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData,
          dataPath: 'config.value',
        })
      )

      expect(result.current.value).toBe('default')
    })

    it('should not sync when syncWithNodeData is false', () => {
      const onUpdate = jest.fn()
      const { result, rerender } = renderHook(
        ({ nodeData }) =>
          useFormField({
            initialValue: 'initial',
            onUpdate,
            nodeData,
            dataPath: 'value',
            syncWithNodeData: false,
          }),
        {
          initialProps: {
            nodeData: { value: 'first' },
          },
        }
      )

      expect(result.current.value).toBe('initial')

      rerender({
        nodeData: { value: 'second' },
      })

      // Should not sync
      expect(result.current.value).toBe('initial')
    })

    it('should not sync when dataPath is not provided', () => {
      const onUpdate = jest.fn()
      const { result, rerender } = renderHook(
        ({ nodeData }) =>
          useFormField({
            initialValue: 'initial',
            onUpdate,
            nodeData,
          }),
        {
          initialProps: {
            nodeData: { value: 'first' },
          },
        }
      )

      expect(result.current.value).toBe('initial')

      rerender({
        nodeData: { value: 'second' },
      })

      // Should not sync
      expect(result.current.value).toBe('initial')
    })

    it('should not sync when nodeData is not provided', () => {
      const onUpdate = jest.fn()
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
            nodeData: undefined,
          },
        }
      )

      expect(result.current.value).toBe('initial')

      rerender({
        nodeData: { value: 'second' },
      })

      // Should sync now
      expect(result.current.value).toBe('second')
    })

    it('should handle sync when value is same (no update)', () => {
      const onUpdate = jest.fn()
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
            nodeData: { value: 'test' },
          },
        }
      )

      expect(result.current.value).toBe('test')

      // Update to same value
      rerender({
        nodeData: { value: 'test' },
      })

      // Value should remain the same
      expect(result.current.value).toBe('test')
    })

    it('should handle nested path with array index', () => {
      const onUpdate = jest.fn()
      const nodeData = {
        items: [
          { name: 'item1' },
          { name: 'item2' },
        ],
      }
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData,
          dataPath: ['items', '0', 'name'],
        })
      )

      expect(result.current.value).toBe('item1')
    })

    it('should handle path with null intermediate value', () => {
      const onUpdate = jest.fn()
      const nodeData = {
        level1: null,
      }
      const { result } = renderHook(() =>
        useFormField({
          initialValue: 'default',
          onUpdate,
          nodeData,
          dataPath: 'level1.level2.value',
        })
      )

      expect(result.current.value).toBe('default')
    })
  })
})
