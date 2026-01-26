import React from 'react'
import { render, screen } from '@testing-library/react'
import DatabaseNode from './DatabaseNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('DatabaseNode', () => {
  it('should render database node', () => {
    const nodeData = {
      label: 'My Database',
    }

    renderWithProvider(
      <DatabaseNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('My Database')).toBeInTheDocument()
  })

  it('should render with default label', () => {
    const nodeData = {
      label: '',
    }

    renderWithProvider(
      <DatabaseNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('Database')).toBeInTheDocument()
  })

  it('should render database type', () => {
    const nodeData = {
      label: 'My Database',
      input_config: {
        database_type: 'postgresql',
      },
    }

    renderWithProvider(
      <DatabaseNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Type: postgresql/)).toBeInTheDocument()
  })

  it('should render database name', () => {
    const nodeData = {
      label: 'My Database',
      input_config: {
        database_name: 'mydb',
      },
    }

    renderWithProvider(
      <DatabaseNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/DB: mydb/)).toBeInTheDocument()
  })

  it('should render mode', () => {
    const nodeData = {
      label: 'My Database',
      input_config: {
        mode: 'read',
      },
    }

    renderWithProvider(
      <DatabaseNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Mode: Read/)).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const nodeData = {
      label: 'My Database',
    }

    const { container } = renderWithProvider(
      <DatabaseNode data={nodeData} selected={true} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-indigo-500')
    expect(nodeElement).toBeInTheDocument()
  })

  it('should show error state', () => {
    const nodeData = {
      label: 'My Database',
      executionStatus: 'failed',
    }

    const { container } = renderWithProvider(
      <DatabaseNode data={nodeData} selected={false} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-red-500')
    expect(nodeElement).toBeInTheDocument()
  })
})
