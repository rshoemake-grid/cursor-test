/**
 * Settings Header Component Tests
 * Tests for settings header component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SettingsHeader } from './SettingsHeader'
import { useAuth } from '../../contexts/AuthContext'

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('SettingsHeader', () => {
  const mockOnSyncClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderWithAuth = (isAuthenticated: boolean, user?: { username?: string; email?: string }) => {
    mockUseAuth.mockReturnValue({
      isAuthenticated,
      user: user || null,
      token: isAuthenticated ? 'mock-token' : null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    } as any)

    return render(
      <BrowserRouter>
        <SettingsHeader onSyncClick={mockOnSyncClick} />
      </BrowserRouter>
    )
  }

  it('should render header with title and description', () => {
    renderWithAuth(false)

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Configure LLM providers and workflow generation limits')).toBeInTheDocument()
  })

  it('should render back button', () => {
    renderWithAuth(false)

    const backButton = screen.getByText('Back to Main')
    expect(backButton).toBeInTheDocument()
  })

  it('should navigate to home when back button is clicked', () => {
    renderWithAuth(false)

    const backButton = screen.getByText('Back to Main')
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should render sync button', () => {
    renderWithAuth(false)

    const syncButton = screen.getByText('Sync Now')
    expect(syncButton).toBeInTheDocument()
  })

  it('should call onSyncClick when sync button is clicked', () => {
    renderWithAuth(false)

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    expect(mockOnSyncClick).toHaveBeenCalledTimes(1)
  })

  it('should show login message when not authenticated', () => {
    renderWithAuth(false)

    expect(screen.getByText('Login to sync your LLM providers across devices.')).toBeInTheDocument()
  })

  it('should show username when authenticated with username', () => {
    renderWithAuth(true, { username: 'testuser' })

    expect(screen.getByText(/Signed in as testuser/)).toBeInTheDocument()
  })

  it('should show email when authenticated with email but no username', () => {
    renderWithAuth(true, { email: 'test@example.com' })

    expect(screen.getByText(/Signed in as test@example.com/)).toBeInTheDocument()
  })

  it('should show fallback message when authenticated but no username or email', () => {
    renderWithAuth(true, {})

    expect(screen.getByText(/Signed in as your account/)).toBeInTheDocument()
  })

  it('should show fallback message when user is null', () => {
    renderWithAuth(true)

    expect(screen.getByText(/Signed in as your account/)).toBeInTheDocument()
  })

  it('should prioritize username over email when both are present', () => {
    renderWithAuth(true, { username: 'testuser', email: 'test@example.com' })

    expect(screen.getByText(/Signed in as testuser/)).toBeInTheDocument()
    expect(screen.queryByText(/test@example.com/)).not.toBeInTheDocument()
  })
})
