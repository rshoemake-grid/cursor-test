/**
 * Tests for useMarketplacePublishing hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useMarketplacePublishing } from './useMarketplacePublishing'
import { showSuccess, showError } from '../../utils/notifications'
import { usePublishForm } from '../forms'

jest.mock('../../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../forms', () => ({
  usePublishForm: jest.fn(),
}))

const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockUsePublishForm = usePublishForm as jest.MockedFunction<typeof usePublishForm>

describe('useMarketplacePublishing', () => {
  let mockHttpClient: any
  let mockPublishForm: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockHttpClient = {
      post: jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Published Workflow' }),
      }),
    }

    mockPublishForm = {
      form: {
        name: '',
        description: '',
        category: 'automation',
        tags: '',
        difficulty: 'beginner',
        estimated_time: '',
      },
      updateForm: jest.fn(),
      updateField: jest.fn(),
    }

    mockUsePublishForm.mockReturnValue(mockPublishForm)
  })

  describe('openPublishModal', () => {
    it('should show error when activeTab is undefined', () => {
      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab: undefined,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      act(() => {
        result.current.openPublishModal()
      })

      expect(mockShowError).toHaveBeenCalledWith('Select a workflow tab before publishing.')
      expect(result.current.showPublishModal).toBe(false)
    })

    it('should open modal and update form when activeTab exists', () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      act(() => {
        result.current.openPublishModal()
      })

      expect(mockPublishForm.updateForm).toHaveBeenCalledWith({
        name: 'Test Workflow',
        description: '',
        category: 'automation',
        tags: '',
        difficulty: 'beginner',
        estimated_time: '',
      })
      expect(result.current.showPublishModal).toBe(true)
    })
  })

  describe('closePublishModal', () => {
    it('should close the modal', () => {
      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab: { id: 'tab-1', workflowId: 'workflow-1', name: 'Test' },
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      act(() => {
        result.current.openPublishModal()
      })
      expect(result.current.showPublishModal).toBe(true)

      act(() => {
        result.current.closePublishModal()
      })
      expect(result.current.showPublishModal).toBe(false)
    })
  })

  describe('handlePublishFormChange', () => {
    it('should update form field', () => {
      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab: { id: 'tab-1', workflowId: 'workflow-1', name: 'Test' },
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      act(() => {
        result.current.handlePublishFormChange('name', 'New Name')
      })

      expect(mockPublishForm.updateField).toHaveBeenCalledWith('name', 'New Name')
    })
  })

  describe('handlePublish', () => {
    it('should show error when activeTab is undefined', async () => {
      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab: undefined,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockShowError).toHaveBeenCalledWith('Save the workflow before publishing to the marketplace.')
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('should show error when workflowId is null', async () => {
      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab: { id: 'tab-1', workflowId: null, name: 'Test' },
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockShowError).toHaveBeenCalledWith('Save the workflow before publishing to the marketplace.')
    })

    it('should publish successfully', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      mockPublishForm.form.tags = 'tag1, tag2'
      mockPublishForm.form.category = 'automation'
      mockPublishForm.form.difficulty = 'intermediate'
      mockPublishForm.form.estimated_time = '10 min'

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://api.test/workflows/workflow-1/publish',
        {
          category: 'automation',
          tags: ['tag1', 'tag2'],
          difficulty: 'intermediate',
          estimated_time: '10 min',
        },
        expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        })
      )

      expect(mockShowSuccess).toHaveBeenCalledWith('Published "Published Workflow" to the marketplace.')
      expect(result.current.showPublishModal).toBe(false)
      expect(result.current.isPublishing).toBe(false)
    })

    it('should handle tags.split and filter', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      mockPublishForm.form.tags = 'tag1, tag2, , tag3'

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'], // Empty tags filtered out
        }),
        expect.any(Object)
      )
    })

    it('should verify token ? Authorization : {} check - token exists', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          Authorization: 'Bearer test-token',
        })
      )
    })

    it('should verify token ? Authorization : {} check - token is null', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: null,
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.not.objectContaining({
          Authorization: expect.any(String),
        })
      )
    })

    it('should verify response.ok check - response.ok is true', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      mockHttpClient.post.mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Published Workflow' }),
      })

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockShowSuccess).toHaveBeenCalled()
      expect(result.current.showPublishModal).toBe(false)
    })

    it('should verify response.ok check - response.ok is false', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      mockHttpClient.post.mockResolvedValue({
        ok: false,
        text: async () => 'Error message',
      })

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockShowError).toHaveBeenCalledWith('Failed to publish: Error message')
      expect(result.current.isPublishing).toBe(false)
    })

    it('should verify estimated_time || undefined check - estimated_time is empty', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      mockPublishForm.form.estimated_time = ''

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          estimated_time: undefined,
        }),
        expect.any(Object)
      )
    })

    it('should verify estimated_time || undefined check - estimated_time has value', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      mockPublishForm.form.estimated_time = '10 min'

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          estimated_time: '10 min',
        }),
        expect.any(Object)
      )
    })

    it('should verify error.message || Unknown error in catch', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const errorWithMessage = new Error('Network error')
      mockHttpClient.post.mockRejectedValue(errorWithMessage)

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockShowError).toHaveBeenCalledWith('Failed to publish workflow: Network error')
      expect(result.current.isPublishing).toBe(false)
    })

    it('should verify error.message || Unknown error - Unknown error fallback', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const errorWithoutMessage = {}
      mockHttpClient.post.mockRejectedValue(errorWithoutMessage)

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      expect(mockShowError).toHaveBeenCalledWith('Failed to publish workflow: Unknown error')
      expect(result.current.isPublishing).toBe(false)
    })

    it('should verify finally block sets isPublishing to false', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      mockHttpClient.post.mockRejectedValue(new Error('Error'))

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      // Finally block should set isPublishing to false
      expect(result.current.isPublishing).toBe(false)
    })

    it('should verify estimated_time || undefined uses exact undefined value', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      mockPublishForm.form.estimated_time = ''

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      const postCall = mockHttpClient.post.mock.calls[0]
      const payload = postCall[1]
      
      // Verify exact undefined value (not null or empty string)
      expect(payload.estimated_time).toBeUndefined()
      expect(payload.estimated_time).not.toBe(null)
      expect(payload.estimated_time).not.toBe('')
    })

    it('should verify error.message || Unknown error uses exact Unknown error string', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      const errorWithoutMessage: any = {}
      mockHttpClient.post.mockRejectedValue(errorWithoutMessage)

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      // Verify exact 'Unknown error' string (not mutated)
      expect(mockShowError).toHaveBeenCalledWith('Failed to publish workflow: Unknown error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to publish workflow: unknown error')
      expect(mockShowError).not.toHaveBeenCalledWith('Failed to publish workflow: ')
    })

    it('should verify !activeTab || !activeTab.workflowId checks both conditions', async () => {
      // Test: activeTab is null
      const { result: result1 } = renderHook(() =>
        useMarketplacePublishing({
          activeTab: undefined,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent1 = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result1.current.handlePublish(mockEvent1)
      })

      expect(mockShowError).toHaveBeenCalledWith('Save the workflow before publishing to the marketplace.')

      // Test: activeTab exists but workflowId is null
      const { result: result2 } = renderHook(() =>
        useMarketplacePublishing({
          activeTab: { id: 'tab-1', workflowId: null, name: 'Test' },
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent2 = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result2.current.handlePublish(mockEvent2)
      })

      expect(mockShowError).toHaveBeenCalledWith('Save the workflow before publishing to the marketplace.')
    })

    it('should verify tags.split().map().filter() chain processes correctly', async () => {
      const activeTab = {
        id: 'tab-1',
        workflowId: 'workflow-1',
        name: 'Test Workflow',
      }

      mockPublishForm.form.tags = '  tag1  , tag2,  , tag3  '

      const { result } = renderHook(() =>
        useMarketplacePublishing({
          activeTab,
          token: 'test-token',
          httpClient: mockHttpClient,
          apiBaseUrl: 'http://api.test',
        })
      )

      const mockEvent = { preventDefault: jest.fn() } as any

      await act(async () => {
        await result.current.handlePublish(mockEvent)
      })

      const postCall = mockHttpClient.post.mock.calls[0]
      const payload = postCall[1]
      
      // Verify tags are split, trimmed, and filtered
      expect(payload.tags).toEqual(['tag1', 'tag2', 'tag3'])
      expect(payload.tags).not.toContain('')
      expect(payload.tags).not.toContain('  ')
    })
  })

  describe('mutation killers - exact conditionals and operators', () => {
    describe('openPublishModal - exact conditional checks', () => {
      it('should verify exact conditional: if (!activeTab)', () => {
        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab: undefined,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        act(() => {
          result.current.openPublishModal()
        })

        // Verify exact falsy check: if (!activeTab)
        expect(mockShowError).toHaveBeenCalledWith('Select a workflow tab before publishing.')
        expect(result.current.showPublishModal).toBe(false)
      })

      it('should verify exact conditional: activeTab exists', () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        act(() => {
          result.current.openPublishModal()
        })

        // Verify truthy check passes
        expect(mockPublishForm.updateForm).toHaveBeenCalled()
        expect(result.current.showPublishModal).toBe(true)
      })
    })

    describe('handlePublish - exact logical OR checks', () => {
      it('should verify exact logical OR: !activeTab || !activeTab.workflowId - both false', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Both conditions false - should proceed with publish
        expect(mockHttpClient.post).toHaveBeenCalled()
        expect(mockShowError).not.toHaveBeenCalledWith('Save the workflow before publishing to the marketplace.')
      })

      it('should verify exact logical OR: !activeTab || !activeTab.workflowId - first true', async () => {
        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab: undefined,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // First condition true - should show error
        expect(mockShowError).toHaveBeenCalledWith('Save the workflow before publishing to the marketplace.')
        expect(mockHttpClient.post).not.toHaveBeenCalled()
      })

      it('should verify exact logical OR: !activeTab || !activeTab.workflowId - second true', async () => {
        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab: { id: 'tab-1', workflowId: null, name: 'Test' },
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Second condition true - should show error
        expect(mockShowError).toHaveBeenCalledWith('Save the workflow before publishing to the marketplace.')
        expect(mockHttpClient.post).not.toHaveBeenCalled()
      })
    })

    describe('handlePublish - exact ternary operator', () => {
      it('should verify exact ternary: token ? { Authorization: ... } : {} - token exists', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify ternary: token ? { Authorization: ... } : {}
        const postCall = mockHttpClient.post.mock.calls[0]
        const headers = postCall[2]
        expect(headers).toHaveProperty('Authorization', 'Bearer test-token')
      })

      it('should verify exact ternary: token ? { Authorization: ... } : {} - token is null', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: null,
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify ternary: token ? { Authorization: ... } : {}
        const postCall = mockHttpClient.post.mock.calls[0]
        const headers = postCall[2]
        expect(headers).not.toHaveProperty('Authorization')
      })
    })

    describe('handlePublish - exact logical OR in payload', () => {
      it('should verify exact logical OR: estimated_time || undefined - estimated_time is empty string', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        mockPublishForm.form.estimated_time = ''

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify exact logical OR: estimated_time || undefined
        const postCall = mockHttpClient.post.mock.calls[0]
        const payload = postCall[1]
        expect(payload.estimated_time).toBeUndefined()
      })

      it('should verify exact logical OR: estimated_time || undefined - estimated_time has value', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        mockPublishForm.form.estimated_time = '10 min'

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify exact logical OR: estimated_time || undefined
        const postCall = mockHttpClient.post.mock.calls[0]
        const payload = postCall[1]
        expect(payload.estimated_time).toBe('10 min')
      })
    })

    describe('handlePublish - exact string operations', () => {
      it('should verify exact string operations: tags.split().map().filter()', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        mockPublishForm.form.tags = 'tag1,tag2,tag3'

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify exact string operations: tags.split(',').map(tag => tag.trim()).filter(Boolean)
        const postCall = mockHttpClient.post.mock.calls[0]
        const payload = postCall[1]
        expect(payload.tags).toEqual(['tag1', 'tag2', 'tag3'])
      })

      it('should verify exact string operations with whitespace', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        mockPublishForm.form.tags = '  tag1  ,  tag2  ,  tag3  '

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify trim() is called: tags.split(',').map(tag => tag.trim())
        const postCall = mockHttpClient.post.mock.calls[0]
        const payload = postCall[1]
        expect(payload.tags).toEqual(['tag1', 'tag2', 'tag3'])
      })

      it('should verify exact filter(Boolean) removes empty strings', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        mockPublishForm.form.tags = 'tag1,,tag2, ,tag3'

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify filter(Boolean) removes empty strings
        const postCall = mockHttpClient.post.mock.calls[0]
        const payload = postCall[1]
        expect(payload.tags).toEqual(['tag1', 'tag2', 'tag3'])
        expect(payload.tags).not.toContain('')
      })
    })

    describe('handlePublish - exact conditional: response.ok', () => {
      it('should verify exact conditional: if (response.ok) - true branch', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        mockHttpClient.post.mockResolvedValue({
          ok: true,
          json: async () => ({ name: 'Published Workflow' }),
        })

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify exact conditional: if (response.ok) - true branch
        expect(mockShowSuccess).toHaveBeenCalled()
        expect(result.current.showPublishModal).toBe(false)
      })

      it('should verify exact conditional: if (response.ok) - false branch', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        mockHttpClient.post.mockResolvedValue({
          ok: false,
          text: async () => 'Error message',
        })

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify exact conditional: if (response.ok) - false branch
        expect(mockShowError).toHaveBeenCalledWith('Failed to publish: Error message')
        // Modal should remain in its current state (not explicitly closed on error)
        // The modal state depends on whether it was opened before
        expect(result.current.isPublishing).toBe(false)
      })
    })

    describe('handlePublish - exact logical OR in error handling', () => {
      it('should verify exact logical OR: error.message || "Unknown error" - error.message exists', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        const error = new Error('Network error')
        mockHttpClient.post.mockRejectedValue(error)

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify exact logical OR: error.message || 'Unknown error'
        expect(mockShowError).toHaveBeenCalledWith('Failed to publish workflow: Network error')
      })

      it('should verify exact logical OR: error.message || "Unknown error" - error.message is undefined', async () => {
        const activeTab = {
          id: 'tab-1',
          workflowId: 'workflow-1',
          name: 'Test Workflow',
        }

        const error: any = {}
        mockHttpClient.post.mockRejectedValue(error)

        const { result } = renderHook(() =>
          useMarketplacePublishing({
            activeTab,
            token: 'test-token',
            httpClient: mockHttpClient,
            apiBaseUrl: 'http://api.test',
          })
        )

        const mockEvent = { preventDefault: jest.fn() } as any

        await act(async () => {
          await result.current.handlePublish(mockEvent)
        })

        // Verify exact logical OR: error.message || 'Unknown error'
        expect(mockShowError).toHaveBeenCalledWith('Failed to publish workflow: Unknown error')
      })
    })
  })
})
