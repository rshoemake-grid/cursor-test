import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

// Mock components
jest.mock('./components/WorkflowTabs', () => ({
  __esModule: true,
  default: () => <div>WorkflowTabs</div>,
}))

jest.mock('./components/WorkflowList', () => ({
  __esModule: true,
  default: ({ onSelectWorkflow, onBack }: any) => (
    <div>
      <div>WorkflowList</div>
      <button onClick={() => onSelectWorkflow('workflow-1')}>Select</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}))

jest.mock('./components/ExecutionViewer', () => ({
  __esModule: true,
  default: ({ executionId }: any) => <div>ExecutionViewer: {executionId}</div>,
}))

jest.mock('./pages/AuthPage', () => ({
  __esModule: true,
  default: () => <div>AuthPage</div>,
}))

jest.mock('./pages/ForgotPasswordPage', () => ({
  __esModule: true,
  default: () => <div>ForgotPasswordPage</div>,
}))

jest.mock('./pages/ResetPasswordPage', () => ({
  __esModule: true,
  default: () => <div>ResetPasswordPage</div>,
}))

jest.mock('./pages/MarketplacePage', () => ({
  __esModule: true,
  default: () => <div>MarketplacePage</div>,
}))

jest.mock('./pages/SettingsPage', () => ({
  __esModule: true,
  default: () => <div>SettingsPage</div>,
}))

jest.mock('./utils/confirm', () => ({
  showConfirm: jest.fn().mockResolvedValue(true),
}))

const renderApp = () => {
  return render(<App />)
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('should render auth page at /auth route', () => {
    window.history.pushState({}, '', '/auth')
    renderApp()

    expect(screen.getByText('AuthPage')).toBeInTheDocument()
  })

  it('should render forgot password page at /forgot-password route', () => {
    window.history.pushState({}, '', '/forgot-password')
    renderApp()

    expect(screen.getByText('ForgotPasswordPage')).toBeInTheDocument()
  })

  it('should render reset password page at /reset-password route', () => {
    window.history.pushState({}, '', '/reset-password')
    renderApp()

    expect(screen.getByText('ResetPasswordPage')).toBeInTheDocument()
  })

  it('should render authenticated layout at root route', () => {
    window.history.pushState({}, '', '/')
    renderApp()

    expect(screen.getByText(/Agentic Workflow Builder/)).toBeInTheDocument()
  })

  it('should render marketplace page at /marketplace route', () => {
    window.history.pushState({}, '', '/marketplace')
    renderApp()

    expect(screen.getByText('MarketplacePage')).toBeInTheDocument()
  })

  it('should render settings page at /settings route', () => {
    window.history.pushState({}, '', '/settings')
    renderApp()

    expect(screen.getByText('SettingsPage')).toBeInTheDocument()
  })

  it('should render workflow tabs in builder view', () => {
    window.history.pushState({}, '', '/')
    renderApp()

    expect(screen.getByText('WorkflowTabs')).toBeInTheDocument()
  })

  it('should render navigation buttons', () => {
    window.history.pushState({}, '', '/')
    renderApp()

    expect(screen.getByText('Builder')).toBeInTheDocument()
    expect(screen.getByText('Workflows')).toBeInTheDocument()
    expect(screen.getByText('Marketplace')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})
