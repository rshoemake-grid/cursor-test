/**
 * Publish Form Hook
 * Centralized state management for workflow/agent publishing forms
 */

import { useState, useCallback } from 'react'
import type { TemplateCategory, TemplateDifficulty } from '../config/templateConstants'

export interface PublishFormData {
  name: string
  description: string
  category: TemplateCategory
  tags: string
  difficulty: TemplateDifficulty
  estimated_time: string
}

const DEFAULT_FORM_DATA: PublishFormData = {
  name: '',
  description: '',
  category: 'automation',
  tags: '',
  difficulty: 'beginner',
  estimated_time: '',
}

interface UsePublishFormOptions {
  initialData?: Partial<PublishFormData>
  onReset?: () => void
}

/**
 * Hook for managing publish form state
 * 
 * @param options Configuration options
 * @returns Form state and handlers
 */
export function usePublishForm({ initialData, onReset }: UsePublishFormOptions = {}) {
  const [form, setForm] = useState<PublishFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  })

  const updateField = useCallback(<K extends keyof PublishFormData>(
    field: K,
    value: PublishFormData[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateForm = useCallback((updates: Partial<PublishFormData>) => {
    setForm((prev) => ({
      ...prev,
      ...updates,
    }))
  }, [])

  const reset = useCallback(() => {
    setForm(DEFAULT_FORM_DATA)
    if (onReset) {
      onReset()
    }
  }, [onReset])

  const resetToInitial = useCallback(() => {
    setForm({
      ...DEFAULT_FORM_DATA,
      ...initialData,
    })
  }, [initialData])

  return {
    form,
    setForm,
    updateField,
    updateForm,
    reset,
    resetToInitial,
  }
}
