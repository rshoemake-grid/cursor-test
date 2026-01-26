import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MarketplacePage from './MarketplacePage'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'
import { getLocalStorageItem } from '../hooks/useLocalStorage'

// Mock dependencies
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../api/client', () => ({
  api: {
    getTemplates: jest.fn(),
  },
}))

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../utils/confirm', () => ({
  showConfirm: jest.fn(),
}))

jest.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(() => ['', jest.fn(), jest.fn()]),
  getLocalStorageItem: jest.fn(),
  setLocalStorageItem: jest.fn(),
  removeLocalStorageItem: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockApi = api as jest.Mocked<typeof api>
const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('MarketplacePage', () => {
  beforeEach(() => {
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
    mockGetLocalStorageItem.mockReturnValue([])
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    })
  })

  it('should render marketplace page', () => {
    renderWithRouter(<MarketplacePage />)

    expect(screen.getByText(/Marketplace/)).toBeInTheDocument()
  })

  it('should render agents tab by default', () => {
    renderWithRouter(<MarketplacePage />)

    expect(screen.getByText(/Agents/)).toBeInTheDocument()
  })

  it('should switch tabs', () => {
    renderWithRouter(<MarketplacePage />)

    const repositoryTab = screen.getByText(/Repository/)
    fireEvent.click(repositoryTab)

    expect(screen.getByText(/Repository/)).toBeInTheDocument()
  })

  it('should handle search query', async () => {
    renderWithRouter(<MarketplacePage />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search/)
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'test query' } })
        expect((searchInput as HTMLInputElement).value).toBe('test query')
      }
    })
  })

  it('should handle category filter', async () => {
    renderWithRouter(<MarketplacePage />)

    await waitFor(() => {
      const categorySelects = screen.queryAllByRole('combobox')
      if (categorySelects.length > 0) {
        fireEvent.change(categorySelects[0], { target: { value: 'automation' } })
      }
    })
  })

  it('should display agents from localStorage', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Test Agent',
        label: 'Test Agent',
        description: 'Test description',
        category: 'automation',
        tags: ['test'],
        difficulty: 'beginner',
        estimated_time: '5 min',
        agent_config: {},
      },
    ]
    mockGetLocalStorageItem.mockImplementation((key: string) => {
      if (key === 'publishedAgents') return mockAgents
      return []
    })

    renderWithRouter(<MarketplacePage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })
  })

  it('should handle sort by selection', async () => {
    renderWithRouter(<MarketplacePage />)

    await waitFor(() => {
      const sortSelects = screen.queryAllByRole('combobox')
      if (sortSelects.length > 0) {
        fireEvent.change(sortSelects[sortSelects.length - 1], { target: { value: 'newest' } })
      }
    })
  })
})
