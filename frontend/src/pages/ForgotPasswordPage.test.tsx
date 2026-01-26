import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import ForgotPasswordPage from './ForgotPasswordPage'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('ForgotPasswordPage', () => {
  const mockNavigate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockUseNavigate.mockReturnValue(mockNavigate)
  })

  it('should render forgot password page', async () => {
    renderWithRouter(<ForgotPasswordPage />)

    await waitFor(() => {
      expect(screen.getByText('Forgot Password?')).toBeInTheDocument()
    })
  })

  it('should handle email submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'reset-token-123' }),
    })

    renderWithRouter(<ForgotPasswordPage />)

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/ })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      )
    })
  })

  it('should show success message after submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'reset-token-123' }),
    })

    renderWithRouter(<ForgotPasswordPage />)

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/ })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show reset token in development mode', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'reset-token-123' }),
    })

    renderWithRouter(<ForgotPasswordPage />)

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/ })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText('reset-token-123')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle API error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Email not found' }),
    })

    renderWithRouter(<ForgotPasswordPage />)

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/)
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/ })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument()
    })
  })

  it('should navigate back to auth page', async () => {
    renderWithRouter(<ForgotPasswordPage />)

    await waitFor(() => {
      const backButton = screen.getByText(/Back to Login/)
      fireEvent.click(backButton)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/auth')
  })
})
