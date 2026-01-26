import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AuthPage from './AuthPage'
import { useAuth } from '../contexts/AuthContext'

// Mock dependencies
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AuthPage', () => {
  const mockLogin = jest.fn()
  const mockRegister = jest.fn()
  const mockNavigate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: mockLogin,
      logout: jest.fn(),
      register: mockRegister,
    } as any)
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)
  })

  it('should render login form by default', () => {
    renderWithRouter(<AuthPage />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('should switch to register form', () => {
    renderWithRouter(<AuthPage />)

    const switchButton = screen.getByText(/Don't have an account/i)
    fireEvent.click(switchButton)

    const createAccountElements = screen.getAllByText('Create Account')
    expect(createAccountElements.length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText(/your@email.com/)).toBeInTheDocument()
  })

  it('should handle login', async () => {
    mockLogin.mockResolvedValue(undefined)

    renderWithRouter(<AuthPage />)

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: /Sign In/ })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123', false)
    })
  })

  it('should handle register', async () => {
    mockRegister.mockResolvedValue(undefined)

    renderWithRouter(<AuthPage />)

    // Switch to register
    const switchButton = screen.getByText(/Don't have an account/i)
    fireEvent.click(switchButton)

    await waitFor(() => {
      const usernameInput = screen.getByPlaceholderText('Enter your username')
      const emailInput = screen.getByPlaceholderText(/your@email.com/)
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /Create Account/ })

      fireEvent.change(usernameInput, { target: { value: 'newuser' } })
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled()
    })
  })

  it('should toggle password visibility', () => {
    renderWithRouter(<AuthPage />)

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    // Find eye icon button
    const eyeIcon = passwordInput.parentElement?.querySelector('button')
    if (eyeIcon) {
      fireEvent.click(eyeIcon)
      expect(passwordInput.type).toBe('text')
    }
  })

  it('should handle remember me checkbox', () => {
    renderWithRouter(<AuthPage />)

    const rememberMeCheckbox = screen.getByLabelText(/Keep me logged in/) as HTMLInputElement
    fireEvent.click(rememberMeCheckbox)

    expect(rememberMeCheckbox.checked).toBe(true)
  })

  it('should display error message on login failure', async () => {
    const error = new Error('Invalid credentials')
    mockLogin.mockRejectedValue(error)

    renderWithRouter(<AuthPage />)

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: /Sign In/ })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithRouter(<AuthPage />)

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const form = usernameInput.closest('form')
    
    if (form) {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Processing/ })
        expect(submitButton).toBeDisabled()
      })
    }
  })
})
