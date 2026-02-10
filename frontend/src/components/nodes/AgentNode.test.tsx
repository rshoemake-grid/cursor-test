import React from 'react'
import { render, screen } from '@testing-library/react'
import AgentNode from './AgentNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('AgentNode', () => {
  it('should render agent node', () => {
    const nodeData = {
      label: 'Test Agent',
      name: 'Test Agent',
    }

    renderWithProvider(
      <AgentNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
  })

  it('should render with description', () => {
    const nodeData = {
      label: 'Test Agent',
      description: 'Test description',
    }

    renderWithProvider(
      <AgentNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should render with model', () => {
    const nodeData = {
      label: 'Test Agent',
      agent_config: {
        model: 'gpt-4',
      },
    }

    renderWithProvider(
      <AgentNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('gpt-4')).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const nodeData = {
      label: 'Test Agent',
    }

    const { container } = renderWithProvider(
      <AgentNode data={nodeData} selected={true} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-primary-500')
    expect(nodeElement).toBeInTheDocument()
  })

  it('should show error state', () => {
    const nodeData = {
      label: 'Test Agent',
      executionStatus: 'failed',
    }

    const { container } = renderWithProvider(
      <AgentNode data={nodeData} selected={false} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-red-500')
    expect(nodeElement).toBeInTheDocument()
  })

  it('should handle empty label', () => {
    const nodeData = {
      label: '',
    }

    const { container } = renderWithProvider(
      <AgentNode data={nodeData} selected={false} id="node-1" />
    )

    // Should render without crashing - check for node element
    const nodeElement = container.querySelector('.bg-white')
    expect(nodeElement).toBeInTheDocument()
  })
})
