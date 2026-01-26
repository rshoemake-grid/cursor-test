import React from 'react'
import { render, screen } from '@testing-library/react'
import LocalFileSystemNode from './LocalFileSystemNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('LocalFileSystemNode', () => {
  it('should render local file system node', () => {
    const nodeData = {
      label: 'My Files',
    }

    renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('My Files')).toBeInTheDocument()
  })

  it('should render with default label', () => {
    const nodeData = {
      label: '',
    }

    renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('Local File System')).toBeInTheDocument()
  })

  it('should render file path', () => {
    const nodeData = {
      label: 'My Files',
      input_config: {
        file_path: '/path/to/file.txt',
      },
    }

    renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/File: file.txt/)).toBeInTheDocument()
  })

  it('should render file pattern', () => {
    const nodeData = {
      label: 'My Files',
      input_config: {
        file_pattern: '*.txt',
      },
    }

    renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Pattern: \*\.txt/)).toBeInTheDocument()
  })

  it('should render write mode with overwrite', () => {
    const nodeData = {
      label: 'My Files',
      input_config: {
        mode: 'write',
        overwrite: true,
      },
    }

    renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Mode: Write/)).toBeInTheDocument()
  })

  it('should render write mode with auto-increment', () => {
    const nodeData = {
      label: 'My Files',
      input_config: {
        mode: 'write',
        overwrite: false,
      },
    }

    renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Auto-increment/)).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const nodeData = {
      label: 'My Files',
    }

    const { container } = renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={true} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-green-500')
    expect(nodeElement).toBeInTheDocument()
  })

  it('should show error state', () => {
    const nodeData = {
      label: 'My Files',
      executionStatus: 'failed',
    }

    const { container } = renderWithProvider(
      <LocalFileSystemNode data={nodeData} selected={false} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-red-500')
    expect(nodeElement).toBeInTheDocument()
  })
})
