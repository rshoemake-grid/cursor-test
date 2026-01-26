import React from 'react'
import { render, screen } from '@testing-library/react'
import GCPBucketNode from './GCPBucketNode'
import { ReactFlowProvider } from '@xyflow/react'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  )
}

describe('GCPBucketNode', () => {
  it('should render GCP bucket node', () => {
    const nodeData = {
      label: 'My Bucket',
    }

    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('My Bucket')).toBeInTheDocument()
  })

  it('should render with default label', () => {
    const nodeData = {
      label: '',
    }

    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText('GCP Bucket')).toBeInTheDocument()
  })

  it('should render bucket name', () => {
    const nodeData = {
      label: 'My Bucket',
      input_config: {
        bucket_name: 'my-bucket',
      },
    }

    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Bucket: my-bucket/)).toBeInTheDocument()
  })

  it('should render object path', () => {
    const nodeData = {
      label: 'My Bucket',
      input_config: {
        object_path: 'path/to/file.txt',
      },
    }

    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/File: file.txt/)).toBeInTheDocument()
  })

  it('should render mode', () => {
    const nodeData = {
      label: 'My Bucket',
      input_config: {
        mode: 'write',
      },
    }

    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />
    )

    expect(screen.getByText(/Mode: Write/)).toBeInTheDocument()
  })

  it('should show selected state', () => {
    const nodeData = {
      label: 'My Bucket',
    }

    const { container } = renderWithProvider(
      <GCPBucketNode data={nodeData} selected={true} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-orange-500')
    expect(nodeElement).toBeInTheDocument()
  })

  it('should show error state', () => {
    const nodeData = {
      label: 'My Bucket',
      executionStatus: 'failed',
    }

    const { container } = renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />
    )

    const nodeElement = container.querySelector('.border-red-500')
    expect(nodeElement).toBeInTheDocument()
  })
})
