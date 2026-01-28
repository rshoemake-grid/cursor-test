import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SettingsPage from './SettingsPage'
import { useAuth } from '../contexts/AuthContext'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'

// Re-export showConfirm for use in tests
export { showConfirm }
import type { StorageAdapter, HttpClient, ConsoleAdapter } from '../types/adapters'
import { api } from '../api/client'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = async (callback: () => void | Promise<void>, timeout = 2000) => {
  return await waitFor(callback, { timeout })
}

// Mock dependencies
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

jest.mock('../api/client', () => ({
  api: {
    getLLMSettings: jest.fn(),
  },
  createApiClient: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

export const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
export const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
export const mockShowError = showError as jest.MockedFunction<typeof showError>
export const mockApi = api as jest.Mocked<typeof api>

export const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

export const setupMocks = () => {
  jest.clearAllMocks()
  localStorage.clear()
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: { id: '1', username: 'testuser' },
    token: 'token',
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  } as any)
  ;(showConfirm as jest.Mock).mockResolvedValue(true)
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ providers: [], iteration_limit: 10, default_model: '' }),
  })
  mockApi.getLLMSettings = jest.fn().mockResolvedValue({
    providers: [],
    iteration_limit: 10,
    default_model: '',
  })
}

export { waitForWithTimeout }
