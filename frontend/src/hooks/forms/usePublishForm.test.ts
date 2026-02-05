/**
 * Tests for usePublishForm hook
 */

import { renderHook, act } from '@testing-library/react'
import { usePublishForm } from './usePublishForm'
import type { PublishFormData } from './usePublishForm'

describe('usePublishForm', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePublishForm())

    expect(result.current.form).toEqual({
      name: '',
      description: '',
      category: 'automation',
      tags: '',
      difficulty: 'beginner',
      estimated_time: '',
    })
  })

  it('should initialize with provided initial data', () => {
    const initialData: Partial<PublishFormData> = {
      name: 'Test Workflow',
      description: 'Test description',
      category: 'content_creation',
    }

    const { result } = renderHook(() =>
      usePublishForm({ initialData })
    )

    expect(result.current.form.name).toBe('Test Workflow')
    expect(result.current.form.description).toBe('Test description')
    expect(result.current.form.category).toBe('content_creation')
    expect(result.current.form.difficulty).toBe('beginner') // Default
  })

  it('should update a single field', () => {
    const { result } = renderHook(() => usePublishForm())

    act(() => {
      result.current.updateField('name', 'New Name')
    })

    expect(result.current.form.name).toBe('New Name')
    expect(result.current.form.description).toBe('') // Unchanged
  })

  it('should update multiple fields', () => {
    const { result } = renderHook(() => usePublishForm())

    act(() => {
      result.current.updateForm({
        name: 'New Name',
        description: 'New Description',
        category: 'data_analysis',
      })
    })

    expect(result.current.form.name).toBe('New Name')
    expect(result.current.form.description).toBe('New Description')
    expect(result.current.form.category).toBe('data_analysis')
    expect(result.current.form.difficulty).toBe('beginner') // Unchanged
  })

  it('should reset to default values', () => {
    const { result } = renderHook(() => usePublishForm())

    // First update the form
    act(() => {
      result.current.updateForm({
        name: 'Test',
        description: 'Test desc',
        category: 'marketing',
        tags: 'tag1, tag2',
        difficulty: 'advanced',
        estimated_time: '30 min',
      })
    })

    expect(result.current.form.name).toBe('Test')

    // Then reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.form).toEqual({
      name: '',
      description: '',
      category: 'automation',
      tags: '',
      difficulty: 'beginner',
      estimated_time: '',
    })
  })

  it('should reset to initial data', () => {
    const initialData: Partial<PublishFormData> = {
      name: 'Initial Name',
      category: 'research',
    }

    const { result } = renderHook(() =>
      usePublishForm({ initialData })
    )

    // Update form
    act(() => {
      result.current.updateForm({
        name: 'Changed Name',
        category: 'education',
      })
    })

    expect(result.current.form.name).toBe('Changed Name')

    // Reset to initial
    act(() => {
      result.current.resetToInitial()
    })

    expect(result.current.form.name).toBe('Initial Name')
    expect(result.current.form.category).toBe('research')
    expect(result.current.form.difficulty).toBe('beginner') // Default
  })

  it('should call onReset callback when reset is called', () => {
    const onReset = jest.fn()
    const { result } = renderHook(() =>
      usePublishForm({ onReset })
    )

    act(() => {
      result.current.reset()
    })

    expect(onReset).toHaveBeenCalled()
  })

  it('should allow setting form directly', () => {
    const { result } = renderHook(() => usePublishForm())

    const newForm: PublishFormData = {
      name: 'Direct Set',
      description: 'Direct Description',
      category: 'customer_service',
      tags: 'tag1',
      difficulty: 'intermediate',
      estimated_time: '15 min',
    }

    act(() => {
      result.current.setForm(newForm)
    })

    expect(result.current.form).toEqual(newForm)
  })

  it('should handle all category types', () => {
    const { result } = renderHook(() => usePublishForm())

    const categories = [
      'content_creation',
      'data_analysis',
      'customer_service',
      'research',
      'automation',
      'education',
      'marketing',
      'other',
    ] as const

    categories.forEach((category) => {
      act(() => {
        result.current.updateField('category', category)
      })
      expect(result.current.form.category).toBe(category)
    })
  })

  it('should handle all difficulty types', () => {
    const { result } = renderHook(() => usePublishForm())

    const difficulties = ['beginner', 'intermediate', 'advanced'] as const

    difficulties.forEach((difficulty) => {
      act(() => {
        result.current.updateField('difficulty', difficulty)
      })
      expect(result.current.form.difficulty).toBe(difficulty)
    })
  })
})
