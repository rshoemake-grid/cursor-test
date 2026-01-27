import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'
import type { HttpClient } from '../types/adapters'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('ResetPasswordPage', () => {
  const mockNavigate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockUseNavigate.mockReturnValue(mockNavigate)
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('?token=test-token'),
      jest.fn(),
    ])
  })

  it('should render reset password page', async () => {
    renderWithRouter(<ResetPasswordPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Reset Password/ })).toBeInTheDocument()
    })
  })

  it('should show error when token is missing', async () => {
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(''),
      jest.fn(),
    ])

    renderWithRouter(<ResetPasswordPage />)

    await waitFor(() => {
      expect(screen.getByText(/Reset token is missing/)).toBeInTheDocument()
    })
  })

  it('should show error when token is missing on submit', async () => {
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(''),
      jest.fn(),
    ])

    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /Reset Password/ })

    fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } })
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
    }
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Reset token is missing/)).toBeInTheDocument()
    })
  })

  it('should handle password reset', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /Reset Password/ })

    fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } })
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
    }
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/reset-password',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'test-token', new_password: 'newpassword123' }),
        })
      )
    })
  })

  it('should show error when passwords do not match', async () => {
    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /Reset Password/ })

    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } })
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], { target: { value: 'different' } })
    }
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('should show error when password is too short', async () => {
    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /Reset Password/ })

    fireEvent.change(passwordInputs[0], { target: { value: '12345' } })
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], { target: { value: '12345' } })
    }
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters/)).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', async () => {
    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const passwordInput = passwordInputs[0] as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const toggleButtons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('type') === 'button' && btn.querySelector('svg')
    )
    if (toggleButtons.length > 0) {
      fireEvent.click(toggleButtons[0])
      expect(passwordInput.type).toBe('text')
    }
  })

  it('should show success message after successful reset', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /Reset Password/ })

    fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } })
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
    }
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful!')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle API error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Invalid token' }),
    })

    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /Reset Password/ })

    fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } })
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
    }
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeInTheDocument()
    })
  })

  it('should submit form when Enter key is pressed and token exists', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    renderWithRouter(<ResetPasswordPage />)

    await waitFor(() => {
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
      const passwordInput = passwordInputs[0]
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
      if (passwordInputs.length > 1) {
        fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
      }
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' })
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should toggle confirm password visibility', async () => {
    renderWithRouter(<ResetPasswordPage />)

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
    const confirmPasswordInput = passwordInputs.length > 1 ? passwordInputs[1] : passwordInputs[0]
    expect((confirmPasswordInput as HTMLInputElement).type).toBe('password')

    const toggleButtons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('type') === 'button' && btn.querySelector('svg')
    )
    if (toggleButtons.length > 1) {
      fireEvent.click(toggleButtons[1])
      expect((confirmPasswordInput as HTMLInputElement).type).toBe('text')
    }
  })

  describe('Dependency Injection', () => {
    it('should use injected HTTP client', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        } as Response),
        put: jest.fn(),
        delete: jest.fn(),
      }

      renderWithRouter(<ResetPasswordPage httpClient={mockHttpClient} />)

      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
      const submitButton = screen.getByRole('button', { name: /Reset Password/ })

      fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } })
      if (passwordInputs.length > 1) {
        fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
      }
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining('/auth/reset-password'),
          expect.objectContaining({ token: 'test-token', new_password: 'newpassword123' }),
          expect.any(Object)
        )
      })
    })

    it('should use injected API base URL', async () => {
      const mockHttpClient: HttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        } as Response),
        put: jest.fn(),
        delete: jest.fn(),
      }

      renderWithRouter(
        <ResetPasswordPage 
          httpClient={mockHttpClient} 
          apiBaseUrl="https://custom-api.example.com/api"
        />
      )

      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
      const submitButton = screen.getByRole('button', { name: /Reset Password/ })

      fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } })
      if (passwordInputs.length > 1) {
        fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
      }
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          'https://custom-api.example.com/api/auth/reset-password',
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

      renderWithRouter(<ResetPasswordPage httpClient={mockHttpClient} />)

      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/)
      const submitButton = screen.getByRole('button', { name: /Reset Password/ })

      fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } })
      if (passwordInputs.length > 1) {
        fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } })
      }
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })
  })
})
