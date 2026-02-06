/**
 * Marketplace Publishing Hook
 * Manages workflow publishing to the marketplace
 */

import { useState, useCallback } from 'react'
import { showError as defaultShowError, showSuccess as defaultShowSuccess } from '../../utils/notifications'
import { usePublishForm } from '../forms'
import type { HttpClient } from '../../types/adapters'
import { logicalOrToNull } from '../utils/logicalOr'

interface UseMarketplacePublishingOptions {
  activeTab: { id: string; workflowId: string | null; name: string } | undefined
  token: string | null
  httpClient: HttpClient
  apiBaseUrl: string
  // Dependency injection
  showError?: typeof defaultShowError
  showSuccess?: typeof defaultShowSuccess
}

/**
 * Hook for managing marketplace publishing
 * 
 * @param options Configuration options
 * @returns Publishing state and handlers
 */
export function useMarketplacePublishing({
  activeTab,
  token,
  httpClient,
  apiBaseUrl,
  showError = defaultShowError,
  showSuccess = defaultShowSuccess,
}: UseMarketplacePublishingOptions) {
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const publishFormHook = usePublishForm()

  const openPublishModal = useCallback(() => {
    // Explicit null/undefined check to prevent mutation survivors
    if (activeTab === null || activeTab === undefined) {
      showError('Select a workflow tab before publishing.')
      return
    }
    publishFormHook.updateForm({
      name: activeTab.name,
      description: '',
      category: 'automation',
      tags: '',
      difficulty: 'beginner',
      estimated_time: ''
    })
    setShowPublishModal(true)
  }, [activeTab, publishFormHook])

  const closePublishModal = useCallback(() => {
    setShowPublishModal(false)
  }, [])

  const handlePublishFormChange = useCallback((field: keyof typeof publishFormHook.form, value: string) => {
    publishFormHook.updateField(field, value)
  }, [publishFormHook])

  const handlePublish = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    // Explicit checks to prevent mutation survivors
    if (activeTab === null || activeTab === undefined || activeTab.workflowId === null || activeTab.workflowId === undefined || activeTab.workflowId === '') {
      showError('Save the workflow before publishing to the marketplace.')
      return
    }

    setIsPublishing(true)
    try {
      const tagsArray = publishFormHook.form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      // Explicit check to prevent mutation survivors
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token !== null && token !== undefined && token !== '' ? { Authorization: `Bearer ${token}` } : {})
      }
      const response = await httpClient.post(
        `${apiBaseUrl}/workflows/${activeTab.workflowId}/publish`,
        {
          category: publishFormHook.form.category,
          tags: tagsArray,
          difficulty: publishFormHook.form.difficulty,
          estimated_time: logicalOrToNull(publishFormHook.form.estimated_time) || undefined
        },
        headers
      )

      if (response.ok) {
        const published = await response.json()
        showSuccess(`Published "${published.name}" to the marketplace.`)
        setShowPublishModal(false)
      } else {
        const errorText = await response.text()
        showError(`Failed to publish: ${errorText}`)
      }
    } catch (error: any) {
      // Explicit error message extraction to prevent mutation survivors
      const errorMsg = (error !== null && error !== undefined && error.message !== null && error.message !== undefined) ? error.message : 'Unknown error'
      showError('Failed to publish workflow: ' + errorMsg)
    } finally {
      setIsPublishing(false)
    }
  }, [activeTab, token, httpClient, apiBaseUrl, publishFormHook])

  return {
    showPublishModal,
    isPublishing,
    publishForm: publishFormHook.form,
    openPublishModal,
    closePublishModal,
    handlePublishFormChange,
    handlePublish,
  }
}
