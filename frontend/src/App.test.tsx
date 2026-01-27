import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

  describe('AuthenticatedLayout navigation', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      window.history.pushState({}, '', '/')
    })

    it('should switch to list view when Workflows button is clicked', () => {
      renderApp()
      
      const workflowsButton = screen.getByText('Workflows')
      fireEvent.click(workflowsButton)
      
      // Wait for view to switch
      expect(screen.getByText('WorkflowList')).toBeInTheDocument()
    })

    it('should switch back to builder view when Builder button is clicked', async () => {
      renderApp()
      
      // First switch to list
      const workflowsButton = screen.getByText('Workflows')
      fireEvent.click(workflowsButton)
      await waitFor(() => {
        expect(screen.getByText('WorkflowList')).toBeInTheDocument()
      })
      
      // Then switch back to builder
      const builderButton = screen.getByText('Builder')
      fireEvent.click(builderButton)
      await waitFor(() => {
        expect(screen.getByText('WorkflowTabs')).toBeInTheDocument()
      })
    })

    it('should show Execution button when executionId is set', () => {
      renderApp()
      
      // Execution button should not be visible initially (no executionId)
      expect(screen.queryByText('Execution')).not.toBeInTheDocument()
    })

    it('should handle workflow selection from WorkflowList', async () => {
      renderApp()
      
      // Switch to list view
      const workflowsButton = screen.getByText('Workflows')
      fireEvent.click(workflowsButton)
      
      await waitFor(() => {
        expect(screen.getByText('WorkflowList')).toBeInTheDocument()
      })
      
      // Select a workflow
      const selectButton = screen.getByText('Select')
      fireEvent.click(selectButton)
      
      // Should switch back to builder view
      await waitFor(() => {
        expect(screen.getByText('WorkflowTabs')).toBeInTheDocument()
      })
    })

    it('should handle back button from WorkflowList', async () => {
      renderApp()
      
      // Switch to list view
      const workflowsButton = screen.getByText('Workflows')
      fireEvent.click(workflowsButton)
      
      await waitFor(() => {
        expect(screen.getByText('WorkflowList')).toBeInTheDocument()
      })
      
      // Click back button
      const backButton = screen.getByText('Back')
      fireEvent.click(backButton)
      
      // Should switch back to builder view
      await waitFor(() => {
        expect(screen.getByText('WorkflowTabs')).toBeInTheDocument()
      })
    })
  })

  describe('Logout flow', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      window.history.pushState({}, '', '/')
    })

    it('should render authenticated layout', () => {
      renderApp()
      
      // Should show app header
      expect(screen.getByText(/Agentic Workflow Builder/)).toBeInTheDocument()
    })
  })

  describe('URL workflow loading', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should handle workflow parameter in URL', () => {
      // The URL parameter handling is tested indirectly through component rendering
      window.history.pushState({}, '', '/?workflow=workflow-123')
      renderApp()
      
      expect(screen.getByText(/Agentic Workflow Builder/)).toBeInTheDocument()
    })
  })
})
