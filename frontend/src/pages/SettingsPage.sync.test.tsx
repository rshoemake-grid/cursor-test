import { setupMocks, mockUseAuth, mockShowSuccess, mockShowError, mockApi, renderWithRouter, waitForWithTimeout } from './SettingsPage.test.shared'
import SettingsPage from './SettingsPage'
import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import type { HttpClient } from '../types/adapters'

describe('SettingsPage - Manual Sync', () => {
  beforeEach(() => {
    setupMocks()
  })

  it('should handle handleManualSync when authenticated', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    renderWithRouter(<SettingsPage />)

    await waitForWithTimeout(() => {
      expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0)
    }, 3000)

    const syncButtons = screen.queryAllByText(/Sync|Manual Sync/)
    if (syncButtons.length > 0) {
      fireEvent.click(syncButtons[0])
      await waitForWithTimeout(() => {
        expect(mockShowSuccess).toHaveBeenCalled()
      }, 3000)
    }
  })

  it('should handle handleManualSync when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)

    renderWithRouter(<SettingsPage />)

    await waitForWithTimeout(() => {
      expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0)
    }, 3000)

    const syncButtons = screen.queryAllByText(/Sync|Manual Sync/)
    if (syncButtons.length > 0) {
      fireEvent.click(syncButtons[0])
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith('Sign in to sync your LLM settings with the server.')
      }, 3000)
    }
  })

  it('should handle handleManualSync error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Sync failed'))

    renderWithRouter(<SettingsPage />)

    await waitForWithTimeout(() => {
      expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0)
    }, 3000)

    const syncButtons = screen.queryAllByText(/Sync|Manual Sync/)
    if (syncButtons.length > 0) {
      fireEvent.click(syncButtons[0])
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled()
      }, 3000)
    }
  })

  describe('Manual sync with HTTP client', () => {
    it('should handle manual sync when authenticated', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ providers: [], iteration_limit: 10, default_model: '' }),
        } as Response),
        post: jest.fn().mockResolvedValue({
          ok: true,
        } as Response),
        put: jest.fn(),
        delete: jest.fn(),
      }

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', username: 'testuser' },
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      } as any)

      renderWithRouter(<SettingsPage httpClient={mockHttpClient} />)

      await waitForWithTimeout(() => {
        const syncButtons = screen.queryAllByText(/Sync|Manual Sync/)
        if (syncButtons.length > 0) {
          fireEvent.click(syncButtons[0])
        }
      }, 3000)

      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalled()
      }, 3000)
    })

    it('should handle manual sync when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      } as any)

      renderWithRouter(<SettingsPage />)

      await waitForWithTimeout(() => {
        const syncButtons = screen.queryAllByText(/Sync|Manual Sync/)
        if (syncButtons.length > 0) {
          fireEvent.click(syncButtons[0])
        }
      }, 3000)

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Sign in'))
      }, 3000)
    })

    it('should handle manual sync error', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ providers: [], iteration_limit: 10, default_model: '' }),
        } as Response),
        post: jest.fn().mockResolvedValue({
          ok: false,
        } as Response),
        put: jest.fn(),
        delete: jest.fn(),
      }

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', username: 'testuser' },
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      } as any)

      renderWithRouter(<SettingsPage httpClient={mockHttpClient} />)

      await waitForWithTimeout(() => {
        const syncButtons = screen.queryAllByText(/Sync|Manual Sync/)
        if (syncButtons.length > 0) {
          fireEvent.click(syncButtons[0])
        }
      }, 3000)

      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled()
      }, 3000)
    })
  })
})
