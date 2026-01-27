import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import ForgotPasswordPage from './ForgotPasswordPage'
import type { HttpClient } from '../types/adapters'

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

  it('should submit form when Enter key is pressed', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'reset-token-123' }),
    })

    renderWithRouter(<ForgotPasswordPage />)

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.keyDown(emailInput, { key: 'Enter', code: 'Enter' })
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  describe('Dependency Injection', () => {
    it('should use injected HTTP client', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ token: 'reset-token-123' }),
        } as Response),
        put: jest.fn(),
        delete: jest.fn(),
      }

      renderWithRouter(<ForgotPasswordPage httpClient={mockHttpClient} />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/your@email.com/)
        const submitButton = screen.getByRole('button', { name: /Send Reset Link/ })

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining('/auth/forgot-password'),
          { email: 'test@example.com' },
          expect.any(Object)
        )
      })
    })

    it('should use injected API base URL', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ token: 'reset-token-123' }),
        } as Response),
        put: jest.fn(),
        delete: jest.fn(),
      }

      renderWithRouter(
        <ForgotPasswordPage 
          httpClient={mockHttpClient} 
          apiBaseUrl="https://custom-api.example.com/api"
        />
      )

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/your@email.com/)
        const submitButton = screen.getByRole('button', { name: /Send Reset Link/ })

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          'https://custom-api.example.com/api/auth/forgot-password',
          expect.any(Object),
          expect.any(Object)
        )
      })
    })

    it('should handle HTTP client errors gracefully', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn().mockRejectedValue(new Error('Network error')),
        put: jest.fn(),
        delete: jest.fn(),
      }

      renderWithRouter(<ForgotPasswordPage httpClient={mockHttpClient} />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/your@email.com/)
        const submitButton = screen.getByRole('button', { name: /Send Reset Link/ })

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })
  })
})
